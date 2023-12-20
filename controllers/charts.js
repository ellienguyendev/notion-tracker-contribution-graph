const { Client } = require("@notionhq/client");
const Chart = require("../models/Chart");
const Entry = require("../models/Entry");
const { ObjectID } = require("mongodb");
const ColorScheme = require("color-scheme");
const convert = require('color-convert');

module.exports = {
  getProfile: async (req, res) => {
    try {
      const charts = await Chart.find({ user: req.user.id });
      res.render("profile.ejs", { charts: charts, user: req.user});
    } catch (err) {
      console.log(err);
    }
  },
  getAddNewChart: async (req, res) => {
    try {
      res.render("addNewChart.ejs", {user: req.user, newChartMode: req.params.chartMode });
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
      const dateProperty = chart.dateProperty;
      const completedProperty = chart.completedProperty;
      const trackingName = chart.trackingName;

      const chartId = new ObjectID(req.params.id);

      const dbEntries = await Entry.find({ chartId: chartId });

      const today = new Date();

      const notion = new Client({
        auth: chart.integrationKey,
      });

      const data = await notion.databases.query({
        database_id: databaseId,
        filter: {
          or: [
            {
              property: "Month Filter",
              select: {
                equals: "November",
              },
            },
            {
              property: "Month Filter",
              select: {
                equals: "October",
              },
            },
          ],
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
        dateProperty,
        completedProperty,
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
      let chartColor = req.body.chartColor;
      let dateProperty = req.body.dateProperty;
      let trackingName = req.body.trackingName.toLowerCase();
      let completedProperty = req.body.completedProperty;
      let chartBackground = req.body.chartBackground;

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
        dateProperty: dateProperty,
        trackingName: trackingName,
        completedProperty: completedProperty,
      });

      const chartId = newChart._id;

      // MANGO TEST DATE ONLY
      const today = new Date("12/18/2024");

      const monthsBeforeToday = getMonthsBeforeToday(today);
      const currentMonth = today.toLocaleString("default", { month: "long" });
      const dayOfMonth = today.getDate();

      for (let i = 0; i < monthsBeforeToday.length; i++) {
        const month = monthsBeforeToday[i];

        const notion = new Client({
          auth: integrationKey,
        });

        const data = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: "Month Filter",
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
          dateProperty,
          completedProperty,
          trackingName,
          chartId
        );

        await Entry.insertMany(notionEntries);
      }

      const notionForMonth = new Client({
        auth: integrationKey,
      });

      if (dayOfMonth !== 1) {
        const dataForMonth = await notionForMonth.databases.query({
          database_id: databaseId,
          filter: {
            and: [
              {
                property: "Month Filter",
                select: {
                  equals: currentMonth,
                },
              },
              {
                property: "Date",
                date: {
                  before: today,
                },
              },
            ],
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
          dateProperty,
          completedProperty,
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
  }
};

// ******** HELPER FUNCTIONS ********

function getEntries(
  notionResults,
  numberOfHabits,
  habitNames,
  dateProperty,
  completedProperty,
  trackingName,
  chartId = false
) {
  let entries = [];

  notionResults.forEach((el) => {
    let prop = el.properties;

    let percentage = Number(
      prop[completedProperty].formula.string.split("%")[0]
    );

    let date = prop[dateProperty].date.start;

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