from flask import Flask, send_from_directory, request, jsonify
from llm_client import generate_questions, get_personality_traits
from alternate_start_generator import generate_alternate_start
import json
import re

# Initialize Flask app and set static folder for HTML/CSS/JS files
app = Flask(__name__, static_folder="static")

# Serve the index.html on root route
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

def parse_questions(raw):
    if not isinstance(raw, str):
        raise ValueError("Invalid LLM response format")

    # Step 1: Clean known formatting artifacts
    raw = raw.strip().replace("```json", "").replace("```", "")
    raw = re.sub(r'\\n', '', raw)
    raw = raw.replace('\\"', '"')
    raw = raw.strip('"')

    # Step 2: Attempt to parse JSON (in case it's a list)
    data = json.loads(raw)

    # Step 3: Handle double-encoded case
    if isinstance(data, str) and data.strip().startswith("["):
        data = json.loads(data)

    # Step 4: If we got a list, validate it
    if isinstance(data, list):
        clean_questions = [q.strip() for q in data if isinstance(q, str) and len(q.strip()) > 20]
        if len(clean_questions) == 3:
            return clean_questions
        else:
            raise ValueError("Incomplete or malformed questions")
    else:
        raise ValueError("Not a list")

# 🎯 Route to generate and return 3 personality test questions
@app.route("/questions")
def questions():
    raw = generate_questions()

    try:
        questions = parse_questions(raw)
        return jsonify(questions)
    except Exception as e:
        print("❌ Failed to parse and clean LLM response:", e)
        print("⚠️ Raw content was:\n", raw)
        return jsonify({"error": "Could not parse LLM response", "raw": raw}), 500

# 🧠 Analyze player's answers and return personality traits and archetype
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    answers = data.get("answers", [])
    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    traits = get_personality_traits(answers)
    print("🐛 Raw traits from LLM:", traits)

    try:
        # If LLM gave JSON as a string, parse it again
        if isinstance(traits, str):
            traits = json.loads(traits)

        # Determine player's archetype from stats
        archetype_info = determine_archetype(traits)
        traits.update(archetype_info)
        return jsonify(traits)

    except Exception as e:
        print("❌ Exception during parsing/analyzing:", e)
        return jsonify({"error": "Failed to parse trait response", "details": str(e)})

# 🚪 Generate a "Skyrim alternate start" life scenario for the player based on archetype
@app.route("/start", methods=["POST"])
def start():
    data = request.get_json()
    archetype = data.get("archetype")
    stats = {
        "bravery": data.get("bravery"),
        "empathy": data.get("empathy"),
        "curiosity": data.get("curiosity"),
        "logic": data.get("logic")
    }

    # Ensure all required values exist
    if not archetype or not all(stats.values()):
        return jsonify({"error": "Missing archetype or stat values"}), 400

    # Call LLM to generate the starting scenario
    result = generate_alternate_start(archetype, stats)
    return jsonify(result)

# 🧭 Infer player archetype based on highest two traits
def determine_archetype(stats):
    # Convert trait values to safe integers
    safe_stats = {}
    for key in ["bravery", "empathy", "curiosity", "logic"]:
        try:
            safe_stats[key] = int(stats.get(key, 0))
        except (ValueError, TypeError):
            safe_stats[key] = 0  # fallback if value is invalid

    # Sort by trait values
    sorted_stats = sorted(safe_stats.items(), key=lambda item: item[1], reverse=True)
    primary, secondary = sorted_stats[0][0], sorted_stats[1][0]

    # Define archetype map
    archetype_map = {
        ("bravery", "empathy"): "Champion",
        ("bravery", "curiosity"): "Trailblazer",
        ("bravery", "logic"): "Ironmind",
        ("empathy", "bravery"): "Guardian",
        ("empathy", "curiosity"): "Dreamweaver",
        ("empathy", "logic"): "Mediator",
        ("curiosity", "bravery"): "Wanderer",
        ("curiosity", "empathy"): "Seeker",
        ("curiosity", "logic"): "Tinker",
        ("logic", "bravery"): "Strategist",
        ("logic", "empathy"): "Philosopher",
        ("logic", "curiosity"): "Architect",
    }

    # Return matched archetype
    archetype = archetype_map.get((primary, secondary), "Unknown")

    return {
        "archetype": archetype,
        "primary": primary,
        "secondary": secondary,
        "stats": safe_stats
    }

# 🔁 Run the app in debug mode when executed directly
if __name__ == "__main__":
    app.run(debug=True)
