import json
import re

print("🧪 Starting test_llm.py...")

def clean_llm_response(raw):
    # Remove leading/trailing whitespace
    raw = raw.strip()

    # Remove markdown-style code fences if present
    raw = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

    # Unescape nested string
    if raw.startswith('"') and raw.endswith('"'):
        raw = raw[1:-1].replace('\\"', '"')

    # Extra cleaning for malformed JSON edge cases
    raw = re.sub(r'"\s+"', '", "', raw)  # Fix missing commas between quoted strings

    return raw

def test_clean_and_parse_cases():
    test_cases = [
        ('["Q1", "Q2", "Q3"]', True),
        ('"[\\"Q1\\", \\"Q2\\", \\"Q3\\"]"', True),
        ('```json\n["Q1", "Q2", "Q3"]\n```', True),
        ('```["Q1", "Q2", "Q3"]```', True),
        ('["Q1" "Q2", "Q3"]', False),  # Missing comma
        ('just a string, not json', False),
        ('["Q1", "Q2",]', False),  # Trailing comma
    ]

    for i, (input_text, should_pass) in enumerate(test_cases):
        print(f"\n🧪 Test case {i+1}:")
        print("📦 Raw:", input_text)

        try:
            cleaned = clean_llm_response(input_text)
            print("🧼 Cleaned:", cleaned)
            parsed = json.loads(cleaned)
            print("✅ Parsed:", parsed)

            if not should_pass:
                print("❌ Unexpected success (should have failed)")

        except Exception as e:
            print("❌ Parsing failed:", e)
            if should_pass:
                print("❌ Unexpected failure (should have succeeded)")

if __name__ == "__main__":
    test_clean_and_parse_cases()
