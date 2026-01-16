# ❌ ERREUR V8 - Colonne manquante dans la base de données

## 🐛 Erreur détectée dans les logs Railway

```
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedColumn) 
column partners.booking_enabled does not exist
```

**Ligne problématique dans app.py (ligne 208):**
```python
"booking": o.partner.booking_enabled
```

## 📊 Diagnostic

**Problème:** Le code V8 utilise `booking_enabled` mais la base de données a encore l'ancien schéma (V7.1).

**Cause:** La base de données n'a PAS été réinitialisée avec `/api/nuke_db` et `/api/setup_v8`.

## ✅ Solution

**OBLIGATOIRE:** Réinitialiser la base de données avec les commandes Gemini:

1. `curl https://www.peps.swiss/api/nuke_db`
2. `curl https://www.peps.swiss/api/setup_v8`

**MAIS:** `/api/nuke_db` retourne 404 Not Found !

**Cause probable:** L'endpoint `/api/nuke_db` n'existe pas dans le code V8 de Gemini.

## 🔍 Vérification nécessaire

Vérifier si le fichier app.py V8 contient bien:
- Route `/api/nuke_db`
- Route `/api/setup_v8`

Si ces routes sont manquantes, Gemini a oublié de les inclure dans le code V8.
