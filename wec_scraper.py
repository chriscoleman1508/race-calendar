from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# for getting timezones - contributed by claude
from playwright.sync_api import sync_playwright

# for storing result as file
import json
import os

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

def scrape_sessions(race_url):
    # code from claude to update website with current timezones
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # headless=False to watch it happen
        page = browser.new_page()
        page.goto(race_url)

        # Wait for the page to fully load
        page.wait_for_load_state("networkidle")

        # Click the timezone button — inspect the button in Chrome DevTools to get the right selector
        page.click("text=Switch to my timezone")  # 👈 replace with the actual selector

        # Wait for the times to update after the click
        page.wait_for_timeout(1000)

        # Now grab the updated HTML and parse it like before
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, 'html.parser')

    # line contributed by claude
    days = soup.find_all("div", {"class": lambda c: c and "g-col-12" in c and "border-top" in c})

    result = {}

    for day in days:
        sessions = []
        session_names = day.find_all("div", {"class": "fw-bold lh-sm"})
        for session in session_names:
            sessions.append(session.text)
        times = []
        time_names = day.find_all("div", {"class": "text-primary fst-italic"})
        for time in time_names:
            time = time.text
            time = time.split()
            if len(time) > 1:
                time = time[0] + " " + time[1]
            else:
                time = time[0]
            times.append(time)
        day_info = dict(zip(sessions, times))

        # these 2 lines by claude
        day_name = day.find("div", {"class": lambda c: c and "fw-extrabold" in c and "fs-5" in c}).text
        result[day_name] = day_info  # use the day name as the key, add to result

    print(result)
    return result

# contributed by claude for storing files
if __name__ == "__main__":
    all_races = {}
    for key, url in RACES.items():
        print(f"Scraping {key}...")
        try:
            all_races[key] = scrape_sessions(url)
        except Exception as e:
            print(f"Failed on {key}: {e}")

    os.makedirs("data", exist_ok=True)
    with open("data/wec.json", "w") as f:
        json.dump(all_races, f, indent=2)

    print("Saved to data/wec.json")
