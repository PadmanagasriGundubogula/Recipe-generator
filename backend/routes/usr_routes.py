# routes/usr_routes.py

from flask import Blueprint, request, jsonify
import datetime
import json
import requests
import uuid
from utils.usr_parser import parse_usr_text_to_graphs
import re
from bson import ObjectId
import os

from db import (
    db,
    recipes_collection,
    graphs_collection,
    usrs_collection,
    instructions_collection,
)
DISCOURSE_MAP = {
    "if":              ("first",  "AvaSyakawApariNAma"),
    "otherwise":       ("first",  "AvaSyakawApariNAma.nahIM"),
    "else":            ("first",  "AvaSyakawApariNAma.nahIM"),

    "or":              ("second", "anyawara"),

    "although":        ("first",  "vyaBicAra"),
    "but":             ("second", "viroXI"),
    "whereas":         ("second", "viroXI_xyowaka"),

    "then":            ("second", "uwwarakAla"),
    "after":           ("second", "uwwarakAla"),
    "later":           ("second", "uwwarakAla"),

    "because":         ("second", "kAryakAraNa"),
    "since":           ("second", "kAryakAraNa"),

    "thus":            ("second", "pariNAma"),
    "as a result":     ("second", "pariNAma"),

    "and":             ("second", "samuccaya"),
    "additionally":    ("second", "samuccaya"),
    "apart from":      ("second", "samuccaya"),
    "along with":      ("second", "samuccaya"),

    "so that":         ("second", "kArya_xyowaka"),

    "in other words":  ("second", "arWAw"),

    "for example":     ("second", "uxAharaNasvarUpa"),
    "such as":         ("second", "uxAharaNasvarUpa")
}


def extract_sent_id(usr_text):
    """
    Extracts sent_id from <sent_id=XYZ>
    """
    match = re.search(r"<sent_id=([^>]+)>", usr_text)
    return match.group(1) if match else None

