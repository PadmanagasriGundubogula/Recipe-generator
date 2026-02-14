import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Use the same key rotation logic as coreference.py
def get_all_api_keys():
    potential_keys = [
        "GOOGLE_API_KEY", "HINDI_GEN_USR_KEY", "HINDI_GEN_JSON_KEY",
        "SKA_LC_TE_KEY", "SKA_LC_AN_KEY", "PADMA_KEY", "PRASAD_KEY",
        "HIMASREE_KEY", "VASUDHA_KEY", "MOHAN_KEY", "VARUN_KEY", "SATYAPRAKASH_KEY"
    ]
    keys = []
    for key_name in potential_keys:
        val = os.getenv(key_name)
        if val and val.startswith("AIzaSy") and val not in keys:
            keys.append(val.strip())
    return keys

api_keys = get_all_api_keys()
current_key_index = 0

def configure_genai(key_index):
    if not api_keys or key_index >= len(api_keys):
        return False
    genai.configure(api_key=api_keys[key_index])
    return True

if api_keys:
    configure_genai(current_key_index)

def parse_sentence_to_slots(text):
    global current_key_index
    
    prompt = f"""
    You are a linguistics expert. Your task is to process a cooking instruction.
    Input Text: "{text}"
    
    TASK 1: Normalize the sentence. Add missing articles (the, a), fix word order, and make it a grammatically correct English cooking instruction.
    
    TASK 2: Convert the normalized instruction into a structured JSON format for a dependency graph.
    
    Rules for JSON:
    1. verb: main action (e.g., heat, cut).
    2. tam: tense/aspect (imperative, simple_present, simple_past).
    3. nounRelations: list of objects/ingredients with:
       - relation: 'k2' (object being acted on), 'k7p' (location/surface/container, e.g., 'into the pan'), 'k1' (subject).
       - relationType: 'SimpleConcept'
       - noun: item name (use hyphens for multi-word items). Use the exact word from the input (even if it's a pronoun like 'it').
       - modifier: optional descriptor for the noun (e.g., 'chopped', 'golden').
    4. tools: list of dictionaries (ONLY for instruments used to perform actions, e.g., 'knife', 'spoon'):
       - tool: name of instrument.
       - relation: 'tool'.
       - CRITICAL: If an item is a container or location (e.g., 'pan', 'bowl', 'pot'), it MUST go in nounRelations with relation 'k7p' and NOT in the tools list. Never repeat an item in both lists.
    5. descriptors: list of dictionaries (For verb/action modifiers only, NOT noun modifiers):
       - value: modifier name (e.g., 'finely').
       - relation: 'mod'.
    6. STRICT RULE: Do NOT add information (ingredients, tools, or descriptors) that is NOT present in the input text. If the input is "grind it", the noun MUST be "it", NOT "onion" or "rice".
    7. temporals: list of dictionaries:
       - value: quantity (e.g., '5').
       - unit: time unit (e.g., 'minutes').
       - display: full string (e.g., '5 minutes').
       - relation: 'dur'.
    
    Output Format:
    {{
      "normalized_text": "...",
      "slots": {{
        "verb": "...",
        "tam": "...",
        "nounRelations": [
           {{ "relation": "k2", "relationType": "SimpleConcept", "noun": "ingredient" }}
        ],
        "tools": [
           {{ "tool": "pan", "relation": "tool" }}
        ],
        "descriptors": [
           {{ "value": "finely", "relation": "mod" }}
        ],
        "temporals": [
           {{ "value": "5", "unit": "minutes", "display": "5 minutes", "relation": "dur" }}
        ]
      }}
    }}
    
    Return ONLY valid JSON. Do not include any conversational text.
    """

    models_to_try = ["gemini-2.5-flash", "gemini-pro"]
    
    while current_key_index < len(api_keys):
        configure_genai(current_key_index)
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    # Clean the response to ensure it's valid JSON
                    raw_text = response.text.strip()
                    
                    # Try to find JSON block using regex if markdown backticks are missing or broken
                    import re
                    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                        try:
                            data = json.loads(json_str)
                            if isinstance(data, dict):
                                # --- Secondary Deduplication: tool vs nounRelations ---
                                noun_names = set()
                                for nr in data.get("nounRelations", []):
                                    if isinstance(nr, dict) and nr.get("noun"):
                                        noun_names.add(str(nr["noun"]).lower())
                                
                                tools = data.get("tools", [])
                                if isinstance(tools, list):
                                    # Filter out items already in nounRelations
                                    data["tools"] = [t for t in tools if isinstance(t, dict) and str(t.get("tool", "")).lower() not in noun_names]
                                
                                return data
                        except json.JSONDecodeError:
                            pass
                    
                    # Fallback to simple cleaning
                    json_str = raw_text
                    if json_str.startswith("```json"):
                        json_str = json_str[7:-3].strip()
                    elif json_str.startswith("```"):
                        json_str = json_str[3:-3].strip()
                    
                    try:
                        data = json.loads(json_str)
                        if isinstance(data, dict):
                            return data
                    except:
                        pass
            except Exception as e:
                print(f"Error with key {current_key_index}: {e}")
                break # Try next key
        current_key_index += 1
    
    return None
