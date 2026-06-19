# for web scraping
from bs4 import BeautifulSoup
import requests

# for storing result as file
import json

RACES = {
    "imola": "https://www.fiawec.com/en/race/6-hours-of-imola-2026",
    "spa": "https://www.fiawec.com/en/race/totalenergies-6-hours-of-spa-francorchamps-2026",
    "le_mans": "https://www.fiawec.com/en/race/24-hours-of-le-mans-2026",
    "brazil": "https://www.fiawec.com/en/race/rolex-6-hours-of-sao-paulo-2026",
    "cota": "https://www.fiawec.com/en/race/lone-star-le-mans-2026",
    "fuji": "https://www.fiawec.com/en/race/6-hours-of-fuji-2026",
    "qatar": "https://www.fiawec.com/en/race/qatar-1812km-2026",
    "bahrain": "https://www.fiawec.com/en/race/bapco-energies-8-hours-of-bahrain-2026",
}

def scrape_wec_sessions(race_url):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"}
    response = requests.get(race_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # line contributed by claude
    days = soup.find_all("div", {"class": lambda c: c and "g-col-12" in c and "border-top" in c})

    result = {}

    for day in days:
        sessions = []
        session_names = day.find_all("div", {"class": "fw-bold lh-sm"})
        for session in session_names:
            sessions.append(session.text)
        
        timestamps = []
        time_spans = day.find_all("span", {"data-timestamp": True})
        for span in time_spans:
            timestamps.append(int(span["data-timestamp"]))

        if len(timestamps) == len(sessions):
            day_info = dict(zip(sessions, timestamps))
        else:
            day_info = {name: "TBC" for name in sessions}

        # these 2 lines by claude
        day_name = day.find("div", {"class": lambda c: c and "fw-extrabold" in c and "fs-5" in c}).text
        result[day_name] = day_info

    print(result)
    return result

# contributed by claude for storing files
if __name__ == "__main__":
    all_races = {}
    for key, url in RACES.items():
        print(f"Scraping {key}...")
        try:
            all_races[key] = scrape_wec_sessions(url)
        except Exception as e:
            print(f"Failed on {key}: {e}")

    with open("docs/data/wec.json", "w") as f:
        json.dump(all_races, f, indent=2)

    print("Saved to docs/data/wec.json")
