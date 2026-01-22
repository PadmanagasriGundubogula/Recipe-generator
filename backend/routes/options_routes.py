# routes/options_routes.py

from flask import Blueprint, request, jsonify
import datetime
from db import (
    collection,
    recipe_options,
    default_items,
    custom_ingredients,
    custom_actions,
    custom_descriptors,
    custom_others,
)

options_bp = Blueprint("options", __name__)

# Initial inserts (same logic as before) – run once at startup
def ensure_initial_data():
    if collection.count_documents({}) == 0:
        collection.insert_one({
            "verbs": [
                "बनाएँ", "गरम करें", "डालें", "भूनें", "तलें", "पकाएँ", "देखें",
                "बनें", "रखें", "तैयार करें", "लेँ", "होना", "मिलाएँ", "चटकाना", "मिश्रित करें"
            ],
            "tams": [
                "imperative",
                "habitual_pres",
                "habitual_past",
                "progressive_pres",
                "progressive_past",
                "simple_past",
                "simple_future",
                "simple_present_copula",
                "perfective_pres",
                "perfective_past"
            ],
            "relations": [
                "क्या-कर्ता", "क्या-कर्म", "कौन-कर्ता", "कौन-कर्म", "क्या", "कौन", "कब", "कहां", "कैसे",
                "कब तक", "कहां पर", "कहां से", "किस लिए", "किस में", "किस के कारण", "किस से अधिक",
                "किस के समान", "किस का", "किसके तुलना में"
            ],
            "nouns": [
                "मिर्च", "चटनी", "पैन", "तेल", "लहसुन", "काली मिर्च", "अब", "आंच", "धब्बे", "धनिया",
                "करी पत्ते", "साइड", "मसाला पाउडर", "चना दाल", "उड़द दाल", "जीरा", "मेथी", "सरसों",
                "सामग्री", "मसाला", "गेंद", "इमली", "नमक", "पेस्ट", "तड़का", "हींग", "मिक्सी जार"
            ],
            "measurements": ["मिनट", "घंटा", "रुपया", "चम्मच"],
            "modifiers": [
                "हरा", "मसालेदार", "मध्यम", "भूरा", "खुशबूदार", "सुनहरा", "बारीक",
                "स्वादानुसार", "चिकना", "सूखा", "बारीक", "छोटा", "लाल", "ठंडा"
            ],
            "dquantities": ["सभी", "कुछ"],
            "intensifiers": ["बहुत", "अत्यधिक", "काफ़ी", "थोड़ा", "अत्यंत"]
        })

    if default_items.count_documents({}) == 0:
        default_items.insert_many([
            {"type": "ingredient", "name": "chili", "emoji": "🌶️"},
            {"type": "ingredient", "name": "paste", "emoji": "🧴"},
            {"type": "ingredient", "name": "oil", "emoji": "🛢️"},
            {"type": "ingredient", "name": "garlic", "emoji": "🧄"},
            {"type": "ingredient", "name": "black-pepper", "emoji": "⚫"},
            {"type": "ingredient", "name": "coriander", "emoji": "🌿"},
            {"type": "ingredient", "name": "curryleaves", "emoji": "🍃"},
            {"type": "ingredient", "name": "spice-powder", "emoji": "🧂"},
            {"type": "ingredient", "name": "bengal-gram-lentils", "emoji": "🥣"},
            {"type": "ingredient", "name": "black-gram-lentils", "emoji": "🌰"},
            {"type": "ingredient", "name": "cumin", "emoji": "🌾"},
            {"type": "ingredient", "name": "fenugreek", "emoji": "🌿"},
            {"type": "ingredient", "name": "mustard-seeds", "emoji": "🔸"},
            {"type": "ingredient", "name": "spice", "emoji": "🌶️"},
            {"type": "ingredient", "name": "tamarind", "emoji": "🟤"},
            {"type": "ingredient", "name": "salt", "emoji": "🧂"},
            {"type": "ingredient", "name": "asafoetida", "emoji": "🧪"},
            # actions
            {"type": "action", "name": "make", "emoji": "🛠️"},
            {"type": "action", "name": "heat", "emoji": "🔥"},
            {"type": "action", "name": "add", "emoji": "➕"},
            {"type": "action", "name": "put-in", "emoji": "📥"},
            {"type": "action", "name": "roast", "emoji": "🍖"},
            {"type": "action", "name": "sauté", "emoji": "🍳"},
            {"type": "action", "name": "stir", "emoji": "🥄"},
            {"type": "action", "name": "cook", "emoji": "👨‍🍳"},
            {"type": "action", "name": "see", "emoji": "👀"},
            {"type": "action", "name": "check", "emoji": "✅"},
            {"type": "action", "name": "become", "emoji": "🔄"},
            {"type": "action", "name": "get-ready", "emoji": "🎯"},
            {"type": "action", "name": "keep", "emoji": "📌"},
            {"type": "action", "name": "place", "emoji": "📍"},
            {"type": "action", "name": "prepare", "emoji": "🧑‍🍳"},
            {"type": "action", "name": "take", "emoji": "🤲"},
            {"type": "action", "name": "pour", "emoji": "🫗"},
            {"type": "action", "name": "mix", "emoji": "🌀"},
            {"type": "action", "name": "combine", "emoji": "🔗"},
            {"type": "action", "name": "crack", "emoji": "🥚"},
            {"type": "action", "name": "pop", "emoji": "🎈"},
            {"type": "action", "name": "splutter", "emoji": "💥"},
            # descriptors
            {"type": "descriptor", "name": "spicy", "emoji": "🌶️"},
            {"type": "descriptor", "name": "medium", "emoji": "⚖️"},
            {"type": "descriptor", "name": "brown", "emoji": "🟫"},
            {"type": "descriptor", "name": "aromatic", "emoji": "🌸"},
            {"type": "descriptor", "name": "fragrant", "emoji": "🌼"},
            {"type": "descriptor", "name": "golden", "emoji": "🌟"},
            {"type": "descriptor", "name": "fine", "emoji": "🧵"},
            {"type": "descriptor", "name": "as-per-needed", "emoji": "👌"},
            {"type": "descriptor", "name": "smooth", "emoji": "🎐"},
            {"type": "descriptor", "name": "dry", "emoji": "🏜️"},
            {"type": "descriptor", "name": "finely-chopped", "emoji": "🔪"},
            {"type": "descriptor", "name": "small", "emoji": "🧒"},
            {"type": "descriptor", "name": "red", "emoji": "🔴"},
            {"type": "descriptor", "name": "cool", "emoji": "❄️"},
            {"type": "descriptor", "name": "cold", "emoji": "🥶"},
            # others
            {"type": "other", "name": "pan", "emoji": "🥘"},
            {"type": "other", "name": "grinder", "emoji": "⚙️"},
            {"type": "other", "name": "spoon", "emoji": "🥄"},
            {"type": "other", "name": "flame", "emoji": "🔥"},
            {"type": "other", "name": "heat", "emoji": "🔥"},
        ])

    if recipe_options.count_documents({}) == 0:
        recipe_options.insert_one({
            "recipes": ["हरा मिर्च की चटनी"],
            "ingredients": {
                "सब्जियां": ["हरा मिर्च", "काली मिर्च", "मसालेदार मिर्च", "हरा धनिया", "करी पत्ते"],
                "दालें और अनाज": ["चना दाल", "उड़द दाल"],
                "मसाले": ["जीरा", "मेथी", "सरसों", "सूखी लाल मिर्च", "हींग"],
                "मसाला पदार्थ": ["इमली", "नमक"],
                "तेल": ["तेल"]
            }
        })


