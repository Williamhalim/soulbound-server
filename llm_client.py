# === LLM Client ===
# This module handles interaction with the LLM via OpenRouter API to:
# 1. Generate personality quiz questions
# 2. Analyze a player's answers to return trait scores

import os
import requests
import json
import re
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# === 1. Generate Personality Questions ===
def generate_questions():
    # Prompt sent to LLM to create 3 game-like personality questions
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
      "Question 1",
      "Question 2",
      "Question 3"
    ]

    Important rules:
    - Return exactly 3 questions
    - No extra text
    - No explanations
    - No code blocks
    """

    # Headers with API key for authentication
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    # Payload containing the prompt and model config
    data = {
        "model": "mistralai/mistral-7b-instruct",  # This is your model of choice
        "messages": [{"role": "user", "content": prompt}]
    }

    # Send request to OpenRouter
    response = requests.post(BASE_URL, headers=headers, json=data)

    if response.status_code == 200:
        # Get LLM response text
        result = response.json()
        print("RAW:", result["choices"][0]["message"]["content"])
        return result["choices"][0]["message"]["content"]
    else:
        # Log error and return fallback
        print("❌ Question Gen Error:", response.status_code, response.text)
        return {"error": "LLM call failed"}


# === 2. Analyze Personality from Player Answers ===
def get_personality_traits(answers):
    # Prompt tells LLM to return personality stats only in JSON format
    prompt = f"""
Analyze this player's personality based on the answers below.
Return ONLY valid JSON with: bravery (1-10), empathy (1-10), curiosity (1-10), logic (1-10), alignment (string).

Do NOT explain anything. No extra text.

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

    # Call LLM to analyze traits
    response = requests.post(BASE_URL, headers=headers, json=data)

    if response.status_code == 200:
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        print("🧠 Raw LLM Content:", content)  # Print for debugging

        try:
            # Attempt to extract the JSON block using regex
            match = re.search(r"\{[\s\S]*?\}", content)
            if match:
                return json.loads(match.group(0))  # Return parsed JSON
            else:
                raise ValueError("No valid JSON block found.")
        except Exception as e:
            # On failure, return fallback with raw content
            print("❌ JSON decode error:", e)
            return {
                "archetype": "Unknown",
                "error": "Failed to parse JSON",
                "raw": content
            }
    else:
        # Fallback on API failure
        print("\n❌ LLM Error:")
        print("Status Code:", response.status_code)
        print("Response Text:", response.text)
        return {
            "archetype": "Unknown",
            "error": "LLM call failed"
        }