usr_bp = Blueprint("usr", __name__)
@usr_bp.route("/add-discourse", methods=["POST"])
def add_discourse():
    try:
        data = request.get_json() or {}

        s1_id = data.get("sentence1_id")
        s2_id = data.get("sentence2_id")
        relation = data.get("relation", "").lower()

        if not s1_id or not s2_id or not relation:
            return jsonify({"error": "Missing data"}), 400

        if relation not in DISCOURSE_MAP:
            return jsonify({"error": "Unsupported relation"}), 400

        clause, tag = DISCOURSE_MAP[relation]

        # STEP 1: Fetch instructions
        inst1 = instructions_collection.find_one({"sentence_id": s1_id})
        inst2 = instructions_collection.find_one({"sentence_id": s2_id})

        if not inst1 or not inst2:
            return jsonify({"error": "Instruction not found"}), 404

        # STEP 2: Fetch USRs
        usr1 = usrs_collection.find_one({"_id": inst1["usr_id"]})
        usr2 = usrs_collection.find_one({"_id": inst2["usr_id"]})

        if not usr1 or not usr2:
            return jsonify({"error": "USR not found"}), 404

        # STEP 3: Decide target USR
        target_usr = usr1 if clause == "first" else usr2

        # STEP 4: Extract sent_id
        sent_id = extract_sent_id(target_usr["usr_text"])
        if not sent_id:
            return jsonify({"error": "sent_id not found in USR"}), 500

        # STEP 5: Update USR (dynamic index)
        updated_usr_text, verb_index = add_discourse_to_usr(
            target_usr["usr_text"],
            sent_id,
            tag
        )

        if not verb_index:
            return jsonify({"error": "Verb (0:main) not found in USR"}), 500

        # 🔥 STEP 6: Replace old USR
        usrs_collection.update_one(
            {"_id": target_usr["_id"]},
            {"$set": {"usr_text": updated_usr_text}}
        )

        # 🔥 STEP 7: Console log updated USR
        print("====== UPDATED USR ======")
        print(updated_usr_text)
        print("=========================")

        return jsonify({
            "message": "Discourse added successfully",
            "attached_to": clause,
            "tag": tag,
            "sent_id": sent_id,
            "verb_index": verb_index
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def add_discourse_to_usr(usr_text, sent_id, tag):
    lines = usr_text.split("\n")
    updated_lines = []
    verb_index = None

    for line in lines:
        if not line.strip() or line.startswith("#") or line.startswith("%") or line.startswith("<"):
            updated_lines.append(line)
            continue

        cols = line.split("\t")

        # Ensure minimum 7 columns
        while len(cols) < 7:
            cols.append("-")

        # Verb row
        if "main" in cols[4]:
            verb_index = cols[1]  # 🔥 dynamic index
            cols[6] = f"{sent_id}.{verb_index}:{tag}"  # 🔥 REPLACE
            updated_lines.append("\t".join(cols))
        else:
            updated_lines.append(line)

    return "\n".join(updated_lines), verb_index


def try_external_generation(payload, timeout=60):
    """
    Try a list of generator endpoints (from env var GENERATOR_ENDPOINTS)
    or fallback to a single default URL. Returns (result_json, error_info)
    where result_json is the parsed JSON on success, or None on failure.
    """
    # Allow overriding endpoints via env: comma-separated URLs
    endpoints_raw = os.getenv("GENERATOR_ENDPOINTS")
    if endpoints_raw:
        endpoints = [e.strip() for e in endpoints_raw.split(",") if e.strip()]
    else:
        # default (existing) single endpoint
        endpoints = ["http://10.4.16.167:5002/generate-sentence"]

    last_error = None
    for url in endpoints:
        try:
            resp = requests.post(url, json=payload, timeout=timeout)
        except requests.exceptions.RequestException as e:
            # network error or timeout, try next endpoint
            last_error = {"error": "request_exception", "message": str(e), "url": url}
            continue

        if resp.status_code == 200:
            try:
                return resp.json(), None
            except Exception as e:
                last_error = {"error": "json_parse_error", "message": str(e), "status_code": resp.status_code, "text": resp.text, "url": url}
                continue

        # treat rate-limits and server errors as retryable
        if resp.status_code in (429, 502, 503, 504):
            last_error = {"error": "retryable_status", "status_code": resp.status_code, "text": resp.text, "url": url}
            continue

        # non-retryable failure: capture and stop trying further endpoints
        last_error = {"error": "non_retryable_status", "status_code": resp.status_code, "text": resp.text, "url": url}
        # stop here and return the detailed failure
        return None, last_error

    return None, last_error
@usr_bp.route("/remove-discourse", methods=["POST"])
def remove_discourse():
    try:
        data = request.get_json() or {}

        sentence_ids = data.get("sentence_ids", [])

        if not sentence_ids:
            return jsonify({"error": "sentence_ids required"}), 400

        for sent_id in sentence_ids:
            inst = instructions_collection.find_one({"sentence_id": sent_id})
            if not inst or not inst.get("usr_id"):
                continue

            usr = usrs_collection.find_one({"_id": inst["usr_id"]})
            if not usr:
                continue

            usr_text = usr["usr_text"]
            lines = usr_text.split("\n")
            updated_lines = []

            for line in lines:
                if not line.strip() or line.startswith(("#", "%", "<")):
                    updated_lines.append(line)
                    continue

                cols = line.split("\t")
                while len(cols) < 7:
                    cols.append("-")

                # 🔥 RESET discourse column
                if cols[6] != "-":
                    cols[6] = "-"

                updated_lines.append("\t".join(cols))

            updated_usr_text = "\n".join(updated_lines)

            usrs_collection.update_one(
                {"_id": usr["_id"]},
                {"$set": {"usr_text": updated_usr_text}}
            )

            print(f"Discourse removed for sentence_id={sent_id}")

        return jsonify({"message": "Discourse removed successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# GET /usrs?recipe_id=...
# Return all USR blocks for a given recipe
# -------------------------------------------------
@usr_bp.route("/usrs", methods=["GET"])
def get_usrs():
    recipe_id = request.args.get("recipe_id")
    if not recipe_id:
        return jsonify({"error": "recipe_id is required"}), 400

    try:
        cursor = usrs_collection.find(
            {"recipe_id": recipe_id},
            {"usr_text": 1, "graph_id": 1, "created_at": 1},
        )

        usr_list = []
        for doc in cursor:
            usr_list.append({
                "usr_id": str(doc["_id"]),
                "graph_id": str(doc.get("graph_id")) if doc.get("graph_id") else None,
                "usr_text": doc.get("usr_text", ""),
                "created_at": (
                    doc.get("created_at").isoformat()
                    if doc.get("created_at") else None
                ),
            })

        return jsonify(usr_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# POST /send-usr
# 1) Convert USR → minimal graph JSON
# 2) Call external generator (Gemini)
# 3) Store English sentences under **instructions** table
#    linked to usr + graph + recipe
# -------------------------------------------------
@usr_bp.route("/send-usr", methods=["POST"])
def send_usr():
    try:
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")
        usr_text = data.get("usr_text")
        usr_id = data.get("usr_id")          # optional: can be passed by frontend
        graph_id = data.get("graph_id")      # optional: can be passed by frontend

        # 🔹 UI language sent from frontend (like "en" / "hi" / "english" / "hindi")
        ui_lang_raw = (data.get("language") or "english").strip().lower()

        # Normalize UI language → "english" / "hindi"
        if ui_lang_raw.startswith("hi"):
            ui_language = "hindi"
        elif ui_lang_raw.startswith("en"):
            ui_language = "english"
        else:
            ui_language = "english"   # default

        # 🔁 Generation language mapping:
        #  - UI Hindi   → generate Hindi
        #  - UI English → generate English
        generation_language = ui_language

        if not recipe_id or not usr_text:
            return jsonify({"error": "Missing recipe_id or usr_text"}), 400

        # ✅ Ensure recipe exists
        recipe = recipes_collection.find_one({"recipe_id": recipe_id})
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        # ✅ If usr_id not provided, try to find / create a USR doc
        usr_doc = None

        if usr_id:
            usr_doc = usrs_collection.find_one({"_id": ObjectId(usr_id)})
            if not usr_doc:
                return jsonify({"error": "usr_id not found"}), 404
        else:
            # Try to find an existing USR with same text
            usr_doc = usrs_collection.find_one(
                {"recipe_id": recipe_id, "usr_text": usr_text},
                sort=[("created_at", -1)],
            )
            if not usr_doc:
                # If we also know graph_id, link it; otherwise keep None
                usr_insert = {
                    "recipe_id": recipe_id,
                    "graph_id": graph_id,
                    "usr_text": usr_text,
                    "created_at": datetime.datetime.utcnow(),
                    "updated_at": datetime.datetime.utcnow(),
                }
                res = usrs_collection.insert_one(usr_insert)
                usr_doc = usrs_collection.find_one({"_id": res.inserted_id})

        # Use graph_id from usr_doc if present
        if not graph_id and usr_doc:
            graph_id = usr_doc.get("graph_id")

        # ✅ Convert raw USR text → simple structures JSON for external API
        structures_list = parse_usr_text_to_graphs(usr_text)
        if not structures_list:
            return jsonify({"error": "Could not parse usr_text into any structures"}), 400

        structures_str = json.dumps(structures_list, ensure_ascii=False)

        external_url = "http://10.4.16.167:5002/generate-sentence"

        # 🔴 IMPORTANT:
        #  - language:      generation language (opposite of UI language)
        #  - ui_language:   what the user actually selected for UI
        payload = {
            "language": generation_language,   # "english" or "hindi" (OUTPUT)
            "ui_language": ui_language, 
            # "model": "gemini-2.5-flash",
                          # "english" or "hindi" (UI)
           # "model": "gemma-3-27b-it",
           "model": "gemini-2.5-flash",
            "structures": structures_str,
        }

        # Try endpoints (may use GENERATOR_ENDPOINTS env var)
        result, err = try_external_generation(payload, timeout=60)
        if not result:
            return jsonify({
                "error": "External generator failed",
                "details": err,
            }), 502

        # This will now be ENGLISH if UI was Hindi,
        # or HINDI if UI was English
        sentences = (
            result.get("paragraph_wrapped")
            or result.get("sentences")
            or result.get("sentence")
        )

        # normalize to list
        if isinstance(sentences, str):
            sentences = [sentences]

        if not sentences:
            return jsonify({
                "error": "No sentences returned from external API",
                "raw_result": result,
            }), 404

        # 🔹 Coreference Resolution (English only)
        if generation_language == "english":
            try:
                from coreference import resolve_running_text
                
                # Fetch history for context
                prev_cursor = instructions_collection.find(
                    {"recipe_id": recipe_id}
                ).sort("step_number", 1)
                history = [doc.get("instruction_text", "") for doc in prev_cursor]
                
                if history:
                    # If we are modifying, exclude the current instruction from context to avoid feedback loops
                    if modify_sentence_id:
                        history = [doc.get("instruction_text", "") for doc in prev_cursor if doc.get("sentence_id") != modify_sentence_id]

                    context_text = " ".join(history) + " " + " ".join(sentences)
                    resolved_text = resolve_running_text(context_text)
                    
                    # Extract only the newly generated part (last sentences)
                    all_resolved = [s.strip() for s in resolved_text.split(".") if s.strip()]
                    if len(all_resolved) >= len(sentences):
                        sentences = all_resolved[-len(sentences):]
                        # Add periods back if they were stripped
                        sentences = [s + "." if not s.endswith(".") else s for s in sentences]
            except Exception as e:
                print(f"Coreference resolution skip/failed: {e}")

        # ✅ Create or Update an instruction document
        now = datetime.datetime.utcnow()
        modify_sentence_id = data.get("modify_sentence_id")
        
        existing_instruction = None
        if modify_sentence_id:
            existing_instruction = instructions_collection.find_one({"sentence_id": modify_sentence_id})

        if existing_instruction:
            # UPDATE existing
            instructions_collection.update_one(
                {"sentence_id": modify_sentence_id},
                {"$set": {
                    "graph_id": graph_id,
                    "usr_id": usr_doc["_id"] if usr_doc else None,
                    "instruction_text": sentences[0],
                    "english_sentences": sentences,
                    "language": generation_language,
                    "updated_at": now
                }}
            )
            instruction_id = str(existing_instruction["_id"])
            step_number = existing_instruction.get("step_number", 1)
            message = "Instruction updated successfully"
        else:
            # CREATE new
            existing_count = instructions_collection.count_documents({"recipe_id": recipe_id})
            step_number = existing_count + 1
            instruction_doc = {
                "recipe_id": recipe_id,
                "graph_id": graph_id,
                "usr_id": usr_doc["_id"] if usr_doc else None,
                "step_number": step_number,
                "instruction_text": sentences[0], 
                "english_sentences": sentences,
                "language": generation_language,
                "sentence_id": str(uuid.uuid4()),
                "created_at": now,
                "updated_at": now,
            }
            ins_res = instructions_collection.insert_one(instruction_doc)
            instruction_id = str(ins_res.inserted_id)
            message = "Sentences generated successfully"

        return jsonify({
            "message": message,
            "recipe_id": recipe_id,
            "instruction_id": instruction_id,
            "step_number": step_number,
            "english_sentences": sentences,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# POST /remove-sentences
# Clears all instructions for a recipe
# (does NOT delete graphs/usrs, just instructions)
# -------------------------------------------------
@usr_bp.route("/remove-sentences", methods=["POST"])
def remove_sentences():
    try:
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")

        if not recipe_id:
            return jsonify({"error": "Recipe ID is required"}), 400

        result = instructions_collection.delete_many({"recipe_id": recipe_id})

        return jsonify({
            "message": "Sentences removed successfully",
            "deleted_count": result.deleted_count,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@usr_bp.route("/generate-running-text", methods=["POST"])
def generate_running_text():
    try:
        data = request.get_json()

        recipe_id = data["recipe_id"]
        sentence_order = data["sentence_order"]
        ui_language = data.get("ui_language", "english").strip().lower()

        # Normalize UI language
        if ui_language.startswith("hi"):
            ui_language = "hindi"
        elif ui_language.startswith("en"):
            ui_language = "english"
        else:
            ui_language = "english"

        # Generation language (output language)
        generation_language = ui_language

        # ✅ Collect all USR texts in order
        all_usr_texts = []

        for item in sentence_order:
            # 🔹 Combined sentence (array of sentence_ids)
            if isinstance(item, list):
                for sent_id in item:
                    inst = instructions_collection.find_one({
                        "recipe_id": recipe_id,
                        "sentence_id": sent_id
                    })
                    if inst and inst.get("usr_id"):
                        usr = usrs_collection.find_one({"_id": inst["usr_id"]})
                        if usr and usr.get("usr_text"):
                            all_usr_texts.append(usr["usr_text"])

            # 🔹 Single sentence (string sentence_id)
            else:
                inst = instructions_collection.find_one({
                    "recipe_id": recipe_id,
                    "sentence_id": item
                })
                if inst and inst.get("usr_id"):
                    usr = usrs_collection.find_one({"_id": inst["usr_id"]})
                    if usr and usr.get("usr_text"):
                        all_usr_texts.append(usr["usr_text"])

        if not all_usr_texts:
            return jsonify({"error": "No USR texts found for given sentence order"}), 404

        # ✅ Parse ALL USR texts into structures (same as /send-usr does)
        # This preserves the order of sentences as specified by the user
        # and maintains discourse markers from the USR
        all_structures = []
        for usr_text in all_usr_texts:
            structures_list = parse_usr_text_to_graphs(usr_text)
            if structures_list:
                all_structures.extend(structures_list)

        if not all_structures:
            return jsonify({"error": "Could not parse any USR texts into structures"}), 400

        # ✅ Convert to JSON string (same format as /send-usr)
        # The structures maintain discourse markers from USR, ensuring
        # that Hindi generation follows the same order and discourse as English
        structures_str = json.dumps(all_structures, ensure_ascii=False)

        # 🔥 External generation call (same format as /send-usr)
        external_url = "http://10.4.16.167:5002/generate-sentence"

        payload = {
            "language": generation_language,      # Output language
            "ui_language": ui_language,           # UI language
            "model": "gemini-2.5-flash",
            # "model": "gemma-3-27b-it",
            "structures": structures_str          # ✅ JSON string of parsed structures
        }

        print("Sending to generator:", {
            **payload,
            "structures": f"[{len(all_structures)} structures]"  # Don't log full payload
        })

        result, err = try_external_generation(payload, timeout=60)
        if not result:
            return jsonify({
                "error": "External generator failed",
                "details": err,
            }), 502
        print("Generator response:", result)

        # Extract generated text
        generated_text = (
            result.get("paragraph_wrapped")
            or result.get("sentences")
            or result.get("sentence")
        )

        # Normalize to string
        if isinstance(generated_text, list):
            generated_text = " ".join(generated_text)

        return jsonify({
            "status": "success",
            "generator_response": result,
            "generated_text": generated_text,
            "structures_count": len(all_structures),
            "usr_texts_count": len(all_usr_texts)
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "Generator service timed out"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Generator service error: {str(e)}"}), 502
    except Exception as e:
        print(f"Error in generate-running-text: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
# -------------------------------------------------
# GET /get-sentences/<recipe_id>
# Returns list of instruction texts for that recipe
# -------------------------------------------------
@usr_bp.route("/get-sentences/<recipe_id>", methods=["GET"])
def get_sentences_by_id(recipe_id):
    try:
        cursor = instructions_collection.find(
            {"recipe_id": recipe_id}
        ).sort("step_number", 1)

        sentences = [doc.get("instruction_text", "") for doc in cursor]

        if not sentences:
            return jsonify({"sentences": []}), 200  # empty but not error

        return jsonify({"sentences": sentences}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@usr_bp.route("/get-sentences-with-id/<recipe_id>", methods=["GET"])
def get_sentences_with_id(recipe_id):
    try:
        cursor = instructions_collection.find(
            {"recipe_id": recipe_id}
        ).sort("step_number", 1)

        result = []
        for doc in cursor:
            # Try to get instruction_payload from the linked graph
            instruction_payload = []
            graph_id_val = doc.get("graph_id")
            if graph_id_val:
                try:
                    g_doc = graphs_collection.find_one({"_id": ObjectId(graph_id_val)})
                except:
                    g_doc = graphs_collection.find_one({"_id": graph_id_val})
                if g_doc:
                    instruction_payload = g_doc.get("instruction_payload", [])

            result.append({
                "sentence_id": doc.get("sentence_id"),
                "text": doc.get("instruction_text", ""),
                "step_number": doc.get("step_number"),
                "usr_id": str(doc.get("usr_id")) if doc.get("usr_id") else None,
                "graph_id": str(graph_id_val) if graph_id_val else None,
                "instruction_payload": instruction_payload,
                "language": doc.get("language") # 👈 Add language
            })

        return jsonify({"instructions": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@usr_bp.route("/get-instruction-details/<sentence_id>", methods=["GET"])
def get_instruction_details(sentence_id):
    try:
        # Find instruction
        inst = instructions_collection.find_one({"sentence_id": sentence_id})
        if not inst:
            return jsonify({"error": "Instruction not found"}), 404

        usr_id = inst.get("usr_id")
        graph_id = inst.get("graph_id")

        usr_text = ""
        graph_image = ""
        usr_doc = None

        if usr_id:
            usr_doc = usrs_collection.find_one({"_id": ObjectId(usr_id)})
            if usr_doc:
                usr_text = usr_doc.get("usr_text", "")

        # If the instruction itself doesn't carry a graph_id, try the linked USR
        if not graph_id and usr_doc and usr_doc.get("graph_id"):
            graph_id = usr_doc.get("graph_id")

        if graph_id:
            print(f"Searching for graph_id: {graph_id}")
            try:
                graph_doc = graphs_collection.find_one({"_id": ObjectId(graph_id)})
            except Exception:
                graph_doc = graphs_collection.find_one({"_id": graph_id})

            if graph_doc:
                graph_image = graph_doc.get("graph_image", "")
                print(f"Graph image found directly (len={len(graph_image) if graph_image else 0})")
            else:
                print(f"Graph doc not found for graph_id: {graph_id}")

        # Fallback: if no graph found yet, try to find a USR doc with the same usr_text that has a linked graph
        # BUT only consider USR entries created at or before this instruction (to avoid using later generated graphs)
        if not graph_image and usr_text:
            try:
                print(f"Fallback: Searching for graph with matching USR text for recipe {inst.get('recipe_id')}")
                recipe_id = inst.get("recipe_id")
                query = {"recipe_id": recipe_id, "usr_text": usr_text, "graph_id": {"$exists": True, "$ne": None}}

                # If instruction has a created_at, only consider USRs created on-or-before that time
                inst_created = inst.get("created_at")
                if inst_created:
                    query["created_at"] = {"$lte": inst_created}

                matched_usr = usrs_collection.find_one(query, sort=[("created_at", -1)])

                if matched_usr and matched_usr.get("graph_id"):
                    m_graph_id = matched_usr.get("graph_id")
                    print(f"Found matched USR with graph_id: {m_graph_id}")
                    try:
                        gdoc = graphs_collection.find_one({"_id": ObjectId(m_graph_id)})
                    except Exception:
                        gdoc = graphs_collection.find_one({"_id": m_graph_id})

                    if gdoc and gdoc.get("graph_image"):
                        graph_image = gdoc.get("graph_image")
                        graph_id = graph_id or str(gdoc.get("_id"))
                        print(f"Fallback SUCCESS: using graph from matching USR {graph_id} (len={len(graph_image)})")
                    else:
                        print(f"Matched USR's graph doc {m_graph_id} did not have a usable graph image")
                else:
                    print("No matching USR with graph found before instruction time")
            except Exception as e:
                print("Error while attempting to find graph via matching USR:", e)

        # Fetch payload for editing
        instruction_payload = []
        if graph_id:
            try:
                gdoc_payload = graphs_collection.find_one({"_id": ObjectId(graph_id)})
            except:
                gdoc_payload = graphs_collection.find_one({"_id": graph_id})
            if gdoc_payload:
                instruction_payload = gdoc_payload.get("instruction_payload", [])

        return jsonify({
            "sentence_id": sentence_id,
            "instruction_text": inst.get("instruction_text"),
            "usr_text": usr_text,
            "graph_image": graph_image,
            "usr_id": str(usr_id) if usr_id else None,
            "graph_id": str(graph_id) if graph_id else None,
            "instruction_payload": instruction_payload
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# DEBUG: show instruction -> usr -> graph links for a sentence
# -------------------------------------------------
@usr_bp.route("/debug/instruction-links/<sentence_id>", methods=["GET"])
def debug_instruction_links(sentence_id):
    try:
        inst = instructions_collection.find_one({"sentence_id": sentence_id})
        if not inst:
            return jsonify({"error": "Instruction not found"}), 404

        out = {
            "instruction": {
                "sentence_id": inst.get("sentence_id"),
                "instruction_text": inst.get("instruction_text"),
                "graph_id": str(inst.get("graph_id")) if inst.get("graph_id") else None,
                "usr_id": str(inst.get("usr_id")) if inst.get("usr_id") else None,
                "created_at": inst.get("created_at")
            }
        }

        # linked USR
        if inst.get("usr_id"):
            try:
                usr = usrs_collection.find_one({"_id": ObjectId(inst.get("usr_id"))})
            except Exception:
                usr = usrs_collection.find_one({"_id": inst.get("usr_id")})

            if usr:
                out["usr"] = {
                    "usr_id": str(usr.get("_id")),
                    "graph_id": str(usr.get("graph_id")) if usr.get("graph_id") else None,
                    "usr_text_present": bool(usr.get("usr_text")),
                    "created_at": usr.get("created_at")
                }

        # linked graph (direct)
        if inst.get("graph_id"):
            try:
                gdoc = graphs_collection.find_one({"_id": ObjectId(inst.get("graph_id"))})
            except Exception:
                gdoc = graphs_collection.find_one({"_id": inst.get("graph_id")})

            if gdoc:
                graph_img = gdoc.get("graph_image")
                out["graph"] = {
                    "graph_id": str(gdoc.get("_id")),
                    "image_present": bool(graph_img),
                    "image_length": len(graph_img) if graph_img else 0,
                    "created_at": gdoc.get("created_at")
                }

        # recent graph for recipe
        try:
            recipe_id = inst.get("recipe_id")
            if recipe_id:
                recent = graphs_collection.find_one({"recipe_id": recipe_id}, sort=[("created_at", -1)])
                if recent:
                    rimg = recent.get("graph_image")
                    out["recent_graph"] = {
                        "graph_id": str(recent.get("_id")),
                        "image_present": bool(rimg),
                        "image_length": len(rimg) if rimg else 0,
                        "created_at": recent.get("created_at")
                    }
        except Exception as e:
            out["recent_graph_error"] = str(e)

        return jsonify(out), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# ADMIN: Repair instruction -> graph links
# Attempts to attach the most appropriate graph_id to instructions missing them
# Heuristics (in order):
#  1) If instruction.usr_id -> use that USR's graph_id (if present)
#  2) Find a USR with same usr_text created on-or-before the instruction that has a graph_id
#  3) Use the most recent graph for the recipe created on-or-before the instruction
# Request JSON: { "recipe_id": "<id>" } (optional; scans all recipes if omitted)
# Returns a report with updates performed.
# -------------------------------------------------
@usr_bp.route("/admin/repair-instruction-graphs", methods=["POST"])
def admin_repair_instruction_graphs():
    try:
        data = request.get_json() or {}
        recipe_id_filter = data.get("recipe_id")

        query = {}
        if recipe_id_filter:
            query["recipe_id"] = recipe_id_filter

        # Find instructions missing graph_id or with empty graph_image on linked graph
        cursor = instructions_collection.find(query)

        report = {"updated": [], "skipped": [], "errors": []}

        for inst in cursor:
            try:
                sid = inst.get("sentence_id")
                rid = inst.get("recipe_id")
                inst_created = inst.get("created_at")
                current_graph_id = inst.get("graph_id")

                # If instruction already has a graph_id and it points to a graph with an image, skip
                if current_graph_id:
                    try:
                        gdoc = graphs_collection.find_one({"_id": ObjectId(current_graph_id)})
                    except Exception:
                        gdoc = graphs_collection.find_one({"_id": current_graph_id})

                    if gdoc and gdoc.get("graph_image"):
                        report["skipped"].append({"sentence_id": sid, "reason": "has valid graph"})
                        continue

                # 1) If instruction has usr_id and that USR has graph_id -> use it
                used_graph = None
                if inst.get("usr_id"):
                    try:
                        usr = usrs_collection.find_one({"_id": ObjectId(inst.get("usr_id"))})
                    except Exception:
                        usr = usrs_collection.find_one({"_id": inst.get("usr_id")})

                    if usr and usr.get("graph_id"):
                        # Confirm graph has an image
                        try:
                            gdoc = graphs_collection.find_one({"_id": ObjectId(usr.get("graph_id"))})
                        except Exception:
                            gdoc = graphs_collection.find_one({"_id": usr.get("graph_id")})

                        if gdoc and gdoc.get("graph_image"):
                            used_graph = str(gdoc.get("_id"))
                            reason = "usr_linked_graph"

                # 2) Find matching USR with same usr_text (created <= inst_created)
                if not used_graph and inst.get("usr_id") is None and inst.get("instruction_text"):
                    usr_text = None
                    # Try to see if there's a USR with same text matching this instruction
                    # First check USR docs where usr_text matches instruction's usr_text via linked instruction
                    # We use the instruction's linked usr if present, else search by usr_text stored elsewhere
                    # Search USRs for same recipe and same usr_text created on-or-before inst_created
                    q = {"recipe_id": rid, "graph_id": {"$exists": True, "$ne": None}}
                    if inst.get("created_at"):
                        q["created_at"] = {"$lte": inst.get("created_at")}

                    # Try to find USR with identical usr_text by comparing stored USR texts
                    # We'll search recent USRs and compare their usr_text to the instruction's USR if available
                    # (Leave exact equality as the heuristic for safety)
                    # If the instruction has a usr_id linking to a USR, we already handled it above.
                    matched_usr = None
                    # If instruction has a text that matches a USR entry, use that
                    # Look through USRs for this recipe and created_at constraint
                    usrcursor = usrs_collection.find({"recipe_id": rid, "graph_id": {"$exists": True, "$ne": None}}).sort([("created_at", -1)])
                    for u in usrcursor:
                        # Compare normalized usr_text if possible
                        if not u.get("usr_text"):
                            continue
                        # Compare first 100 characters to avoid large mismatches
                        if inst.get("instruction_text") and (inst.get("instruction_text") in u.get("usr_text") or u.get("usr_text") in inst.get("instruction_text")):
                            matched_usr = u
                            break

                    if matched_usr:
                        try:
                            gdoc = graphs_collection.find_one({"_id": ObjectId(matched_usr.get("graph_id"))})
                        except Exception:
                            gdoc = graphs_collection.find_one({"_id": matched_usr.get("graph_id")})

                        if gdoc and gdoc.get("graph_image"):
                            used_graph = str(gdoc.get("_id"))
                            reason = "matched_usr_graph"

                # 3) Final fallback: most recent graph for recipe created at-or-before instruction
                if not used_graph:
                    if rid:
                        qg = {"recipe_id": rid}
                        if inst_created:
                            qg["created_at"] = {"$lte": inst_created}
                        recent = graphs_collection.find_one(qg, sort=[("created_at", -1)])
                        if recent and recent.get("graph_image"):
                            used_graph = str(recent.get("_id"))
                            reason = "recent_graph_before_inst"

                if used_graph:
                    instructions_collection.update_one({"_id": inst.get("_id")}, {"$set": {"graph_id": used_graph}})
                    report["updated"].append({"sentence_id": sid, "graph_id": used_graph, "reason": reason})
                else:
                    report["skipped"].append({"sentence_id": sid, "reason": "no suitable graph found"})

            except Exception as ie:
                report["errors"].append({"sentence_id": inst.get("sentence_id"), "error": str(ie)})

        return jsonify(report), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# POST /save-sentence
# Manually add one sentence under a recipe
# (not strictly necessary if you're always using /send-usr)
# -------------------------------------------------
@usr_bp.route("/save-sentence", methods=["POST"])
def save_sentence():
    try:
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")
        sentence = data.get("sentence")

        if not recipe_id or not sentence:
            return jsonify({"error": "recipe_id and sentence are required"}), 400

        existing_count = instructions_collection.count_documents({"recipe_id": recipe_id})
        step_number = existing_count + 1

        now = datetime.datetime.utcnow()

        instructions_collection.insert_one({
    "recipe_id": recipe_id,
    "graph_id": None,
    "usr_id": None,
    "step_number": step_number,
    "instruction_text": sentence,
    "english_sentences": [sentence],
    "sentence_id": str(uuid.uuid4()),      # <-- ADD THIS LINE
    "created_at": now,
    "updated_at": now,
})


        return jsonify({"message": "Sentence saved successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@usr_bp.route("/update-instruction", methods=["POST"])
def update_instruction():
    try:
        data = request.get_json() or {}
        sentence_id = data.get("sentence_id")
        new_text = data.get("new_text")

        if not sentence_id or not new_text:
            return jsonify({"error": "sentence_id and new_text are required"}), 400

        result = instructions_collection.update_one(
            {"sentence_id": sentence_id},
            {"$set": {"instruction_text": new_text, "updated_at": datetime.datetime.utcnow()}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Instruction not found"}), 404

        return jsonify({"message": "Instruction updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# POST /delete-sentence
# Delete sentence(s) matching the given text for a recipe
# -------------------------------------------------
@usr_bp.route("/delete-sentence", methods=["POST"])
def delete_sentence():
    try:
        data = request.get_json() or {}
        recipe_id = data.get("recipe_id")
        sentence = data.get("sentence")

        if not recipe_id or not sentence:
            return jsonify({"error": "recipe_id and sentence are required"}), 400

        result = instructions_collection.delete_many({
            "recipe_id": recipe_id,
            "instruction_text": sentence,
        })

        # 🔥 Re-sequence step_number for remaining instructions
        remaining = instructions_collection.find({"recipe_id": recipe_id}).sort("created_at", 1)
        for i, doc in enumerate(remaining):
            instructions_collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"step_number": i + 1}}
            )

        return jsonify({
            "message": "Sentence deleted and steps re-sequenced successfully",
            "deleted_count": result.deleted_count,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500