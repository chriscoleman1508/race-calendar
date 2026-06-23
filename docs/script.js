// ----- STATE -----
const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let allRaceDays = []; // grouped by race + day, not flat sessions

const SERIES_COLORS = {
  wec: { dot: "#7bb3ea", class: "race-wec" },
  f1: { dot: "#f09090", class: "race-f1" },
};

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
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ----- DATA LOADING & GROUPING -----

function groupBySessionDay(rawEvents) {
  // rawEvents: [{ series, race, raceName, session, date }]
  // output: one entry per race+day, with sessions nested
  const groups = {};

  for (const event of rawEvents) {
    const dayKey = `${event.series}|${event.race}|${event.date.toDateString()}`;

    if (!groups[dayKey]) {
      groups[dayKey] = {
        series: event.series,
        race: event.race,
        raceName: event.raceName || event.race,
        date: new Date(
          event.date.getFullYear(),
          event.date.getMonth(),
          event.date.getDate(),
        ),
        sessions: [],
      };
    }

    groups[dayKey].sessions.push({ name: event.session, date: event.date });
  }

  return Object.values(groups).sort((a, b) => {
    const earliestA = Math.min(...a.sessions.map((s) => s.date));
    const earliestB = Math.min(...b.sessions.map((s) => s.date));
    return earliestA - earliestB;
  });
}

function flattenWEC(schedule) {
  const events = [];
  for (const [raceKey, days] of Object.entries(schedule)) {
    for (const [day, sessions] of Object.entries(days)) {
      for (const [sessionName, timestamp] of Object.entries(sessions)) {
        if (timestamp === "TBC") continue;
        events.push({
          series: "wec",
          race: raceKey,
          raceName: raceKey.toUpperCase(),
          session: sessionName,
          date: new Date(timestamp * 1000),
        });
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
        events.push({
          series: "f1",
          race: raceKey,
          raceName: race.name,
          session: sessionName,
          date: new Date(timestamp * 1000),
        });
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

  const rawEvents = [...flattenWEC(wecData), ...flattenF1(f1Data)];
  return groupBySessionDay(rawEvents);
}

// ----- SIDEBAR -----

function renderSidebar() {
  const seriesList = document.getElementById("series-list");
  seriesList.innerHTML = "";

  const counts = { wec: 0, f1: 0 };
  for (const day of allRaceDays) {
    counts[day.series] += day.sessions.length;
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
}

// ----- THIS WEEK -----

function renderThisWeek() {
  const container = document.getElementById("this-week-cards");
  container.innerHTML = "";

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  let foundAny = false;

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);

    const raceDaysToday = allRaceDays.filter(
      (rd) => rd.date.toDateString() === day.toDateString(),
    );
    if (raceDaysToday.length === 0) continue;
    foundAny = true;

    const isToday = day.toDateString() === today.toDateString();

    for (const raceDay of raceDaysToday) {
      let sessionsHtml = "";
      for (const session of raceDay.sessions) {
        const timeStr = session.date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
        sessionsHtml += `<div class="week-session-line"><span>${session.name}</span><span>${timeStr}</span></div>`;
      }

      container.innerHTML += `
                <div class="week-card ${isToday ? "today" : ""}">
                    <div class="week-day-label">${WEEKDAY_LABELS[i]} ${day.getDate()}</div>
                    <div class="week-race-name">${raceDay.raceName}</div>
                    ${sessionsHtml}
                </div>
            `;
    }
  }

  if (!foundAny) {
    container.innerHTML = `<div class="week-card-empty">No races this week</div>`;
  }
}

// ----- CALENDAR GRID -----

function renderCalendar() {
  document.getElementById("month-title").textContent =
    `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const weekdaysDiv = document.getElementById("weekdays");
  weekdaysDiv.innerHTML = WEEKDAY_LABELS.map(
    (d) => `<div class="weekday">${d}</div>`,
  ).join("");

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
    const isToday = cellDate.toDateString() === today.toDateString();

    const raceDaysToday = allRaceDays.filter(
      (rd) => rd.date.toDateString() === cellDate.toDateString(),
    );

    let blocksHtml = "";
    for (const raceDay of raceDaysToday) {
      const colorClass = SERIES_COLORS[raceDay.series].class;
      const blockId = `block-${raceDay.series}-${raceDay.race}-${cellDate.getTime()}`;

      let sessionsHtml = "";
      for (const session of raceDay.sessions) {
        const timeStr = session.date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
        sessionsHtml += `<div class="race-block-session-row"><span>${session.name}</span><span>${timeStr}</span></div>`;
      }

      blocksHtml += `
        <div class="race-block ${colorClass}" onclick="toggleBlock('${blockId}')">
            <div class="race-block-name">${raceDay.raceName}</div>
            <div class="race-block-sessions" id="${blockId}">
                ${sessionsHtml}
            </div>
        </div>
    `;
    }

    grid.innerHTML += `
            <div class="cell ${isToday ? "today" : ""}">
                <div class="day-num ${isToday ? "today" : ""}">${day}</div>
                ${blocksHtml}
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

function toggleBlock(blockId) {
  const el = document.getElementById(blockId);
  el.classList.toggle("expanded");
}

// ----- STARTUP -----

async function init() {
  allRaceDays = await loadAllSchedules();
  renderSidebar();
  renderThisWeek();
  renderCalendar();
}

init();
