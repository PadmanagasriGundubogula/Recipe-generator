from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid
import subprocess
import speech_recognition as sr
import os
import re
import shutil
from . import models, database, auth

app = FastAPI()

# --- HELPER: Question Generation ---
def generate_questions(text: str) -> list:
    """Generate relevant MCQ questions based on transcribed text"""
    if not text or len(text.strip()) < 10:
        return []
    
    questions = []
    text_lower = text.lower()
    
    # Extract potential topics (words longer than 4 chars)
    words = re.findall(r'\b[A-Z][a-z]+\b|\b\w{5,}\b', text)
    unique_words = list(set(words))
    
    templates = [
        {
            "q": "What was a main point discussed regarding {}?",
            "o": ["Its historical context", "Its practical application", "Its future potential", "None of the above"],
            "a": 1
        },
        {
            "q": "The speaker emphasized {} in which context?",
            "o": ["Economic growth", "Technical implementation", "Social impact", "Personal experience"],
            "a": 1
        },
        {
            "q": "Based on the recording, {} is characterized as:",
            "o": ["Highly efficient", "Complex but necessary", "Outdated", "Experimental"],
            "a": 0
        },
        {
            "q": "What is the primary significance of {} here?",
            "o": ["It solves a core problem", "It provides background info", "It is a secondary topic", "It was mentioned in passing"],
            "a": 0
        }
    ]
    
    # Try to generate 4 questions
    selected_words = unique_words[:4]
    for i, word in enumerate(selected_words):
        if i < len(templates):
            tpl = templates[i]
            questions.append({
                "question": tpl["q"].format(word.lower()),
                "options": tpl["o"],
                "answer": tpl["a"]
            })
            
    # Fallback if text is too short or lacks words
    if len(questions) < 4:
        fallbacks = [
            {"question": "What was the overall tone of the recording?", "options": ["Informative", "Urgent", "Casual", "Professional"], "answer": 0},
            {"question": "The main purpose of this audio was to:", "options": ["Explain a concept", "Ask a question", "Give instruction", "Provide a summary"], "answer": 3},
            {"question": "Who is the most likely target audience?", "options": ["General public", "Technical experts", "Students", "Business leaders"], "answer": 1},
            {"question": "Which of these best describes the content?", "options": ["Concise", "Detailed", "Repetitive", "Abstract"], "answer": 0}
        ]
        questions.extend(fallbacks[:4-len(questions)])
    
    return questions[:4]

# --- STARTUP CHECK ---
@app.on_event("startup")
async def startup_event():
    # 1. DB Init
    models.Base.metadata.create_all(bind=database.engine)
    
    # 2. FFMPEG Check
    if not shutil.which("ffmpeg"):
        print("\n" + "="*50)
        print("CRITICAL WARNING: FFMPEG NOT FOUND")
        print("Audio conversion will FAIL. Please install FFMPEG and add it to PATH.")
        print("="*50 + "\n")
    else:
        print("SYSTEM CHECK: FFMPEG is operational.")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vocalize AI Backend v2.0 - Science Edition"}

# --- AUTH ROUTES ---
@app.post("/register")
async def register(username: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter((models.User.username == username) | (models.User.email == email)).first()
    if existing_user: raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pw = auth.get_password_hash(password)
    new_user = models.User(username=username, email=email, hashed_password=hashed_pw)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": auth.create_access_token(data={"sub": user.username}), "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

# --- HISTORY ROUTES ---
@app.get("/history")
async def get_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Transcription).filter(models.Transcription.owner_username == current_user.username).order_by(models.Transcription.created_at.desc()).all()

@app.delete("/history/{tid}")
async def delete_item(tid: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    item = db.query(models.Transcription).filter(models.Transcription.id == tid, models.Transcription.owner_username == current_user.username).first()
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item); db.commit()
    return {"message": "Deleted"}

# --- UPLOAD & TRANSCRIBE ---
@app.post("/upload")
async def upload_audio(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    print(f"PROCESSING FILE: {file.filename} ({file.content_type})")
    
    # 1. Save Uploaded File
    # Determine extension. If blob (recording), it might not have one, so we default to .webm
    ext = os.path.splitext(file.filename)[1]
    if not ext: ext = ".webm" 
    
    unique_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{unique_id}{ext}")
    wav_path = os.path.join(UPLOAD_DIR, f"{unique_id}.wav")

    try:
        with open(input_path, "wb") as f:
            f.write(await file.read())
        
        # 2. Conversion (FFMPEG)
        # Fix: Ensure input and output paths are different even if file is .wav
        if input_path == wav_path:
            # Rename input temporarily or use a different wav_path
            temp_input = input_path + ".tmp"
            os.rename(input_path, temp_input)
            input_path = temp_input

        if not shutil.which("ffmpeg"):
            raise Exception("Server Configuration Error: FFMPEG is missing. Cannot process audio.")

        print(f"Converting {input_path} -> {wav_path}...")
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, 
            "-ar", "16000", "-ac", "1", 
            wav_path
        ], check=True, stderr=subprocess.PIPE)

        # 3. Transcribe
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio)
        print(f"SUCCESS: {text[:50]}...")
        
        # 4. Save & return
        questions = generate_questions(text)
        new_transcription = models.Transcription(filename=file.filename, text=text, owner_username=current_user.username)
        db.add(new_transcription); db.commit(); db.refresh(new_transcription)
        
        # Cleanup
        try:
            os.remove(input_path)
            os.remove(wav_path)
        except: pass

        return {"text": text, "questions": questions, "id": new_transcription.id, "created_at": new_transcription.created_at}

    except subprocess.CalledProcessError as e:
        print(f"FFMPEG ERROR: {e}")
        return {"text": "Error: Audio format conversion failed. Is the file corrupted?"}
    except sr.UnknownValueError:
        return {"text": "Error: Could not understand audio. Try speaking clearer."}
    except sr.RequestError as e:
        return {"text": f"Error: Speech API unavailable ({e})"}
    except Exception as e:
        print(f"GENERAL ERROR: {e}")
        return {"text": f"Error: {str(e)}"}
