const { Client } = require("@notionhq/client");
const Chart = require("../models/Chart");
const Entry = require("../models/Entry");
const { ObjectID } = require("mongodb");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const charts = await Chart.find({ user: req.user.id });
      res.render("profile.ejs", { charts: charts, user: req.user });
    } catch (err) {
      console.log(err);
    }
  },
  getAddNewChart: async (req, res) => {
    try {
      res.render("addNewChart.ejs", {
        user: req.user,
        newChartMode: req.params.chartMode,
      });
    } catch (err) {
      console.log(err);
    }
  },
  getChart: async (req, res) => {
    try {
      const chart = await Chart.findById(req.params.id);
      const databaseId = chart.databaseId;
      const numberOfHabits = chart.numberOfHabits;
      const habitNames = chart.habitNames;
      const trackingName = chart.trackingName;

      const chartId = new ObjectID(req.params.id);

      const dbEntries = await Entry.find({ chartId: chartId });

      const today = new Date();
      const dayOfWeek = today.getDay();

      const notion = new Client({
        auth: chart.integrationKey,
      });

      if (dayOfWeek === "Monday") {
        const data = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: "Date",
            date: {
              past_week: {},
            },
          },
          sorts: [
            {
              property: "Date",
              direction: "ascending",
            },
          ],
        });

        let notionResults = data.results;
        let notionEntries = getEntries(
          notionResults,
          numberOfHabits,
          habitNames,
          trackingName,
          req.params.id
        );

        await Entry.insertMany(notionEntries);
      }

      const data = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: "Date",
          date: {
            this_week: {},
          },
        },
        sorts: [
          {
            property: "Date",
            direction: "ascending",
          },
        ],
      });

      let notionResults = data.results;
      let notionEntries = getEntries(
        notionResults,
        numberOfHabits,
        habitNames,
        trackingName
      );

      res.render("chart.ejs", {
        chart: chart,
        user: req.user,
        notionEntries: notionEntries,
        dbEntries: dbEntries,
      });
    } catch (err) {
      console.log(err);
    }
  },
  createChart: async (req, res) => {
    try {
      let chartMode = req.params.chartMode;
      let integrationKey = req.body.integrationKey;
      let databaseId = req.body.databaseId;
      let numberOfHabits = Number(req.body.numberOfHabits);
      let habitNames = req.body.habitNames;
      let trackingName = req.body.trackingName.toLowerCase();
      let chartBackground = req.body.chartBackground;
      let chartColor = req.body.chartColor;

      const newChart = await Chart.create({
        user: req.user.id,
        integrationKey: integrationKey,
        chartName: req.body.chartName,
        databaseId: databaseId,
        numberOfHabits: numberOfHabits,
        habitNames: habitNames,
        chartColor: chartColor,
        chartMode: chartMode,
        chartBackground: chartBackground,
        trackingName: trackingName,
      });

      const chartId = newChart._id;

      const today = new Date();

      const monthsBeforeToday = getMonthsBeforeToday(today);
      const currentMonth = today.toLocaleString("default", { month: "long" });
      const dayOfMonth = today.getDate();

      // Send Notion entries for previous months
      for (let i = 0; i < monthsBeforeToday.length; i++) {
        const month = monthsBeforeToday[i];

        const notion = new Client({
          auth: integrationKey,
        });

        const data = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: "Month",
            select: {
              equals: month,
            },
          },
          sorts: [
            {
              property: "Date",
              direction: "ascending",
            },
          ],
        });

        let notionResults = data.results;

        let notionEntries = getEntries(
          notionResults,
          numberOfHabits,
          habitNames,
          trackingName,
          chartId
        );

        await Entry.insertMany(notionEntries);
      }

      const notionForMonth = new Client({
        auth: integrationKey,
      });

      // Send Notion entries for current month
      if (dayOfMonth !== 1) {
        const dataForMonth = await notionForMonth.databases.query({
          database_id: databaseId,
          filter: {
            property: "Month",
            select: {
              equals: currentMonth,
            },
          },
          sorts: [
            {
              property: "Date",
              direction: "ascending",
            },
          ],
        });

        let notionResultsForMonth = dataForMonth.results;
        let notionEntriesForMonth = getEntries(
          notionResultsForMonth,
          numberOfHabits,
          habitNames,
          trackingName,
          chartId
        );

        await Entry.insertMany(notionEntriesForMonth);
      }

      console.log("Chart has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.log(err);
    }
  },
};

// ******** HELPER FUNCTIONS ********

function getEntries(
  notionResults,
  numberOfHabits,
  habitNames,
  trackingName,
  chartId = false
) {
  let entries = [];

  notionResults.forEach((el) => {
    let prop = el.properties;

    let percentage = Number(prop["Completed"].formula.string.split("%")[0]);

    let date = prop["Date"].date.start;

    let dateObject = new Date(date);

    let dayOfYear = Math.ceil((dateObject - new Date(2024, 0, 0)) / 86400000);

    let formattedDate = formatDate(date);

    let habits = [];

    for (let i = 0; i < numberOfHabits; i++) {
      let completed = prop[habitNames[i]].checkbox;
      habits.push(completed);
    }

    let habitsDone = habits.filter((completed) => completed === true).length;
    let noHabitsDone = habits.filter((completed) => completed === false).length;

    let hoverText =
      noHabitsDone === numberOfHabits
        ? `Nothing logged on ${formattedDate}.`
        : `${habitsDone}/${habits.length} ${trackingName} on ${formattedDate}.`;

    let opacity = getOpacity(percentage);

    let entry;

    if (chartId) {
      entry = {
        chartId: chartId,
        date: date,
        dayOfYear: dayOfYear,
        hoverText: hoverText,
        opacity: opacity,
      };
    } else {
      entry = {
        date: date,
        dayOfYear: dayOfYear,
        hoverText: hoverText,
        opacity: opacity,
      };
    }

    entries.push(entry);
  });

  return entries;
}

function formatDate(dateString) {
  const date = new Date(dateString.replace(/-/g, "/").replace(/T.+/, ""));

  // Get the day, month, and suffix
  const formattedDay = date.getDate();
  const formattedMonth = date.toLocaleString("default", { month: "long" });
  const suffix = getDaySuffix(formattedDay);

  // Return the formatted date
  return `${formattedMonth} ${formattedDay}${suffix}`;
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function getOpacity(percentage) {
  // Ensure the percentage is within the valid range [0, 100]
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Map the percentage to the desired range [0, 4] in increments of 0.25
  const scaledValue = clampedPercentage / 25;

  // Round the result to the nearest integer
  const roundedValue = Math.round(scaledValue);

  // Ensure the result is within the valid range [0, 4]
  const finalValue = Math.min(Math.max(roundedValue, 0), 4);

  return finalValue.toString();
}

function getMonthsBeforeToday(today) {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthsBefore = [];

  for (let i = 0; i < currentMonth; i++) {
    const monthDate = new Date(currentYear, i, 1);
    monthsBefore.push(monthDate.toLocaleString("default", { month: "long" }));
  }

  return monthsBefore;
}
