import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

def generate_questions():
    prompt = """
    You are a personality quiz AI.

    Generate EXACTLY 3 immersive, game-like questions to assess a player's:
    - bravery
    - empathy
    - curiosity
    - logic
    - moral alignment

    Each question should be a single string.

    Return only a valid JSON array of 3 strings. Do not explain anything.

    Example format:
    [
      "What would you do if you saw someone in danger?",
      "How do you handle conflicting loyalties in a group?",
      "When faced with an ancient riddle, do you rush or reflect?"
    ]

    Important rules:
    - Return exactly 3 questions
    - No extra text
    - No explanations
    - No code blocks
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "mistralai/mistral-7b-instruct",  # or another model you want
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(BASE_URL, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    else:
        print("❌ Question Gen Error:", response.status_code, response.text)
        return {"error": "LLM call failed"}


def get_personality_traits(answers):
    prompt = f"""
Analyze this player's personality based on the answers below.
Return JSON with: bravery (1-10), empathy (1-10), curiosity (1-10), logic (1-10), alignment (string).

Answers:
{answers}
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(BASE_URL, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    else:
        print("\n❌ LLM Error:")
        print("Status Code:", response.status_code)
        print("Response Text:", response.text)
        return {"error": "LLM call failed"}
