# 📋 TODO - PEP's Digital

## 🚀 Migration vers peps.digital (QUAND LE DOMAINE SERA ACTIF)

### 1. Configuration Railway
- [ ] Ajouter le domaine custom `peps.digital` dans Railway
- [ ] Configurer les DNS (A record ou CNAME selon Railway)
- [ ] Attendre propagation DNS (24-48h)
- [ ] Vérifier certificat SSL automatique

### 2. Mise à jour Webhook Stripe
- [ ] Se connecter à https://dashboard.stripe.com/webhooks
- [ ] Modifier le webhook existant (whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk)
- [ ] Remplacer l'URL: `https://www.peps.swiss/api/stripe-webhook` → `https://peps.digital/api/stripe-webhook`
- [ ] Sauvegarder et tester avec "Send test webhook"

### 3. Mise à jour manifest.json
```json
{
  "name": "PEP's Digital",
  "short_name": "PEP's",
  "start_url": "https://peps.digital",
  "scope": "https://peps.digital/"
}
```

### 4. Tests post-migration
- [ ] Tester géolocalisation GPS
- [ ] Tester affichage carte Leaflet
- [ ] Tester paiement Stripe (mode test puis live)
- [ ] Vérifier réception webhook Stripe
- [ ] Tester installation PWA sur mobile
- [ ] Vérifier QR codes partenaires

---

## 🔑 Clés et Secrets (NE PAS COMMITTER)

**Variables d'environnement Railway:**
- `STRIPE_SECRET_KEY`: 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
- `STRIPE_PUBLIC_KEY`: pk_live_51R6rR9GpzOqyzNB7aMcWLjUX9kb3jpthTGjMnUxtBDe8vwepoO2phcyCu5qfdmduzklE94jq73AChxncY0624XH600Ffrlqarp
- `STRIPE_WEBHOOK_SECRET`: whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk
- `PERPLEXITY_API_KEY`: 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
- `FRONTEND_URL`: https://www.peps.swiss (à changer en https://peps.digital)

---

## 📦 Version actuelle: V7 FINAL

**Fonctionnalités:**
- ✅ Géolocalisation GPS en temps réel
- ✅ Tri automatique par distance (formule Haversine)
- ✅ 5 types d'offres (Flash/Permanent/Daily/Weekly/Seasonal)
- ✅ Carte interactive Leaflet avec marqueurs GPS
- ✅ Paiement Stripe LIVE avec webhooks
- ✅ QR codes pour activation privilèges
- ✅ WebSocket pour stock en temps réel
- ✅ IA Perplexity pour catégorisation automatique
- ✅ PWA installable

**Stack:**
- Backend: Flask + SQLAlchemy + SocketIO + Stripe
- Frontend: React + Vite + Tailwind + Framer Motion + Leaflet
- Database: SQLite (via SQLAlchemy)
- Déploiement: Railway avec Nixpacks

---

## 🎨 Branding

**Couleurs officielles:**
- Turquoise: `#3D9A9A`
- Rose: `#E06B7D`

**Slogan:**
"Soutenir l'économie locale par l'innovation digitale"

**Logo:**
`/frontend/public/logo.jpg` (Lgocompletblanc.png converti)


---

## 🐛 BUGS À CORRIGER (Ajouté le 2026-01-27)

### Dashboard Partner V21 - Page blanche
**Statut:** EN COURS DE CORRECTION
**Problème:** Le Dashboard Partner affiche une page blanche quand le partenaire n'a pas de privilèges
**Cause:** `privileges.map()` crash quand `privileges` est un tableau vide `[]`
**Solution appliquée:** Ajout d'une vérification `privileges && privileges.length > 0` avant le `.map()`
**Fichier modifié:** `frontend/src/components/PartnerDashboardV21.jsx`
**Commit:** `fix: Handle empty privileges array in Partner Dashboard V21`
**⚠️ ATTENTION:** Le build semble ne pas avoir pris en compte les changements

