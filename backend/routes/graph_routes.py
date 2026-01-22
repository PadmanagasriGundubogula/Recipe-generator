# routes/graph_routes.py

from flask import Blueprint, request, jsonify
import datetime
import os
import json
import networkx as nx
from bson import ObjectId

from db import (
    db,
    recipes_collection,
    graphs_collection,
    usrs_collection,
)


from verticalformat import graphtousr
from graphfunctions import (
    create_graph_from_instruction,
    generate_graph_image,
    generate_hindi_sentence,
    GraphDataManager,
)

# Load required paths (use env vars if valid; otherwise fall back to repo-local defaults)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def _resolve_path(env_name, relative_path):
    env_val = os.getenv(env_name)
    if env_val and os.path.exists(env_val):
        return env_val
    candidate = os.path.join(BASE_DIR, relative_path)
    if os.path.exists(candidate):
        return candidate
    # Not found — warn and return None; we'll surface errors when path is actually required
    print(f"Warning: {env_name} not set or file not found. Tried: {env_val} and {candidate}")
    return None

GRAPH_DATA_PATH = _resolve_path("GRAPH_DATA_PATH", "graphfunctions.py")
DEPENDENCY_ROW_PATH = _resolve_path("DEPENDENCY_ROW_PATH", os.path.join("usr_writing", "dependency_row.json"))
VERTICAL_FORMAT_PATH = _resolve_path("VERTICAL_FORMAT_PATH", os.path.join("usr_writing", "vertical_format.tsv"))


graph_bp = Blueprint("graph", __name__)


