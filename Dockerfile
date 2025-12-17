# ÉTAPE 1 : Construction du Frontend (Node.js)
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
# On copie les fichiers de config npm
COPY frontend/package*.json ./
# On installe et on build
RUN npm install
COPY frontend/ ./
RUN npm run build

# ÉTAPE 2 : Construction du Backend (Python)
FROM python:3.11-slim
WORKDIR /app

# Installation des dépendances Python
COPY backend/requirements.txt ./
# Installation propre sans cache
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code Backend
COPY backend/ ./backend

# ÉTAPE 3 : Fusion (On récupère le build React de l'étape 1)
# On place le build React exactement là où Flask l'attend (../frontend/dist)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Configuration finale
ENV PORT=8080
# Variable DB (Railway l'écrasera avec la vraie URL)
ENV DATABASE_URL=sqlite:///peps_dev.db

# Démarrage forcé de Gunicorn (Pas de Caddy ici !)
# On force le dossier de travail 'backend' et on lance l'app
CMD gunicorn --chdir backend -k eventlet -w 1 --bind 0.0.0.0:$PORT app:app
