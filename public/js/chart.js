let squares = document.querySelectorAll(".square");

Array.from(squares).forEach(function (el) {
  el.addEventListener("mouseover", function () {
    let hoverBox = this.nextElementSibling;
    let dataEntry = this.getAttribute("data-entry");

    if (dataEntry === "false") {
      let dayOfYear = Number(this.getAttribute("data-day"));
      let date = dayOfYearToDate(dayOfYear);
      let formattedDate = formatDate(date);
      hoverBox.innerHTML = `<p>Nothing logged on ${formattedDate}.</p>`;
    }

    // Get the position of the li in the grid
    let li = this;
    let rect = li.getBoundingClientRect();
    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    // Set the position of the .show class
    hoverBox.style.top = top + "px";
    hoverBox.style.left = left + "px";

    hoverBox.classList.remove("hide");
    hoverBox.classList.add("show");
  });

  el.addEventListener("mouseout", function () {
    let hoverBox = this.nextElementSibling;

    hoverBox.classList.remove("show");
    hoverBox.classList.add("hide");
  });
});

// ******** HELPER FUNCTIONS ********

function dayOfYearToDate(dayOfYear) {
  // Create a new Date object for January 1st of the given year
  let date = new Date(2024, 0, 1);

  // Add the day of the year minus 1 (since January 1st is day 1)
  date.setDate(dayOfYear);

  return date;
}

function formatDate(date) {
  let day = date.getDate();
  let month = date.toLocaleString("default", { month: "long" });
  let suffix = getDaySuffix(day);

  return month + " " + day + suffix;
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  let lastDigit = day % 10;
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
