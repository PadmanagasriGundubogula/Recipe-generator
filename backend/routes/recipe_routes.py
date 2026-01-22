# routes/recipe_routes.py

from flask import Blueprint, request, jsonify
import datetime
from bson import ObjectId

from db import db, recipes_collection, sentences_collection, graphs_collection, usrs_collection, instructions_collection

recipe_bp = Blueprint("recipe", __name__)


# ---------------------------------------------------------
# CREATE / SAVE RECIPE
# ---------------------------------------------------------
@recipe_bp.route("/save-recipe", methods=["POST"])
def save_recipe():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        recipe_type = data.get("recipe_type")
        recipe_name = data.get("recipe_name")

        if not user_id or not recipe_type or not recipe_name:
            return jsonify({"error": "Missing user_id, recipe_type or recipe_name"}), 400

        recipe_id = f"recipe_{int(datetime.datetime.utcnow().timestamp() * 1000)}"

        recipe_doc = {
            "recipe_id": recipe_id,
            "user_id": ObjectId(user_id),   # or keep as string if you prefer
            "recipe_type": recipe_type,
            "recipe_name": recipe_name,
            "ingredients": data.get("ingredients", []),
            "cooking_time": data.get("cooking_time", ""),
            "instructions": [],
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }

        recipes_collection.insert_one(recipe_doc)

        return jsonify({
            "message": "Recipe saved successfully!",
            "recipe_id": recipe_id
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------------------------------------
# GET A SINGLE RECIPE (basic info + ingredients)
# ---------------------------------------------------------
@recipe_bp.route("/get-recipe/<recipe_id>", methods=["GET"])
def get_recipe(recipe_id):
    try:
        doc = recipes_collection.find_one({"recipe_id": recipe_id})

        if not doc:
            return jsonify({"error": f"Recipe with id '{recipe_id}' not found"}), 404

        return jsonify({
            "_id": str(doc["_id"]),
            "recipe_id": doc.get("recipe_id"),
            "user_id": str(doc.get("user_id")) if doc.get("user_id") else None,  # ✅
            "recipe_type": doc.get("recipe_type"),
            "recipe_name": doc.get("recipe_name"),
            "ingredients": doc.get("ingredients", []),
            "cooking_time": doc.get("cooking_time", ""),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# SAVE INGREDIENT SELECTION FOR A RECIPE
# ---------------------------------------------------------
@recipe_bp.route("/save-selection", methods=["POST"])
def save_selection():
    """
    Save / update ingredient selection for an existing recipe.

    Expected JSON:
    {
      "recipe_id": "recipe_123",
      "ingredients": ["chili", "oil", "salt"]
    }
    'recipe' field from old code is not needed anymore.
    """
    try:
        data = request.get_json()
        recipe_id = data.get("recipe_id")
        ingredients = data.get("ingredients")

        if not recipe_id or not ingredients:
            return jsonify({"message": "recipe_id and ingredients are required!"}), 400

        # Ensure recipe exists
        recipe = recipes_collection.find_one({"recipe_id": recipe_id})
        if not recipe:
            return jsonify({"message": "Recipe not found!"}), 404

        recipes_collection.update_one(
            {"recipe_id": recipe_id},
            {
                "$set": {
                    "ingredients": ingredients,
                    "updated_at": datetime.datetime.utcnow()
                }
            }
        )

        return jsonify({"message": "Selection saved successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# GET RECIPE + INGREDIENTS (for UI, old /recipe/<id> route)
# ---------------------------------------------------------
@recipe_bp.route("/recipe/<recipe_id>", methods=["GET"])
def get_recipe_by_id(recipe_id):
    """
    Older route name kept for compatibility.
    Returns the same data as /get-recipe but focused on ingredients.
    """
    try:
        recipe_data = recipes_collection.find_one({"recipe_id": recipe_id})

        if recipe_data is None:
            return jsonify({"message": "Recipe not found!"}), 404

        ingredients = recipe_data.get("ingredients")
        if not isinstance(ingredients, list):
            ingredients = []

        return jsonify({
            "recipe_id": recipe_data.get("recipe_id"),
            "recipe_name": recipe_data.get("recipe_name"),
            "recipe_type": recipe_data.get("recipe_type"),
            "ingredients": ingredients,
            "cooking_time": recipe_data.get("cooking_time", "")
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# GET ALL RECIPES FOR A USER
# ---------------------------------------------------------
@recipe_bp.route("/get-user-recipes/<user_id>", methods=["GET"])
def get_user_recipes(user_id):
    try:
        # user_id might be stored as ObjectId string or just string
        # Let's try to match both if possible, or just the stored format.
        # Based on save_recipe, it's stored as ObjectId(user_id)
        
        from bson import ObjectId
        query = {"user_id": ObjectId(user_id)}
        
        cursor = recipes_collection.find(query).sort("created_at", -1)
        
        recipes = []
        for doc in cursor:
            recipes.append({
                "recipe_id": doc.get("recipe_id"),
                "recipe_name": doc.get("recipe_name"),
                "recipe_type": doc.get("recipe_type"),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at")
            })
            
        return jsonify(recipes), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# DELETE A RECIPE
# ---------------------------------------------------------
@recipe_bp.route("/remove-recipe/<recipe_id>", methods=["DELETE"])
def remove_recipe(recipe_id):
    try:
        print(f"Attempting to remove recipe: {recipe_id}")
        # Delete the recipe document
        res = recipes_collection.delete_one({"recipe_id": recipe_id})
        
        if res.deleted_count == 0:
            print(f"Recipe {recipe_id} not found in database.")
            return jsonify({"message": "Recipe not found!"}), 404

        # Clean up associated data
        sentences_collection.delete_many({"recipe_id": recipe_id})
        graphs_collection.delete_many({"recipe_id": recipe_id})
        usrs_collection.delete_many({"recipe_id": recipe_id})
        instructions_collection.delete_many({"recipe_id": recipe_id})

        print(f"Recipe {recipe_id} and associated files removed successfully.")
        return jsonify({"message": "Recipe and all associated data deleted successfully!"}), 200

    except Exception as e:
        print(f"Error removing recipe {recipe_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
