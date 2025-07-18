from flask import Flask, request, jsonify, send_from_directory
from llm_client import get_personality_traits, generate_questions
import os

app = Flask(__name__, static_folder='static')

@app.route("/")
def index():
    return send_from_directory('static', 'index.html')

@app.route("/questions", methods=["GET"])
def get_questions():
    result = generate_questions()
    print("👉 Raw LLM response:", result)
    return result  # just send the text

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    answers = data.get("answers")

    if not answers:
        return jsonify({"error": "No answers provided"}), 400

    result = get_personality_traits(answers)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
