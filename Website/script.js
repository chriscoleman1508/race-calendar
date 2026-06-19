// ----- STATE -----
const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let allEvents = [];

const SERIES_COLORS = {
  wec: { dot: "#7bb3ea", class: "event-wec" },
  f1: { dot: "#f09090", class: "event-f1" },
};

// ----- DATA LOADING -----

function parseWECDate(dayString, timeValue) {
  if (timeValue === "TBC") return null;
  return new Date(timeValue * 1000);
}

function parseF1Date(timeValue) {
  if (!timeValue) return null;
  return new Date(timeValue * 1000);
}

function flattenWEC(schedule) {
  const events = [];
  for (const [raceKey, days] of Object.entries(schedule)) {
    for (const [day, sessions] of Object.entries(days)) {
      for (const [sessionName, timestamp] of Object.entries(sessions)) {
        const date = parseWECDate(day, timestamp);
        if (date) {
          events.push({
            series: "wec",
            race: raceKey,
            session: sessionName,
            date,
          });
        }
      }
    }
  }
  return events;
}

function flattenF1(schedule) {
  const events = [];
  for (const [raceKey, race] of Object.entries(schedule)) {
    for (const [day, sessions] of Object.entries(race.sessions)) {
      for (const [sessionName, timestamp] of Object.entries(sessions)) {
        const date = parseF1Date(timestamp);
        if (date) {
          events.push({
            series: "f1",
            race: raceKey,
            raceName: race.name,
            session: sessionName,
            date,
          });
        }
      }
    }
  }
  return events;
}

async function loadAllSchedules() {
  const [wecRes, f1Res] = await Promise.all([
    fetch("data/wec.json"),
    fetch("data/f1.json"),
  ]);

  const wecData = await wecRes.json();
  const f1Data = await f1Res.json();

  const wecEvents = flattenWEC(wecData);
  const f1Events = flattenF1(f1Data);

  return [...wecEvents, ...f1Events].sort((a, b) => a.date - b.date);
}

// ----- SIDEBAR -----

function renderSidebar() {
  const seriesList = document.getElementById("series-list");
  seriesList.innerHTML = "";

  const counts = { wec: 0, f1: 0 };
  for (const event of allEvents) {
    counts[event.series]++;
  }

  for (const [series, info] of Object.entries(SERIES_COLORS)) {
    seriesList.innerHTML += `
            <div class="series-item">
                <div class="dot" style="background:${info.dot}"></div>
                <span class="series-name">${series.toUpperCase()}</span>
                <span class="series-count">${counts[series]}</span>
            </div>
        `;
  }

  const upcomingList = document.getElementById("upcoming-list");
  upcomingList.innerHTML = "";

  const now = new Date();
  const upcoming = allEvents.filter((e) => e.date > now).slice(0, 5);

  for (const event of upcoming) {
    const dateStr = event.date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const name = event.raceName || event.race;
    upcomingList.innerHTML += `
            <div class="mini-event">
                <div class="mini-name">${name}</div>
                <div class="mini-date">${dateStr}</div>
            </div>
        `;
  }
}

// ----- CALENDAR GRID -----

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function renderCalendar() {
  document.getElementById("month-title").textContent =
    `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const weekdaysDiv = document.getElementById("weekdays");
  weekdaysDiv.innerHTML = "";
  for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
    weekdaysDiv.innerHTML += `<div class="weekday">${day}</div>`;
  }

  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startingBlankCells = firstDay.getDay();
  const totalDays = lastDay.getDate();

  for (let i = 0; i < startingBlankCells; i++) {
    grid.innerHTML += `<div class="cell empty"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(currentYear, currentMonth, day);

    const isToday =
      cellDate.getFullYear() === today.getFullYear() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getDate() === today.getDate();

    const eventsToday = allEvents.filter(
      (e) =>
        e.date.getFullYear() === cellDate.getFullYear() &&
        e.date.getMonth() === cellDate.getMonth() &&
        e.date.getDate() === cellDate.getDate(),
    );

    let eventsHtml = "";
    for (const event of eventsToday) {
      const colorClass = SERIES_COLORS[event.series].class;
      const timeStr = event.date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      eventsHtml += `
                <div class="event ${colorClass}">
                    ${event.series.toUpperCase()} · ${event.session}
                    <span class="event-time">${timeStr}</span>
                </div>
            `;
    }

    const dayNumClass = isToday ? "day-num today" : "day-num";
    const cellClass = isToday ? "cell today" : "cell";

    grid.innerHTML += `
            <div class="${cellClass}">
                <div class="${dayNumClass}">${day}</div>
                ${eventsHtml}
            </div>
        `;
  }
}

// ----- NAVIGATION -----

document.getElementById("prev-btn").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

document.getElementById("next-btn").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

// ----- STARTUP -----

async function init() {
  allEvents = await loadAllSchedules();
  renderSidebar();
  renderCalendar();
}

init();
