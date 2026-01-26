# 📱 Recommandations UX PWA - Par Gemini

## 🎯 Placement du Bouton d'Installation

### 1. Smart App Banner (Priorité #1)
**Mécanisme natif du navigateur**
- Apparaît automatiquement en haut de l'écran
- Non-intrusif, ne masque pas le contenu
- Se déclenche quand les critères PWA sont remplis

### 2. Floating Action Button (FAB)
**Position** : Bas à droite
- Se déplace légèrement lors du scroll
- Icône explicite (flèche vers le bas, icône télécharger)
- Familier pour les actions principales

### 3. Header/Navigation
**Dans le menu hamburger**
- "Installer l'application"
- "Obtenir l'expérience complète"
- Option de repli claire

---

## 💬 Wording Recommandé

1. **"Installer l'Application"** ✅ (Le plus clair)
2. "Ajouter à l'écran d'accueil"
3. "Obtenir PEP'S (App)"
4. "Passer à l'expérience complète"

---

## ⏰ Stratégie de Déclenchement Automatique

### ❌ JAMAIS sur la première visite
**Raison** : Risque de taux de rebond élevé

### ✅ Après un signe d'engagement (Session 2-3)
**Déclencheurs** :
- Action clé complétée (ajout panier, 3 pages vues)
- 2 minutes passées sur le site
- Retour pour une 2ème session

### ✅ Contextuel
**Exemple** : "Installez l'app pour accéder à cette fonctionnalité hors ligne"

### 📌 Important
Le modal PWAInstallGuide ne doit s'ouvrir QUE sur clic intentionnel, jamais automatiquement.

---

## 🎨 Indices Visuels pour Renforcer le Sentiment "App Native"

### 1. Écran de Splash + Icône
- Icône bien définie dans le manifest
- Splash screen au lancement

### 2. Mode Standalone
- Pas de barre d'adresse
- Pas de boutons de navigation du navigateur

### 3. Animations Fluides
- Transitions Material Design ou iOS style
- Pas de rafraîchissement standard de page

### 4. Feedback Haptique
- Vibrations légères sur actions clés
- Sentiment de tangibilité

### 5. Capacités Offline
- Mentionner clairement : "Fonctionne même sans connexion internet"
- Service Worker actif

---

## 🚀 Plan d'Implémentation

1. ✅ Supprimer section App Store/Google Play
2. ✅ Ajouter FAB en bas à droite
3. ✅ Améliorer le manifest PWA
4. ✅ Configurer le mode standalone
5. ✅ Ajouter animations fluides
6. ✅ Implémenter stratégie de déclenchement progressive
