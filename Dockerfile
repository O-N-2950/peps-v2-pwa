# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

# Stage 2: Setup backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Start command
CMD ["sh", "-c", "gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} --timeout 300 app:app"]
