import sys
import os
import stripe
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# 1. FORCE LOGS (Pour voir ce qui se passe)
sys.stdout.reconfigure(line_buffering=True)
print("🚀 DÉMARRAGE DU SERVEUR V11 (MODE SYNCHRONE)...", file=sys.stdout)

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

# 2. CONFIGURATION BASIQUE
app.config['SECRET_KEY'] = 'rescue_mode_v11'
database_url = os.getenv('DATABASE_URL', 'sqlite:///peps.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    db = SQLAlchemy(app)
    print("✅ SQLAlchemy Initialisé", file=sys.stdout)
except Exception as e:
    print(f"❌ Erreur Init DB: {e}", file=sys.stdout)

# --- ROUTES DE VIE ---
@app.route('/api/health')
def health():
    return jsonify({
        "status": "ONLINE",
        "mode": "Sync (Stable)",
        "python": sys.version
    })

@app.route('/api/db-test')
def db_test():
    try:
        # Test simple de connexion
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({"status": "DB CONNECTED 🟢"})
    except Exception as e:
        return jsonify({"status": "DB ERROR 🔴", "error": str(e)}), 500

# Catch-all pour le frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    return f"PEP's V11 Rescue Mode. Path: {path}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
