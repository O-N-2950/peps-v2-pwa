# 🚨 Erreur de Déploiement Railway - V7.1

**Date:** 21 décembre 2025  
**Commit:** dd3caca6 (📍 Migration DNS vers www.peps.digital)  
**Statut:** ❌ FAILED

---

## 🐛 ERREUR DÉTECTÉE

### Problème: Conflit de dépendances React

**Erreur npm:**
```
npm error ERESOLVE could not resolve
npm error While resolving: react-leaflet@5.0.0
npm error Found: react@18.3.1
npm error Could not resolve dependency:
npm error peer react@"^19.0.0" from react-leaflet@5.0.0
npm error Conflicting peer dependency: react@19.2.3
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
```

**Cause:**
- `react-leaflet@5.0.0` requiert `react@^19.0.0`
- Le projet utilise `react@18.3.1`
- Conflit de peer dependency

---

## 🔧 SOLUTION

### Option 1: Utiliser --legacy-peer-deps (Rapide)

**Modifier package.json:**
```json
{
  "scripts": {
    "install": "npm install --legacy-peer-deps"
  }
}
```

### Option 2: Downgrade react-leaflet (Recommandé)

**Utiliser une version compatible avec React 18:**
```bash
npm install react-leaflet@4.2.1 --save
```

`react-leaflet@4.2.1` est compatible avec React 18.

### Option 3: Upgrade React vers 19 (Non recommandé)

Peut casser d'autres dépendances.

---

## ✅ SOLUTION CHOISIE: Option 2 (Downgrade react-leaflet)

**Avantages:**
- ✅ Pas de conflit de dépendances
- ✅ Stable et testé
- ✅ Compatible avec toutes les autres dépendances
- ✅ Pas besoin de --legacy-peer-deps

**Inconvénients:**
- ⚠️ Version légèrement plus ancienne (4.2.1 vs 5.0.0)
- ⚠️ Quelques fonctionnalités mineures en moins

---

## 📋 ACTIONS À EFFECTUER

1. Downgrade react-leaflet
2. Commit et push
3. Railway redéploiera automatiquement
4. Vérifier que le déploiement réussit

---

## 🔍 HISTORIQUE DES DÉPLOIEMENTS

**Derniers déploiements:**
- ❌ dd3caca6 - Migration DNS (FAILED - 8 min ago)
- ✅ Redeployment successful - 27 min ago
- ❌ V7.1 FINAL (FAILED - yesterday)
- ❌ Fix nixpacks (FAILED - yesterday)
- ❌ V7 FINAL (FAILED - yesterday)
- ✅ V5 FINAL (SUCCESS - 2 days ago)

**Conclusion:** Le problème est apparu avec l'ajout de react-leaflet dans la V7.
