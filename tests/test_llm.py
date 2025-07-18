import json
import re

def clean_llm_response(raw):
    raw = raw.strip()
    raw = re.sub(r"```json|```", "", raw).strip()
    if raw.startswith('"') and raw.endswith('"'):
        raw = raw[1:-1].replace('\\"', '"')
    raw = re.sub(r'"\s*"\s*', '", "', raw)
    return raw

def test_llm_response_parsing():
    test_cases = [
        ('["Q1", "Q2", "Q3"]', True),
        ('"[\\"Q1\\", \\"Q2\\", \\"Q3\\"]"', True),
        ('```json\n["Q1", "Q2", "Q3"]\n```', True),
        ('["Q1" "Q2", "Q3"]', False),
        ('just a string, not json', False),
    ]

    for i, (input_text, should_pass) in enumerate(test_cases):
        try:
            cleaned = clean_llm_response(input_text)
            parsed = json.loads(cleaned)
            assert isinstance(parsed, list)
            assert len(parsed) == 3
            print(f"✅ Test case {i+1} passed.")
        except Exception as e:
            if should_pass:
                print(f"❌ Test case {i+1} failed (should pass): {e}")
            else:
                print(f"✔️ Test case {i+1} failed as expected.")

if __name__ == "__main__":
    test_llm_response_parsing()
