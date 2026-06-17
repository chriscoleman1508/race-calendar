// converts the schedule into javascript dates
function flattenSchedule(schedule) {
  const events = [];

  for (const [raceKey, days] of Object.entries(schedule)) {
    for (const [day, sessions] of Object.entries(days)) {
      for (const [sessionName, timestamp] of Object.entries(sessions)) {
        events.push({
          race: raceKey,
          day: day,
          session: sessionName,
          timestamp: timestamp,
        });
      }
    }
  }
  console.log(events);
  return events;
}

// formats time becasue timezons
function formatLocalTime(timestamp) {
  if (timestamp === "TBC") return "TBC";

  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function loadSchedule() {
  const response = await fetch("data/wec.json");
  const schedule = await response.json();

  const events = flattenSchedule(schedule);

  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  for (const event of events) {
    const eventDiv = document.createElement("div");
    eventDiv.innerHTML = `
            <strong>${event.race.toUpperCase()}</strong> —
            ${event.session}:
            ${formatLocalTime(event.timestamp)}
        `;
    container.appendChild(eventDiv);
  }
}

loadSchedule();
