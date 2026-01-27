# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build
RUN ls -la dist/ && echo "✅ Frontend build réussi - dist/ existe"

# Stage 2: Setup backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies with optimization
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libffi-dev \
        libssl-dev \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Clean up build dependencies to save memory and space
RUN apt-get purge -y --auto-remove gcc build-essential libffi-dev libssl-dev

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
RUN ls -la /app/frontend/dist/ && echo "✅ Frontend copié dans /app/frontend/dist"

# Set working directory to backend
WORKDIR /app/backend

# Expose port
ENV PORT 5000
EXPOSE 5000

# Start command (optimized)
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} --timeout 300 app:app"]
