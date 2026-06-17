from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from wec_scraper import scrape_sessions

app = Flask(__name__)
CORS(app)

RACES = {
    "imola":   "https://www.fiawec.com/en/race/6-hours-of-imola-2026",
    "spa":     "https://www.fiawec.com/en/race/totalenergies-6-hours-of-spa-francorchamps-2026",
    "le_mans": "https://www.fiawec.com/en/race/24-hours-of-le-mans-2026",
    "brazil":  "https://www.fiawec.com/en/race/rolex-6-hours-of-sao-paulo-2026",
    "cota":    "https://www.fiawec.com/en/race/lone-star-le-mans-2026",
    "fuji":    "https://www.fiawec.com/en/race/6-hours-of-fuji-2026",
    "qatar":   "https://www.fiawec.com/en/race/qatar-1812km-2026",
    "bahrain": "https://www.fiawec.com/en/race/bapco-energies-8-hours-of-bahrain-2026"
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/scrape", methods=["POST"])
def scrape():
    race_key = request.json.get("race")
    if race_key not in RACES:
        return jsonify({"error": "Unknown race"}), 400
    try:
        schedule = scrape_sessions(RACES[race_key])
        return jsonify({"schedule": schedule})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)