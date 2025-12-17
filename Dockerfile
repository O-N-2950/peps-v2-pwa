FROM python:3.11-slim

WORKDIR /app

# Installer Node.js pour construire le frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copier les fichiers du projet
COPY . .

# Construire le frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Installer les dépendances Python
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "app:app"]