**Actions à faire:**
- [ ] Vérifier les logs de build Railway
- [ ] Forcer un rebuild complet si nécessaire
- [ ] Vérifier que le nouveau bundle JS est bien généré

### Formulaire de connexion - Icône "œil" manquante
**Statut:** TODO
**Problème:** Impossible de visualiser le mot de passe saisi dans le formulaire de connexion
**Solution:** Ajouter un toggle "show/hide password" avec icône œil
**Actions à faire:**
- [ ] Ajouter un state `showPassword` dans le composant LoginForm
- [ ] Ajouter un bouton avec icône œil (👁️)
- [ ] Toggle entre `type="password"` et `type="text"`
- [ ] Ajouter une animation Framer Motion
- [ ] Tester sur mobile et desktop

---

## 🎯 NOUVELLES FONCTIONNALITÉS À IMPLÉMENTER

### Système de privilèges planifiés
**Statut:** TODO
**Description:** Permettre aux partenaires de planifier l'activation/désactivation automatique de leurs privilèges
**Use case:** Restaurateur avec menu du jour qui change automatiquement

**Backend:**
- [ ] Migration base de données pour nouveaux champs:
  - `is_permanent` (boolean, default: true)
  - `start_date` (date, nullable)
  - `end_date` (date, nullable)
  - `days_of_week` (JSON array, nullable)
  - `start_time` (time, nullable)
  - `end_time` (time, nullable)
- [ ] Cron job pour activation/désactivation automatique
- [ ] API endpoints pour CRUD des planifications

**Frontend:**
- [ ] Case à cocher "Privilège permanent" (cochée par défaut)
- [ ] Interface de planification (dates, jours, heures)
- [ ] Upload multiple d'images pour chaque jour/période

---

## ✅ RÉALISATIONS RÉCENTES (2026-01-27)

1. **Route de réinitialisation de mot de passe WIN WIN** - ✅ DÉPLOYÉ
   - Route: `/api/reset-winwin-password-temp`
   - Mot de passe: `Cristal4you11++`
   - Email: `contact@winwin.swiss`

2. **Correction Dashboard Partner V21** - ✅ COMMIT FAIT (en attente de déploiement)
   - Gestion du tableau vide de privilèges
   - Affichage d'un état vide convivial avec CTA

---

**Dernière mise à jour:** 2026-01-27 12:42 GMT+1


---

## 🔴 NOUVELLES PRIORITÉS (Ajouté le 2026-01-28 00:45)

### **SYSTÈME DE TRACKING + FEEDBACK + CLASSEMENT**

#### **Backend**
- [ ] Créer la table `privilege_activations` (id, member_id, partner_id, privilege_id, activated_at, feedback_rating, feedback_comment, feedback_submitted_at)
- [ ] Endpoint `/api/member/check-subscription` : Vérifier le statut de l'abonnement
- [ ] Endpoint `/api/member/activate-privilege` : Activer un privilège (avec vérification abonnement)
- [ ] Endpoint `/api/member/submit-feedback` : Soumettre un feedback (5 étoiles + texte optionnel)
- [ ] Endpoint `/api/admin/activations` : Liste des activations pour l'admin
- [ ] Endpoint `/api/admin/partner-ratings` : Notes et classement des commerçants
- [ ] Endpoint `/api/admin/send-warning` : Envoyer un avertissement à un commerçant
- [ ] Endpoint `/api/admin/exclude-partner` : Exclure un commerçant
- [ ] Système d'alertes "Triple Strike" automatique
- [ ] Webhook Stripe `/api/webhooks/stripe` : Gérer les renouvellements d'abonnement

#### **Frontend Membre - DCI (Détection Contextuelle Intelligente)**
- [ ] Géolocalisation en temps réel (GPS + Wi-Fi + Cellulaire)
- [ ] Pré-chargement des commerces à proximité (500m en arrière-plan)
- [ ] Détection automatique du commerce le plus proche (< 50m)
- [ ] Affichage du gros bouton "ACTIVER CHEZ [NOM]" sur la home page
- [ ] Gestion des cas limites :
  - [ ] Plusieurs commerces proches (< 50m) → Afficher la liste
  - [ ] Aucun commerce détecté → Afficher la liste des commerces à 500m
  - [ ] Commerce fermé → Griser le bouton et afficher les horaires

