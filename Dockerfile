# ====================================================================
# STAGE 1: Frontend Build (Node.js)
# ====================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copier les fichiers de dépendances
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le code source frontend
COPY frontend/ ./

# Build du frontend
RUN pnpm run build
RUN ls -la dist/ && echo "✅ Frontend build réussi - dist/ existe"

# ====================================================================
# STAGE 2: Python Dependencies Builder (ASTUCE ANTI-OOM DE GEMINI)
# ====================================================================
# Utiliser python:3.11 (pas slim) pour avoir les outils de build
FROM python:3.11 AS python-builder

WORKDIR /app

# Copier requirements.txt
COPY backend/requirements.txt ./

# ASTUCE ANTI-OOM : Séparer la résolution et l'installation
# Étape 1 : Créer les wheels (peu gourmand en RAM)
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

# Étape 2 : Installer depuis les wheels locaux (quasi 0 RAM)
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt

# ====================================================================
# STAGE 3: Final Runtime Image (Léger et Sécurisé)
# ====================================================================
FROM python:3.11-slim

WORKDIR /app

# Copier les dépendances installées depuis le stage python-builder
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin

# Copier le code backend
COPY backend/ ./backend/

# Copier le frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN ls -la /app/frontend/dist/ && echo "✅ Frontend copié dans /app/frontend/dist"

# Set working directory to backend
WORKDIR /app/backend

# Exposer le port
ENV PORT 5000
EXPOSE 5000

# Lancer l'application avec Gunicorn
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} --timeout 300 app:app"]
