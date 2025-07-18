from flask import Flask, send_from_directory, request, jsonify
from llm_client import generate_questions, get_personality_traits
from alternate_start_generator import generate_alternate_start

app = Flask(__name__, static_folder="static")

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/questions")
def questions():
    return generate_questions()

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    answers = data.get("answers", [])
    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    traits = get_personality_traits(answers)
    print("🐛 Raw traits from LLM:", traits)  # <-- Add this

    try:
        if isinstance(traits, str):
            import json
            traits = json.loads(traits)  # attempt to decode again

        archetype = determine_archetype(traits)
        traits["archetype"] = archetype
        return jsonify(traits)
    except Exception as e:
        print("❌ Exception during parsing/analyzing:", e)
        return jsonify({"error": "Failed to parse trait response", "details": str(e)})

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

    if not archetype or not all(stats.values()):
        return jsonify({"error": "Missing archetype or stat values"}), 400

    result = generate_alternate_start(archetype, stats)
    return jsonify(result)

def determine_archetype(stats):
    # 🔒 Ensure all values are integers (LLMs may return strings!)
    safe_stats = {}
    for key in ["bravery", "empathy", "curiosity", "logic"]:
        try:
            safe_stats[key] = int(stats.get(key, 0))
        except (ValueError, TypeError):
            safe_stats[key] = 0  # fallback in case of bad data

    # 🧠 Sort stats by value
    sorted_stats = sorted(safe_stats.items(), key=lambda item: item[1], reverse=True)
    primary, secondary = sorted_stats[0][0], sorted_stats[1][0]

    # 🧭 Archetype map
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

    # 🎭 Determine archetype from primary and secondary stat combo
    archetype = archetype_map.get((primary, secondary), "Unknown")

    return {
        "archetype": archetype,
        "primary": primary,
        "secondary": secondary,
        "stats": safe_stats
    }

if __name__ == "__main__":
    app.run(debug=True)