#### **Frontend Membre - Écran d'activation "MEMBRE ACTIF"**
- [ ] Animation d'étoiles (Lottie) pendant 1.5s
- [ ] Fond gradient vert/violet PEP's
- [ ] Texte géant "MEMBRE ACTIF ✅"
- [ ] Photo + Nom du membre
- [ ] Grade (💎 Diamant, 🥇 Or, 🥈 Argent, 🥉 Bronze)
- [ ] **Date et heure en temps réel** (mise à jour chaque seconde) - ANTI-SCREENSHOT
- [ ] Nom du privilège activé
- [ ] Expiration après 2 minutes (écran devient gris)
- [ ] Vibration haptique du téléphone

#### **Frontend Membre - Gestion abonnement expiré**
- [ ] Vérifier le statut de l'abonnement AVANT activation
- [ ] Si expiré : Afficher l'écran rouge "ABONNEMENT EXPIRÉ"
- [ ] Bouton "RENOUVELER MAINTENANT (CHF XX/an)"
- [ ] Redirection vers Stripe Checkout
- [ ] Après paiement confirmé :
  - [ ] Activation automatique du privilège en attente
  - [ ] Prolongation automatique de l'abonnement (+1 an)
  - [ ] Affichage de l'écran "MEMBRE ACTIF"

#### **Frontend Membre - Feedback optionnel**
- [ ] Notification push 5 minutes après l'activation
- [ ] Formulaire simple :
  - [ ] 5 étoiles cliquables (note obligatoire)
  - [ ] Champ texte optionnel pour commentaire
  - [ ] Boutons "Envoyer" et "Plus tard"
- [ ] Récompense : +10 points PEP's si feedback laissé
- [ ] Lien du feedback avec l'activation (date, heure, commerce, privilège)

