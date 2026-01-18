# --- ÉTAPE 1 : CONSTRUCTION DU FRONTEND (Node.js) ---
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend

# Installation des dépendances
COPY frontend/package*.json ./
RUN npm install

# Copie du code et Build
COPY frontend/ ./
RUN npm run build

# --- ÉTAPE 2 : PRÉPARATION DU BACKEND (Python) ---
FROM python:3.11-slim
WORKDIR /app/backend

# Installation des dépendances système (PostgreSQL)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Installation des dépendances Python
COPY backend/requirements.txt ./
# On installe les libs (Assurez-vous que requirements.txt est la version V11 sans eventlet)
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code Backend
COPY backend/ ./

# ⚠️ RÉCUPÉRATION DU FRONTEND CONSTRUIT (Depuis l'étape 1)
# On le place exactement où Flask l'attend : ../frontend/dist par rapport au dossier backend
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# --- DÉMARRAGE (MODE SYNCHRONE STABLE V11) ---
# Utilisation de threads pour gérer la charge sans eventlet
CMD gunicorn -w 1 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT app:app
