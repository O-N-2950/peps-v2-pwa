# 🚨 Erreur de Crash Backend - V7.1

**Date:** 21 décembre 2025  
**Statut:** ❌ CRASHED au démarrage

---

## 🐛 ERREUR DÉTECTÉE

### Problème: BackgroundScheduler non importé

**Erreur Python:**
```
File "/app/backend/app.py", line 40, in <module>
scheduler = BackgroundScheduler()
            ^^^^^^^^^^^^^^^^^^^
NameError: name 'BackgroundScheduler' is not defined
```

**Cause:**
- `BackgroundScheduler()` est utilisé ligne 40 de app.py
- Mais l'import `from apscheduler.schedulers.background import BackgroundScheduler` est manquant

---

## 🔧 SOLUTION

### Ajouter l'import manquant dans app.py

**Ligne à ajouter au début de app.py:**
```python
from apscheduler.schedulers.background import BackgroundScheduler
```

---

## 📋 CONTEXTE

**Historique:**
- V7.1 de Gemini utilisait `BackgroundScheduler` pour les tâches planifiées
- L'import a été oublié dans le fichier fourni par Gemini
- Le build réussit (react-leaflet@4.2.1 OK)
- Mais l'application crash au démarrage Python

---

## ✅ FIX À APPLIQUER

1. Ajouter l'import BackgroundScheduler dans app.py
2. Commit et push
3. Railway redéploiera automatiquement
4. L'application devrait démarrer correctement
