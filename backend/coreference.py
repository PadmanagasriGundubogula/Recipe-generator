import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================
# 🔑 API KEY ROTATION LOGIC
# ============================================================
def get_all_api_keys():
    """Collects all Gemini API keys from environment."""
    potential_keys = [
        "GOOGLE_API_KEY",
        "HINDI_GEN_USR_KEY",
        "HINDI_GEN_JSON_KEY",
        "SKA_LC_TE_KEY",
        "SKA_LC_AN_KEY",
        "PADMA_KEY",
        "PRASAD_KEY",
        "HIMASREE_KEY",
        "VASUDHA_KEY",
        "MOHAN_KEY",
        "VARUN_KEY",
        "SATYAPRAKASH_KEY"
    ]
    
    keys = []
    for key_name in potential_keys:
        val = os.getenv(key_name)
        if val and val.startswith("AIzaSy") and val not in keys:
            keys.append(val.strip())
    return keys

# Initial setup
api_keys = get_all_api_keys()
current_key_index = 0

def configure_genai(key_index):
    """Configures the genai library with a specific key index."""
    if not api_keys or key_index >= len(api_keys):
        return False
    
    # Use the most stable prefix for model naming if needed, 
    # but the SDK usually handles 'models/' prefix automatically.
    genai.configure(api_key=api_keys[key_index].strip())
    return True

if api_keys:
    configure_genai(current_key_index)

def resolve_running_text(raw_text: str) -> str:
    """
    Strict pronominal coreference resolution ONLY.
    Includes automatic API key rotation and model fallback logic.
    """
    global current_key_index

    if not raw_text or not raw_text.strip():
        return raw_text

    if not api_keys:
        print("Error: No API keys found in .env.")
        return raw_text

    prompt = f"""
You are a precision "Noun Restoration" engine. Your ONLY goal is to replace pronouns with the specific nouns they refer to from the provided context.

STRICT INSTRUCTIONS:
1. NO NEW WORDS: Do NOT introduce ANY ingredients, tools, or actions that are not already present in the "Input Text". If you see "grind it" and the previous text was "Soak the rice", replace "it" with "the rice". Never guess ingredients like "onion" or "salt".
2. NO PARAPHRASING: Do NOT change "grind" to "chop", or "soak" to "dip". Keep every verb exactly as written.
3. PRONOUN TARGETS: Focus on restoring: it, them, they, its, their, "the item", "it finely".
4. WORD-FOR-WORD FIDELITY: Every single word in your output must either be from the input sentence or be a noun phrase found in the preceding sentences of the input text.
5. NO CONTEXT HALLUCINATION: Even if this looks like a recipe, do NOT use outside cooking knowledge. Use ONLY the text provided.

Example:
Input: "Wash the potatoes. Boil them."
Output: "Wash the potatoes. Boil the potatoes."

Example 2:
Input: "Soak the rice. Then grind the item."
Output: "Soak the rice. Then grind the rice."

Example of what NOT to do:
Input: "Boil it." (Previous context missing)
Output: "Boil the onion." <-- WRONG (Hallucination! "onion" was not in input)

Input Text:
{raw_text}

Output:
Return the text with nouns restored. Do NOT include explanations.
"""

    # List of models to try in order of preference
    # 'gemini-2.5-flash' is the preferred cheap/fast model
    # 'gemini-1.0-pro' / 'gemini-pro' are very compatible legacy names
    models_to_try = ["gemini-2.5-flash", "gemini-pro", "gemini-1.0-pro"]

    # Try keys one by one
    while current_key_index < len(api_keys):
        config_success = configure_genai(current_key_index)
        if not config_success: break

        # For each key, try the different model names
        for model_name in models_to_try:
            try:
                print(f"--- Attempting coref with key[{current_key_index}] and model[{model_name}] ---")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                
                if response and response.text:
                    return response.text.strip()
                
            except Exception as e:
                error_str = str(e).lower()
                
                # If key is expired or invalid, switch to next key immediately
                if "api key expired" in error_str or "api_key_invalid" in error_str or "expired" in error_str:
                    print(f"Key {current_key_index} EXPIRED: {e}")
                    break # Break inner loop to switch key

                # If model is not found (404), it might be the key or the model name
                elif "404" in error_str or "not found" in error_str:
                    print(f"Model {model_name} not found with key {current_key_index}. Trying fallback...")
                    continue # Try next model name with same key
                
                # If quota exceeded, switch to next key
                elif "429" in error_str or "quota" in error_str:
                    print(f"Quota exceeded for key {current_key_index}. Switching...")
                    break 

                else:
                    # Some other error (network, formatting, etc.)
                    print(f"Unexpected error with key {current_key_index}: {e}")
                    # If it's a "User Location" error (unsupported country), switch key
                    if "location" in error_str:
                        break
                    return raw_text # Give up for this request to avoid hang

        current_key_index += 1
        print(f"Moving to next key. New index: {current_key_index}")

    print("CRITICAL: Exhausted all API keys and model fallbacks.")
    return raw_text
