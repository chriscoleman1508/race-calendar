import requests
from bs4 import BeautifulSoup
import json

IMSA_RACES = {
    "watkins_glen": "https://www.imsa.com/events/2026-watkins-glen-international/",
    # add more race URLs here as you find them
}

def scrape_imsa_sessions(race_url):
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(race_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    schedule_container = soup.find("div", {"class": "race-event-schedule-container-inner"})
    if not schedule_container:
        return {}

    result = {}
    current_day = None

    for element in schedule_container.find_all(["div"], recursive=False):
        classes = element.get("class", [])

        if "day-event-header" in classes:
            current_day = element.text.strip()
            result[current_day] = {}

        elif "day-event-details-container" in classes and current_day:
            time_div = element.find("div", {"class": "event-time"})
            name_div = element.find("div", {"class": "event-name"})
            if time_div and name_div:
                result[current_day][name_div.text.strip()] = time_div.text.strip()

    return result

if __name__ == "__main__":
    all_races = {}
    for key, url in IMSA_RACES.items():
        print(f"Scraping {key}...")
        try:
            all_races[key] = scrape_imsa_sessions(url)
        except Exception as e:
            print(f"Failed on {key}: {e}")

    with open("Website/data/imsa.json", "w") as f:
        json.dump(all_races, f, indent=2)

    print("Saved to Website/data/imsa.json")