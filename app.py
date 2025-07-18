# === Flask App Setup ===
from flask import Flask, send_from_directory, request, jsonify
from llm_client import generate_questions, get_personality_traits
from alternate_start_generator import generate_alternate_start

# Create Flask app and tell it where to find static files like index.html
app = Flask(__name__, static_folder="static")


# === ROUTES ===

# Serve the main HTML page at the root URL
@app.route("/")
def index():
    return send_from_directory("static", "index.html")


# Serve 3 generated personality questions via LLM
@app.route("/questions")
def questions():
    return generate_questions()


# Analyze player responses and return personality stats + archetype
@app.route("/analyze", methods=["POST"])
def analyze():
    # Get JSON payload (answers to the 3 questions)
    data = request.get_json()
    answers = data.get("answers", [])

    # If no answers were sent, return 400 error
    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    # Get raw trait analysis from the LLM
    traits = get_personality_traits(answers)
    print("🐛 Raw traits from LLM:", traits)  # Debug print

    try:
        # If LLM returned traits as a JSON string, parse it again
        if isinstance(traits, str):
            import json
            traits = json.loads(traits)

        # Determine archetype based on highest two traits
        archetype_info = determine_archetype(traits)
        traits.update(archetype_info)  # Merge traits + archetype info

        return jsonify(traits)  # Return full enriched profile
    except Exception as e:
        # Fallback in case of error (parsing failure, etc.)
        print("❌ Exception during parsing/analyzing:", e)
        return jsonify({
            "error": "Failed to parse trait response",
            "details": str(e)
        })


# Generate alternate start scenario based on player's archetype + stats
@app.route("/start", methods=["POST"])
def start():
    data = request.get_json()
    archetype = data.get("archetype")

    # Extract and validate all four stats from the request
    stats = {
        "bravery": data.get("bravery"),
        "empathy": data.get("empathy"),
        "curiosity": data.get("curiosity"),
        "logic": data.get("logic")
    }

    # If missing any values, return error
    if not archetype or not all(stats.values()):
        return jsonify({"error": "Missing archetype or stat values"}), 400

    # Generate random starting background
    result = generate_alternate_start(archetype, stats)
    return jsonify(result)


# === ARCHETYPE DECODER ===
# Determine which archetype the player is based on their top 2 traits
def determine_archetype(stats):
    # 🔒 Convert all stat values to integers for safe sorting
    safe_stats = {}
    for key in ["bravery", "empathy", "curiosity", "logic"]:
        try:
            safe_stats[key] = int(stats.get(key, 0))
        except (ValueError, TypeError):
            safe_stats[key] = 0  # Use 0 if value is missing or invalid

    # 🧠 Rank stats from highest to lowest
    sorted_stats = sorted(safe_stats.items(), key=lambda item: item[1], reverse=True)
    primary, secondary = sorted_stats[0][0], sorted_stats[1][0]

    # 🎭 Archetype lookup table based on primary + secondary trait pairing
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

    # 🧩 Lookup archetype or fallback to "Unknown"
    archetype = archetype_map.get((primary, secondary), "Unknown")

    return {
        "archetype": archetype,
        "primary": primary,
        "secondary": secondary,
        "stats": safe_stats
    }


# === RUN APP LOCALLY ===
if __name__ == "__main__":
    app.run(debug=True)  # Enable debug mode for live reload and errors
