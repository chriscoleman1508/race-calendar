async function loadSchedule() {
  const response = await fetch("data/wec.json");
  const schedule = await response.json();

  const container = document.getElementById("schedule-container");
  container.innerHTML = "";

  for (const [raceKey, days] of Object.entries(schedule)) {
    const raceDiv = document.createElement("div");
    raceDiv.innerHTML = `<h2>${raceKey.toUpperCase()}</h2>`;

    for (const [day, sessions] of Object.entries(days)) {
      raceDiv.innerHTML += `<h3>${day}</h3>`;
      for (const [session, time] of Object.entries(sessions)) {
        raceDiv.innerHTML += `<p>${session}: ${time}</p>`;
      }
    }

    container.appendChild(raceDiv);
  }
}

loadSchedule();
