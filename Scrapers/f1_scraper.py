import requests
import json
import os
from datetime import datetime, timezone

SESSION_NAMES = {
    "FirstPractice": "Free Practice 1",
    "SecondPractice": "Free Practice 2",
    "ThirdPractice": "Free Practice 3",
    "SprintQualifying": "Sprint Qualifying",
    "Sprint": "Sprint Race",
    "Qualifying": "Qualifying",
    "Race": "Race"
}

def fetch_f1_schedule():
    response = requests.get("https://api.jolpi.ca/ergast/f1/2026/races/")
    data = response.json()
    races = data["MRData"]["RaceTable"]["Races"]

    all_races = {}

    for race in races:
        race_key = race["Circuit"]["circuitId"]
        race_name = race["raceName"]
        sessions_by_day = {}

        # collect all sessions including the race itself
        sessions_to_check = list(SESSION_NAMES.keys())

        for session_key in sessions_to_check:
            if session_key == "Race":
                date_str = race["date"]
                time_str = race["time"]
            elif session_key in race:
                date_str = race[session_key]["date"]
                time_str = race[session_key]["time"]
            else:
                continue

            # combine date + time into a UTC timestamp
            dt_str = f"{date_str}T{time_str}"
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            timestamp = int(dt.timestamp())

            # group by date
            if date_str not in sessions_by_day:
                sessions_by_day[date_str] = {}

            sessions_by_day[date_str][SESSION_NAMES[session_key]] = timestamp

        all_races[race_key] = {
            "name": race_name,
            "sessions": sessions_by_day
        }

    return all_races

if __name__ == "__main__":
    print("Fetching F1 schedule...")
    all_races = fetch_f1_schedule()

    os.makedirs("Website/data", exist_ok=True)
    with open("Website/data/f1.json", "w") as f:
        json.dump(all_races, f, indent=2)

    print("Saved to Website/data/f1.json")