#### **Frontend Commerçant**
- [ ] Écran "MEMBRE EN ATTENTE" pendant le paiement (si abonnement expiré)
- [ ] Écran "MEMBRE ACTIF ✅" après validation
- [ ] NE PAS afficher la note moyenne du commerçant (seulement l'admin la voit)

#### **Dashboard Admin - Activations en temps réel**
- [ ] Table des activations :
  - [ ] Colonnes : Date & Heure | Membre | Commerce | Privilège | Note | Commentaire | Actions
  - [ ] Filtres : Par commerce, par membre, par date, par note
  - [ ] Tri : Par date (plus récent en premier)
- [ ] Voir tous les feedbacks avec leurs activations liées

#### **Dashboard Admin - Classement des Commerçants**
- [ ] Podium Top 3 (🥇🥈🥉) avec photos et médailles
- [ ] Liste complète triable par :
  - [ ] Note moyenne (⭐)
  - [ ] Taux de conformité (%)
  - [ ] Volume d'avis (#)
  - [ ] Score de négativité (🔴)
- [ ] Métriques par commerçant :
  - [ ] ✅ Taux de conformité : % de "Oui" à "Privilège appliqué ?"
  - [ ] ⭐ Note moyenne (30 derniers jours)
  - [ ] 📈 Volume d'avis
  - [ ] 🔴 Score de négativité (nombre d'alertes)

#### **Dashboard Admin - Système d'alertes "Triple Strike"**
- [ ] 🟡 **Alerte 1** : 3 avis "Non appliqué" consécutifs OU Note < 2.0/5
  - [ ] Email automatique au commerçant
  - [ ] Notification Slack à l'admin
  - [ ] Mise sous surveillance
- [ ] 🟠 **Alerte 2** : 2 Alertes Rouges en 30 jours
  - [ ] **Suspension temporaire** de l'offre
  - [ ] Appel obligatoire de l'admin
  - [ ] Message : "Offre en maintenance"
- [ ] 🔴 **Alerte 3** : 3 Alertes Rouges en 90 jours
  - [ ] **EXCLUSION DÉFINITIVE** de PEP's
  - [ ] Rupture de contrat
- [ ] Bouton "Envoyer un avertissement" pour chaque commerçant
- [ ] Bouton "Exclure le commerçant" pour exclusion manuelle

#### **Dashboard Admin - Recommandations IA (Gemini Flash)**
- [ ] Section "Recommandations IA"
- [ ] Analyse automatique des notes et tendances
- [ ] 🚨 Alertes prioritaires : "3 commerçants nécessitent une intervention urgente"
- [ ] 📉 Tendances négatives : "Le Café du Coin a perdu 1.2 étoiles ce mois-ci"
- [ ] 📈 Opportunités : "5 commerçants ont un taux de conformité > 95%, mettez-les en avant"
- [ ] 💡 Suggestions : "Envoyez un email de félicitations aux Top 10"

---

### **MODE VISITEUR (Inscription progressive)**

#### **Concept**
- Visiteur peut explorer l'app SANS PAYER :
  - Voir tous les commerçants partenaires
  - Voir la carte interactive
  - Voir les privilèges disponibles
  - Voir les offres flash
- S'inscrire (nom, email, adresse) → Compte "Membre Visiteur" (inactif)
- Quand il veut activer un privilège → Paiement Stripe
- Après paiement → "Membre Actif" (toutes les infos déjà saisies !)

#### **À faire**
- [ ] Consulter Gemini sur l'UX du mode Visiteur
- [ ] Créer le bouton "Mode Visiteur" ou "Explorer sans compte" sur la home page
- [ ] Créer le formulaire d'inscription (sans paiement)
  - [ ] Nom, Prénom, Email, Adresse, Téléphone
  - [ ] Acceptation des CGV
  - [ ] Bouton "S'inscrire gratuitement"
- [ ] Créer le statut "visitor" dans la table `users`
- [ ] Limiter les fonctionnalités pour les visiteurs :
  - [ ] Pas d'activation de privilège (bouton "Devenir membre actif")
  - [ ] Pas d'accès aux favoris
  - [ ] Pas d'accès à l'historique
- [ ] Afficher un CTA "Devenir membre actif" sur chaque page visiteur
- [ ] Lors de la première tentative d'activation → Redirection vers paiement Stripe
- [ ] Après paiement → Upgrade automatique "visitor" → "member"

---

### **NAVIGATION ET UX**

#### **Navigation principale (Bottom Tab Bar)**
- [ ] 🏠 **Accueil** : DCI + Quick Actions + Dashboard
- [ ] ⚡ **Activer** : Liste des commerces à proximité + Recherche
- [ ] 🗺️ **Carte** : Carte interactive pour découverte
- [ ] ⭐ **Favoris** : Commerces favoris
- [ ] 👤 **Profil** : Compte membre

#### **Dashboard Membre - Simplification**
- [ ] **Réduire le nombre d'icônes** (trop d'icônes actuellement)
- [ ] Afficher le prénom du membre au lieu de "Membre"
- [ ] Connecter les vraies données du backend gamification

---

### **TEMPS ESTIMÉ**

| Tâche | Temps |
|-------|-------|
| Backend tracking + feedback + abonnement | 4h |
| UX activation (DCI + étoiles + horloge) | 3h |
| Gestion abonnement expiré + Stripe | 2h |
| Feedback optionnel (formulaire + notification) | 2h |
| Dashboard Admin (classement + alertes) | 3h |
| Recommandations IA (Gemini Flash) | 2h |
| Mode Visiteur (conception + implémentation) | 4h |
| Navigation (5 onglets + simplification) | 2h |
| Tests end-to-end | 2h |
| **TOTAL** | **24h** |

---

**Dernière mise à jour:** 2026-01-28 00:45 GMT+1
