# === Alternate Start Generator ===
# This script sends a prompt to an LLM (via OpenRouter) to generate a short narrative scenario
# based on a player's personality archetype and stat profile.

import os
import json
import requests
from dotenv import load_dotenv

# 🔐 Load your OpenRouter API key from .env
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Declare the variables at the top, to be assigned later during the alternate start generator
time_period = None
location = None
role = None
situation = None

current_archetype = None
current_stats = None

# === Main Function ===
def generate_alternate_start(archetype, stats):
    # 📚 List of archetypes with descriptions (used as reference only, NOT to assign roles)
    archetype_list = """
Available archetypes (do NOT use them to assign roles, but use them as thematic reference):

1. Champion (Bravery + Empathy) – Righteous protector, leads with the heart
2. Trailblazer (Bravery + Curiosity) – Adventurous risk-taker, bold explorer
3. Ironmind (Bravery + Logic) – Stoic tactician, firm and calculating
4. Guardian (Empathy + Bravery) – Selfless defender, grounded caregiver
5. Dreamweaver (Empathy + Curiosity) – Idealist, inspired by what could be
6. Mediator (Empathy + Logic) – Diplomat, bridge between minds
7. Wanderer (Curiosity + Bravery) – Restless adventurer, seeks novelty
8. Seeker (Curiosity + Empathy) – Gentle visionary, connects with the unknown
9. Tinker (Curiosity + Logic) – Inventor, loves building and breaking
10. Strategist (Logic + Bravery) – Cold commander, thrives under pressure
11. Philosopher (Logic + Empathy) – Moral thinker, values truth and harmony
12. Architect (Logic + Curiosity) – World-builder, system shaper
"""

    # 🧠 Prompt sent to the LLM to generate the narrative
    prompt = f"""
You are a narrative generator for a game that begins with a randomized starting scenario.

You will be given the player’s personality archetype and stats.
Generate a short, immersive starting scenario based on real-world settings for the player’s life, using a random time period between around 4000 BCE and the year 2250.
No fictional, video game settings, but mythological or futuristic settings such as Atlantis, Troy, or Martian colonies are fine. 
Be inclusive — encompass a wide range of cultural and historical settings. Favor vivid, culturally distinct, and well-known periods (e.g., Medieval Europe, 1960s America, Edo Japan, Martian Colonies, etc.)

The result must be a valid JSON object with the following 5 keys:
- "time_period" (string)
- "location" (string)
- "role" (string)
- "situation" (string)
- "thematic_overview" (string): a paragraph describing the emotional and philosophical arc of the story. This should reflect the challenges the protagonist will face and the inner transformation they are likely to go through. Do not summarize the setting — focus on the **emotional arc** and **thematic direction** of the story.

Instructions:
- Do NOT tie the role directly to the archetype — allow ironic or contrasting combinations.
- Include subtle thematic influence from the archetype if desired.
- Use internal world logic. Avoid bland, generic, or cliché settings.
- The thematic overview should align with the archetype’s lens but feel narratively rich.
- Output ONLY the JSON. No explanation. No extra text.

Player info:
archetype = "{archetype}"
stats = {stats}

{archetype_list}
"""


    # 📬 Headers required for OpenRouter API
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    # 📦 Construct the API request body
    data = {
        "model": "mistralai/mistral-7b-instruct",  # This is your chosen model
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    # 📡 Send the request
    response = requests.post(BASE_URL, headers=headers, json=data)

    # ✅ On success (HTTP 200)
    if response.status_code == 200:
        result = response.json()
        content = result["choices"][0]["message"]["content"]

        try:
            # 🧪 Attempt to parse the JSON response
            parsed = json.loads(content)
            return parsed
        except Exception as e:
            # 🧯 If the LLM returns invalid JSON, print error and raw content
            print("\n⚠️ JSON Parse Error:")
            print(content)
            print("Exception:", e)
            return {"error": "Failed to parse JSON from LLM response"}
    else:
        # ❌ Handle API call failure (e.g., bad key, model down)
        print("\n❌ Alternate Start Error:")
        print("Status Code:", response.status_code)
        print("Response Text:", response.text)
        return {"error": "LLM call failed"}
