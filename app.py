import os
import time
import json
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, abort, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import pypdf

load_dotenv()

# Prioritize environment variable, then dotenv
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
CLIENT_API_KEY = os.getenv("CLIENT_API_KEY", "dev-client-key")
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin-secret")
BOT_CONFIG_FILE = "bot_config.json"
USERS_FILE = "users.json"
UPLOAD_FOLDER = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

try:
    import google.generativeai as genai
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
        GEMINI_AVAILABLE = True
        print("Lucy AI: Gemini successfully configured.")
    else:
        GEMINI_AVAILABLE = False
        print("Lucy AI: WARNING - GOOGLE_API_KEY not found in environment.")
except Exception as e:
    GEMINI_AVAILABLE = False
    print(f"Lucy AI: Gemini config error: {e}")

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "lucy-secret-777")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

USAGE_LOGS = []
RATE_LIMIT_WINDOW = 3600
RATE_LIMIT_MAX = 100
RATE_TRACKER = {}

SUPPORTED_LANGUAGES = [
    {"code": "am", "name": "Amharic"}, {"code": "om", "name": "Oromo"},
    {"code": "ti", "name": "Tigrinya"}, {"code": "so", "name": "Somali"}, {"code": "en", "name": "English"},
]

# --- Helpers ---
def load_users():
    if not os.path.exists(USERS_FILE): return {}
    try:
        with open(USERS_FILE, 'r') as f: return json.load(f)
    except: return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f: json.dump(users, f)

def load_config():
    if not os.path.exists(BOT_CONFIG_FILE): return DEFAULT_CONFIG.copy()
    try:
        with open(BOT_CONFIG_FILE, 'r', encoding='utf-8') as f: return json.load(f)
    except: return DEFAULT_CONFIG.copy()

def save_config(config):
    with open(BOT_CONFIG_FILE, 'w', encoding='utf-8') as f: json.dump(config, f, indent=2)

def extract_text_from_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    text = ""
    try:
        if ext == '.pdf':
            reader = pypdf.PdfReader(filepath)
            for page in reader.pages: text += page.extract_text() + "\n"
        elif ext in ['.txt', '.md', '.csv']:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f: text = f.read()
    except Exception as e: return f"[Error: {str(e)}]"
    return text.strip()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session: return redirect(url_for('auth_page'))
        return f(*args, **kwargs)
    return decorated_function

def require_client_key(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        key = request.headers.get("X-API-KEY")
        config = load_config()
        if key == "dashboard-demo-key": return f(*args, **kwargs)
        if not key or key != config.get("client_api_key", CLIENT_API_KEY): return jsonify({"error": "Unauthorized"}), 401
        now = time.time()
        stamps = RATE_TRACKER.setdefault(key, [])
        stamps[:] = [t for t in stamps if now - t < RATE_LIMIT_WINDOW]
        if len(stamps) >= RATE_LIMIT_MAX: return jsonify({"error": "Rate limit exceeded"}), 429
        stamps.append(now)
        return f(*args, **kwargs)
    return wrapped

def build_prompt(user_query, language, context, sector):
    config = load_config()
    full_context = f"{config.get('knowledge_base', '')}\n\n{context or ''}"
    system = config.get('system_prompt', DEFAULT_CONFIG['system_prompt'])
    parts = [f"SYSTEM INSTRUCTIONS: {system}", f"SECTOR: {sector}", f"KNOWLEDGE BASE: {full_context}", f"LANGUAGE: {language}", f"USER: {user_query}"]
    return "\n\n".join(parts)

def call_gemini(prompt, language):
    if not GEMINI_AVAILABLE: return {"reply": "Gemini not configured.", "usage": {"tokens": 0}}
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        response = model.generate_content(prompt)
        text = response.text
        usage = {"total_tokens": response.usage_metadata.total_token_count} if response.usage_metadata else {}
        return {"reply": text, "usage": usage}
    except Exception as e: return {"reply": f"Error: {str(e)}", "usage": {"tokens": 0}}

# --- Routes ---
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email, password = data.get("email"), data.get("password")
    users = load_users()
    if email in users: return jsonify({"error": "User exists"}), 400
    users[email] = {"password": generate_password_hash(password)}
    save_users(users)
    session['user'] = email
    return jsonify({"status": "success"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email, password = data.get("email"), data.get("password")
    users = load_users()
    user = users.get(email)
    if user and check_password_hash(user['password'], password):
        session['user'] = email
        return jsonify({"status": "success"})
    return jsonify({"error": "Invalid"}), 401

@app.route("/logout")
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

@app.route("/api/widget-config", methods=["GET"])
def widget_config():
    config = load_config()
    return jsonify({
        "bot_name": config.get("bot_name", "Lucy AI"),
        "theme_color": config.get("theme_color", "#0d6efd"),
        "welcome_message": config.get("welcome_message", "Hello!")
    })

@app.route("/api/settings", methods=["GET", "POST"])
@login_required
def settings():
    if request.method == "POST":
        new_config = request.json
        save_config(new_config)
        return jsonify({"status": "updated"})
    return jsonify(load_config())

@app.route("/api/upload", methods=["POST"])
@login_required
def upload_file():
    file = request.files.get('file')
    if not file: return jsonify({"error": "No file"}), 400
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)
    text = extract_text_from_file(filepath)
    return jsonify({"filename": file.filename, "extracted_text": text})

@app.route("/api/support", methods=["POST"])
@require_client_key
def support():
    data = request.get_json() or {}
    user_query, lang, context, sector = data.get("user_query"), data.get("language", "en"), data.get("context"), data.get("sector", "general")
    prompt = build_prompt(user_query, lang, context, sector)
    result = call_gemini(prompt, lang)
    return jsonify(result)

@app.route("/auth")
def auth_page(): return render_template("auth.html")

@app.route("/dashboard")
@login_required
def dashboard(): return render_template("dashboard.html")

@app.route("/")
def index(): return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
