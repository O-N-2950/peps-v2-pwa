# PEP's V2 - Progressive Web App

Application de gestion d'offres flash avec authentification et intégration Google Gemini AI.

## Stack Technique

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Flask + Flask-SocketIO + Flask-JWT-Extended
- **Database**: PostgreSQL (Railway)
- **AI**: Google Gemini API
- **Deployment**: Railway

## Installation Locale

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Déploiement Railway

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Credentials de Démo

- Email: `admin@peps.swiss`
- Password: `admin123`

## Variables d'Environnement

```
SECRET_KEY=peps_secret
JWT_SECRET_KEY=peps_jwt_super_secret
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=...
PORT=5000
```