@options_bp.route('/recipes', methods=['GET'])
def get_recipes():
    data = recipe_options.find_one({}, {'_id': 0})
    if data:
        return jsonify(data), 200
    else:
        return jsonify({"message": "No data found"}), 404


@options_bp.route('/get-options', methods=['GET'])
def get_options():
    data = collection.find_one({}, {'_id': 0})
    return jsonify(data)


@options_bp.route('/add-option', methods=['POST'])
def add_option():
    data = request.json
    category = data.get("category")
    option = data.get("option")
    subcategory = data.get("subcategory")

    if category and option:
        if category == 'recipes':
            recipe_options.update_one({}, {'$push': {category: option}})
        elif category == "ingredients":
            recipe_options.update_one({}, {'$push': {f"{category}.{subcategory}": option}})
            collection.update_one({}, {'$push': {"nouns": option}})
        else:
            collection.update_one({}, {'$push': {category: option}})

        return jsonify({"message": "Option added successfully!"})
    else:
        return jsonify({"message": "Invalid data!"}), 400


@options_bp.route('/add-custom-item', methods=['POST'])
def add_custom_item():
    data = request.json
    item_type = data.get('type')
    name = data.get('name')
    emoji = data.get('emoji')

    if not all([item_type, name, emoji]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Auto-hyphenate: replace spaces with hyphens to ensure multi-word items are treated as single units
    name = name.strip().replace(' ', '-')

    collection_map = {
        'ingredient': custom_ingredients,
        'action': custom_actions,
        'descriptor': custom_descriptors,
        'other': custom_others
    }

    if item_type not in collection_map:
        return jsonify({"error": "Invalid item type"}), 400

    collection_map[item_type].insert_one({
        "name": name,
        "emoji": emoji,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "Item added successfully"})


@options_bp.route('/get-all-items', methods=['GET'])
def get_all_items():
    item_type = request.args.get('type')

    if not item_type:
        return jsonify({"error": "Type parameter is required"}), 400

    default_items_list = list(default_items.find({"type": item_type}, {'_id': 0}))
    custom_items_list = []

    if item_type == 'ingredient':
        custom_items_list = list(custom_ingredients.find({}, {'_id': 0}))
    elif item_type == 'action':
        custom_items_list = list(custom_actions.find({}, {'_id': 0}))
    elif item_type == 'descriptor':
        custom_items_list = list(custom_descriptors.find({}, {'_id': 0}))
    elif item_type == 'other':
        custom_items_list = list(custom_others.find({}, {'_id': 0}))

    return jsonify({
        "default": default_items_list,
        "custom": custom_items_list
    })


@options_bp.route('/remove-item', methods=['POST'])
def remove_item():
    data = request.json
    item_type = data.get('type')
    name = data.get('name')

    if not all([item_type, name]):
        return jsonify({"error": "Missing required fields"}), 400

    collection_map = {
        'ingredient': custom_ingredients,
        'action': custom_actions,
        'descriptor': custom_descriptors,
        'other': custom_others
    }

    if item_type in collection_map:
        custom_result = collection_map[item_type].delete_one({"name": name})

        if custom_result.deleted_count == 0:
            default_result = default_items.delete_one({"type": item_type, "name": name})
            if default_result.deleted_count == 0:
                return jsonify({"error": "Item not found"}), 404

    return jsonify({"message": "Item removed successfully"})