# ---------------------------------------------------------
# CREATE GRAPH (Step 1)
# ---------------------------------------------------------
@graph_bp.route("/create-graph", methods=["POST"])
def create_graph():
    try:
        data = request.get_json()
        recipe_id = data.get("recipe_id")
        instruction_list = data.get("instruction")

        if not recipe_id:
            return jsonify({"status": "error", "message": "recipe_id is required"}), 400

        if not instruction_list:
            return jsonify({"status": "error", "message": "instruction list is required"}), 400

        recipe = recipes_collection.find_one({"recipe_id": recipe_id})
        if not recipe:
            return jsonify({"status": "error", "message": "Recipe not found"}), 404

        graph_manager = GraphDataManager(recipe_id)
        G = create_graph_from_instruction(instruction_list, graph_manager)

        graph_json = nx.node_link_data(G)
        graph_image = generate_graph_image(G)
        hindi_sentence = generate_hindi_sentence(G)

        # Ensure dependency file exists (friendly error if not)
        if not DEPENDENCY_ROW_PATH or not os.path.exists(DEPENDENCY_ROW_PATH):
            msg = (
                f"Dependency file not found. Looked for DEPENDENCY_ROW_PATH={os.getenv('DEPENDENCY_ROW_PATH')} "
                f"and repo fallback {os.path.join(BASE_DIR, 'usr_writing', 'dependency_row.json')}."
            )
            print("Graph generation error:", msg)
            return jsonify({"status": "error", "message": msg}), 500

        # 🔹 pass db instead of None
        usr_text = graphtousr(
            input_graph=G,
            relations_file_path=DEPENDENCY_ROW_PATH,
            recipe_id=recipe_id,
            db=db
        )

        graph_doc = {
            "recipe_id": recipe_id,
            "instruction_payload": instruction_list,  # Store original components
            "graph_json": graph_json,
            "graph_image": graph_image,
            "hindi_sentence": hindi_sentence,
            "created_at": datetime.datetime.utcnow(),
        }
        graph_insert = graphs_collection.insert_one(graph_doc)
        graph_id = str(graph_insert.inserted_id)

        usr_doc = {
            "recipe_id": recipe_id,
            "graph_id": graph_id,
            "usr_text": usr_text,
            "created_at": datetime.datetime.utcnow(),
        }
        usr_insert = usrs_collection.insert_one(usr_doc)
        usr_id = str(usr_insert.inserted_id)
        print("USR TEXT:", usr_text)

        return jsonify({
            "status": "success",
            "graph_id": graph_id,
            "usr_id": usr_id,
            "graph_image": f"data:image/png;base64,{graph_image}",
            "hindi_sentence": hindi_sentence,
            "usr_text": usr_text,
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500



# ---------------------------------------------------------
# GENERATE USR AGAIN FROM EXISTING GRAPH (if user edits graph)
# ---------------------------------------------------------
@graph_bp.route("/graphtousr", methods=["POST"])
def graphtousr_api():
    try:
        data = request.get_json()
        recipe_id = data.get("recipe_id")
        graph_id = data.get("graph_id")

        if not recipe_id or not graph_id:
            return jsonify({"status": "error", "message": "recipe_id and graph_id are required"}), 400

        # Fetch graph
        graph_doc = graphs_collection.find_one({"_id": ObjectId(graph_id)})
        if not graph_doc:
            return jsonify({"error": "Graph not found"}), 404

        graph_json = graph_doc.get("graph_json")
        G = nx.node_link_graph(graph_json)

        # Check for dependency file before regenerating USR
        if not DEPENDENCY_ROW_PATH or not os.path.exists(DEPENDENCY_ROW_PATH):
            msg = (
                f"Dependency file not found. Looked for DEPENDENCY_ROW_PATH={os.getenv('DEPENDENCY_ROW_PATH')} "
                f"and repo fallback {os.path.join(BASE_DIR, 'usr_writing', 'dependency_row.json')}."
            )
            print("USR regeneration error:", msg)
            return jsonify({"status": "error", "message": msg}), 500

        # Re-generate USR
        usr_output = graphtousr(
            input_graph=G,
            relations_file_path=DEPENDENCY_ROW_PATH,
            recipe_id=recipe_id,
            db=None
        )

        # Update or create USR entry
        existing_usr = usrs_collection.find_one({"graph_id": graph_id})

        if existing_usr:
            usrs_collection.update_one(
                {"_id": existing_usr["_id"]},
                {"$set": {"usr_text": usr_output, "updated_at": datetime.datetime.utcnow()}}
            )
            usr_id = str(existing_usr["_id"])
        else:
            new_usr = usrs_collection.insert_one({
                "recipe_id": recipe_id,
                "graph_id": graph_id,
                "usr_text": usr_output,
                "created_at": datetime.datetime.utcnow()
            })
            usr_id = str(new_usr.inserted_id)

        return jsonify({
            "message": "USR generated successfully",
            "usr_id": usr_id,
            "usr_text": usr_output
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# GET /get-graph/<graph_id>
# Return stored graph image (data URL) for given graph id
# ---------------------------------------------------------
@graph_bp.route("/get-graph/<graph_id>", methods=["GET"])
def get_graph(graph_id):
    try:
        # Accept either string id or ObjectId; be tolerant
        try:
            query_id = ObjectId(graph_id)
        except Exception:
            query_id = graph_id

        graph_doc = graphs_collection.find_one({"_id": query_id})
        if not graph_doc:
            return jsonify({"error": "Graph not found"}), 404

        graph_image = graph_doc.get("graph_image", "")
        # If stored image is raw base64, return as data URL
        if graph_image and not graph_image.startswith("data:"):
            graph_image = f"data:image/png;base64,{graph_image}"

        return jsonify({"graph_image": graph_image}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# GET /get-graph-by-usr/<usr_id>
# Find USR doc by id, then return linked graph image (if any)
# ---------------------------------------------------------
@graph_bp.route("/get-graph-by-usr/<usr_id>", methods=["GET"])
def get_graph_by_usr(usr_id):
    try:
        try:
            query_id = ObjectId(usr_id)
        except Exception:
            query_id = usr_id

        usr_doc = usrs_collection.find_one({"_id": query_id})
        if not usr_doc:
            return jsonify({"status": "error", "message": "USR not found"}), 404

        graph_id = usr_doc.get("graph_id")
        if not graph_id:
            return jsonify({"status": "error", "message": "No graph linked to this USR"}), 404

        # Reuse existing get_graph logic by looking up graph by id
        try:
            g_query_id = ObjectId(graph_id)
        except Exception:
            g_query_id = graph_id

        graph_doc = graphs_collection.find_one({"_id": g_query_id})
        if not graph_doc:
            return jsonify({"status": "error", "message": "Graph not found for linked USR"}), 404

        graph_image = graph_doc.get("graph_image", "")
        if graph_image and not graph_image.startswith("data:"):
            graph_image = f"data:image/png;base64,{graph_image}"

        return jsonify({"graph_image": graph_image}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500




# ---------------------------------------------------------
# RESET GRAPH TEMP FILES (optional)
# ---------------------------------------------------------
@graph_bp.route("/reset-graph", methods=["POST"])
def reset_graph():
    try:
        data = request.json
        recipe_id = data.get("recipe_id")

        if not recipe_id:
            return jsonify({"status": "error", "message": "recipe_id is required"}), 400

        graph_manager = GraphDataManager(recipe_id)
        graph_manager.clear_data()

        return jsonify({"message": "Graph reset successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
