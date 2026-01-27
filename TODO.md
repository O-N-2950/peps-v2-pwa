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
