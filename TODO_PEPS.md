# 📋 TODO LIST - PEP'S

## 🔴 URGENT - À FAIRE IMMÉDIATEMENT

### 1. ❌ Supprimer la section "Téléchargez l'application"
**Fichier** : `/frontend/src/pages/HomePage.jsx`  
**Lignes** : 590-603  
**Action** : Supprimer complètement la section avec App Store et Google Play  
**Raison** : La PWA remplace les applications natives

### 2. ✨ Créer une section "Ajouter à l'écran d'accueil"
**Fichier** : `/frontend/src/pages/HomePage.jsx`  
**Action** : 
- Demander à Gemini la meilleure UX pour expliquer comment installer la PWA
- Créer une section claire et visuelle
- Instructions séparées iOS vs Android
- Design moderne et engageant
- Animations fluides

**Prompt Gemini** :
```
Je développe une PWA qui remplace les apps mobiles natives.
Donne-moi la MEILLEURE UX pour expliquer aux utilisateurs comment ajouter la PWA à leur écran d'accueil :
1. Texte exact (français)
2. Instructions visuelles iOS/Android
3. Design recommandé
4. Animations suggérées
5. Moment idéal d'affichage
Format JSON : title, description, ios_steps, android_steps, design_recommendations, interaction_tips
```

---

## 🟠 IMPORTANT - Système de Réservation

### 3. ⏳ Finaliser le déploiement Railway
**Statut** : Code poussé sur GitHub, attente redéploiement  
**Actions** :
- Vérifier que Railway a bien redéployé
- Tester l'API `/api/partner/2/booking/config`
- Activer WIN WIN Finance Group (statut "active")

### 4. 🔧 Corriger l'API Admin
**Fichier** : `/backend/routes_admin_v20_fixed.py`  
**Problème** : Erreur 500 sur `/api/admin/partners`  
**Solution** : Déjà créée, attente déploiement Railway

### 5. ⚙️ Configurer WIN WIN Finance Group
**Actions** :
- Activer le système de réservation
- Créer le service "Analyse de prévoyance" (CHF 250.-, gratuit membres)
- Configurer horaires : Lun-Jeu 8h-18h, Ven 8h-16h
- Générer les créneaux (30 min, 30 jours à l'avance)

---

## 🟢 AMÉLIORATIONS FUTURES

### 6. 🔗 Intégration Google Calendar
**Statut** : Structure prête, OAuth à implémenter  
**Actions** :
- Configurer OAuth 2.0 Google
- Tester la synchronisation bidirectionnelle
- Gérer les conflits de créneaux

### 7. 📧 Notifications Email/SMS
**Statut** : Structure prête  
**Actions** :
- Configurer SendGrid ou SMTP
- Créer les templates d'emails
- Tester l'envoi de confirmations/rappels

### 8. 📱 PWA - Fonctionnalités Avancées
**Actions** :
- Notifications push (Web Push API)
- Mode offline avec Service Worker
- Icônes adaptées iOS/Android
- Splash screen personnalisé

---

## ✅ TERMINÉ

- ✅ Développement complet système de réservation (backend + frontend)
- ✅ Création WIN WIN Finance Group en production (ID: 2)
- ✅ Déploiement GitHub de tous les fichiers
- ✅ Connexion Railway CLI réussie

---

**Dernière mise à jour** : 26 janvier 2026, 20h00
