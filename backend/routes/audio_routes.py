import os
import whisper
from flask import Blueprint, request, jsonify
import tempfile
import torch
import datetime
import networkx as nx
from bson import ObjectId

from utils.semantic_parser import parse_sentence_to_slots
from graphfunctions import (
    create_graph_from_instruction,
    generate_graph_image,
    generate_hindi_sentence,
    GraphDataManager,
)
from verticalformat import graphtousr
from db import (
    db,
    graphs_collection,
    usrs_collection,
    recipes_collection
)

import librosa
import soundfile as sf

audio_bp = Blueprint('audio', __name__)

# Load model once
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading Whisper model on {device}...")
model = whisper.load_model("small", device=device)

# Path to dependency file (from graph_routes.py logic)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEPENDENCY_ROW_PATH = os.path.join(BASE_DIR, "usr_writing", "dependency_row.json")

def preprocess_audio(input_path):
    """Resample to 16kHz, trim silence, and normalize."""
    try:
        y, sr = librosa.load(input_path, sr=16000)
        y_trimmed, _ = librosa.effects.trim(y)
        y_norm = librosa.util.normalize(y_trimmed)
        
        output_path = input_path + "_preprocessed.wav"
        sf.write(output_path, y_norm, 16000)
        return output_path
    except Exception as e:
        print(f"Preprocessing failed: {e}")
        return input_path

@audio_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    recipe_id = request.form.get('recipe_id')
    if not recipe_id:
        return jsonify({"error": "recipe_id is required"}), 400

    audio_file = request.files['audio']
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        audio_origin_path = temp_audio.name
        audio_file.save(audio_origin_path)
    
    preprocessed_path = None
    try:
        # Preprocess
        preprocessed_path = preprocess_audio(audio_origin_path)
        
        # 1. Transcribe (and Translate to English if needed)
        # Using preprocessed_path for better accuracy
        result = model.transcribe(preprocessed_path, task="translate")
        text = result["text"].strip()
        language = result.get("language", "en")
        
        print(f"Transcribed Text: {text}")

        # 2. Parse Sentence to Semantic Slots
        parsed_result = parse_sentence_to_slots(text)
        if not isinstance(parsed_result, dict) or 'slots' not in parsed_result:
            return jsonify({
                "error": "Failed to parse sentence into semantic slots or unexpected response format",
                "text": text
            }), 500
        
        instruction_data = parsed_result['slots']
        normalized_text = parsed_result.get('normalized_text', text)

        # 3. Create Graph & USR (Reusing graph_routes.py logic)
        graph_manager = GraphDataManager(recipe_id)
        G = create_graph_from_instruction(instruction_data, graph_manager)

        graph_json = nx.node_link_data(G)
        graph_image = generate_graph_image(G)
        hindi_sentence = generate_hindi_sentence(G)

        # Generate USR
        usr_text = graphtousr(
            input_graph=G,
            relations_file_path=DEPENDENCY_ROW_PATH,
            recipe_id=recipe_id,
            db=db
        )

        # Store in DB
        graph_doc = {
            "recipe_id": recipe_id,
            "instruction_payload": instruction_data,
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

        return jsonify({
            "text": text,
            "language": language,
            "instruction_data": instruction_data,
            "graph_id": graph_id,
            "usr_id": usr_id,
            "graph_image": f"data:image/png;base64,{graph_image}",
            "usr_text": usr_text,
            "hindi_sentence": hindi_sentence
        })
    
    except Exception as e:
        error_msg = str(e)
        if "mic" in error_msg.lower() or "permission" in error_msg.lower():
            error_msg = "Microphone access denied or not found."
        elif "empty" in error_msg.lower():
            error_msg = "Recording failed: Empty audio data."
        elif "understand" in error_msg.lower():
            error_msg = "Could not understand audio. Try speaking clearer."
        
        print(f"Audio processing error: {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": error_msg}), 500
    
    finally:
        if os.path.exists(audio_origin_path):
            os.remove(audio_origin_path)
        if preprocessed_path and os.path.exists(preprocessed_path) and preprocessed_path != audio_origin_path:
            os.remove(preprocessed_path)

@audio_bp.route('/process-text', methods=['POST'])
def process_text():
    data = request.get_json() or {}
    text = data.get('text')
    recipe_id = data.get('recipe_id')

    if not text or not recipe_id:
        return jsonify({"error": "text and recipe_id are required"}), 400

    try:
        # 1. Parse Sentence to Semantic Slots
        parsed_result = parse_sentence_to_slots(text)
        if not isinstance(parsed_result, dict) or 'slots' not in parsed_result:
            return jsonify({
                "error": "Failed to parse text into semantic slots or unexpected response format",
                "text": text
            }), 500

        instruction_data = parsed_result['slots']
        normalized_text = parsed_result.get('normalized_text', text)

        # 2. Create Graph & USR
        graph_manager = GraphDataManager(recipe_id)
        G = create_graph_from_instruction(instruction_data, graph_manager)

        graph_json = nx.node_link_data(G)
        graph_image = generate_graph_image(G)
        hindi_sentence = generate_hindi_sentence(G)

        # Generate USR
        usr_text = graphtousr(
            input_graph=G,
            relations_file_path=DEPENDENCY_ROW_PATH,
            recipe_id=recipe_id,
            db=db
        )

        # Store in DB
        graph_doc = {
            "recipe_id": recipe_id,
            "instruction_payload": instruction_data,
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

        return jsonify({
            "text": text,
            "instruction_data": instruction_data,
            "graph_id": graph_id,
            "usr_id": usr_id,
            "graph_image": f"data:image/png;base64,{graph_image}",
            "usr_text": usr_text,
            "hindi_sentence": hindi_sentence
        })
    except Exception as e:
        print(f"Text processing error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@audio_bp.route('/process-slots', methods=['POST'])
def process_slots():
    # This could be used for the Slot-Wise mode
    # For now, it just transcribes and the frontend decides where to put it
    return transcribe_audio()
