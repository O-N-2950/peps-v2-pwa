# 🚀 Guide de Déploiement et Test V7.1

**Version:** V7.1 FINAL - Followers Analytics + IA Proactive + Dashboards  
**Commit:** d6aa5c9  
**Date:** 19 décembre 2025

---

## ✅ INSTALLATION TERMINÉE

### Fichiers installés (7/7)
1. ✅ **backend/models.py** - Table followers avec timestamp
2. ✅ **backend/app.py** - Endpoints followers + IA + admin
3. ✅ **frontend/src/components/PartnerDashboard.jsx** - Stats + graphiques + suggestions IA
4. ✅ **frontend/src/components/AdminDashboard.jsx** - Vue globale + table triable
5. ✅ **frontend/src/components/WahooCard.jsx** - Bouton cœur + compteur followers
6. ✅ **frontend/src/components/MemberHome.jsx** - Section favoris
7. ✅ **frontend/src/App.jsx** - Route /admin ajoutée

### Dépendances installées
- ✅ recharts (graphiques)
- ✅ date-fns (formatage dates)
- ✅ framer-motion (déjà installé)
- ✅ lucide-react (déjà installé)

### Commit & Push
- ✅ Committé sur GitHub (d6aa5c9)
- ✅ Pushé sur origin/main
- ⏳ Railway en cours de redéploiement

---

## 🔧 ÉTAPES DE DÉPLOIEMENT

### 1. Attendre le déploiement Railway (3-5 minutes)
Railway détecte automatiquement le push et redéploie l'application.

**Vérifier l'état:**
- Ouvrir https://railway.app
- Aller dans votre projet PEP's Digital
- Onglet "Deployments" → Voir le statut

### 2. Réinitialiser la base de données
Une fois le déploiement terminé (statut "Success"), exécuter:

```bash
curl https://www.peps.swiss/api/nuke_db
```

**Résultat attendu:**
```json
{"status": "SUCCESS", "msg": "Base V7.1 Clean"}
```

### 3. Initialiser les données V7.1
```bash
curl https://www.peps.swiss/api/setup_v7
```

**Résultat attendu:**
```json
{"success": true, "msg": "V7.1 Setup OK"}
```

**Données créées:**
- 1 admin: `admin@peps.swiss` / `admin123`
- 3 partenaires:
  - Mario's Pizza (50 followers) - High engagement
  - Café du Centre (8 followers) - Low engagement
  - Salon Beauté (25 followers) - Medium engagement
- 10 membres avec relations followers variées
- 9 offres de test (flash, permanent, daily)

---

## 🧪 TESTS À EFFECTUER

### Test 1: Page d'accueil (Membre)
**URL:** https://www.peps.swiss

**Vérifications:**
- ✅ Affichage des offres
- ✅ Compteur de followers sur chaque carte
- ✅ Bouton cœur (follow/unfollow)
- ✅ Section "Vos Favoris" si connecté

**Actions:**
1. Cliquer sur un cœur → Demande de connexion
2. Se connecter avec un compte membre
3. Cliquer sur un cœur → Animation + compteur +1
4. Recharger la page → Cœur reste plein

### Test 2: Dashboard Partenaire
**URL:** https://www.peps.swiss/login

**Connexion:**
- Email: `partner@peps.swiss` (ou créer un compte partenaire)
- Password: `123456`

**Vérifications:**
- ✅ Compteur de followers (grand nombre animé)
- ✅ Graphique d'évolution (Recharts)
- ✅ Section "Suggestions IA" avec 3 actions
- ✅ Badge de niveau d'engagement (couleur)
- ✅ Benchmark vs catégorie

**Actions:**
1. Observer le graphique d'évolution
2. Lire les suggestions IA (générées par Perplexity)
3. Vérifier que les stats sont cohérentes

### Test 3: Dashboard Admin
**URL:** https://www.peps.swiss/login

**Connexion:**
- Email: `admin@peps.swiss`
- Password: `admin123`

**Vérifications:**
- ✅ 4 KPI en haut (Partenaires, Membres, Followers, Moyenne)
- ✅ Table des partenaires triable
- ✅ Barre de recherche fonctionnelle
- ✅ Badges de statut colorés (vert/orange/rouge)
- ✅ Filtrage en temps réel

**Actions:**
1. Rechercher "Mario" → Filtre la table
2. Observer les badges de statut
3. Vérifier que Café du Centre a un badge rouge (< 10 followers)

### Test 4: API Followers
**Endpoints à tester:**

```bash
# 1. Suivre un partenaire (nécessite token JWT)
curl -X POST https://www.peps.swiss/api/partner/follow/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Ne plus suivre
curl -X POST https://www.peps.swiss/api/partner/unfollow/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Stats partenaire
curl https://www.peps.swiss/api/partner/my-stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Évolution followers
curl https://www.peps.swiss/api/partner/followers-evolution \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Suggestions IA
curl https://www.peps.swiss/api/partner/growth-suggestions \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Stats admin globales
curl https://www.peps.swiss/api/admin/global-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 7. Vue globale partenaires
curl https://www.peps.swiss/api/admin/partners-overview \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 5: IA Perplexity
**Vérifier que les suggestions sont pertinentes:**

1. Se connecter en tant que partenaire avec peu de followers
2. Observer les suggestions IA
3. Vérifier qu'elles sont contextuelles (ex: "Créer offre flash" si < 10 followers)

---

## 🐛 DEBUGGING

### Problème: 404 sur /api/setup_v7
**Cause:** Railway n'a pas terminé le déploiement  
**Solution:** Attendre 2-3 minutes supplémentaires

### Problème: Graphiques ne s'affichent pas
**Cause:** Recharts non installé  
**Solution:** Vérifier `package.json` contient `recharts`

### Problème: Suggestions IA vides
**Cause:** Variable PERPLEXITY_API_KEY manquante  
**Solution:** Vérifier les variables d'environnement Railway

### Problème: Followers count ne change pas
**Cause:** Relation many-to-many non configurée  
**Solution:** Exécuter `/api/nuke_db` puis `/api/setup_v7`

---

## 📊 VARIABLES D'ENVIRONNEMENT RAILWAY

**Vérifier que ces 5 variables sont configurées:**

```
STRIPE_SECRET_KEY=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

STRIPE_PUBLIC_KEY=pk_live_51R6rR9GpzOqyzNB7aMcWLjUX9kb3jpthTGjMnUxtBDe8vwepoO2phcyCu5qfdmduzklE94jq73AChxncY0624XH600Ffrlqarp

STRIPE_WEBHOOK_SECRET=whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk

PERPLEXITY_API_KEY=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

FRONTEND_URL=https://www.peps.swiss
```

---

## ✅ CHECKLIST DE VALIDATION

### Backend
- [ ] `/api/setup_v7` retourne `{"success": true}`
- [ ] `/api/offers` retourne un tableau d'offres avec `is_followed`
- [ ] `/api/partner/my-stats` retourne les stats (avec token)
- [ ] `/api/admin/global-stats` retourne les KPI (avec token admin)
- [ ] Suggestions IA contiennent 3 actions pertinentes

### Frontend
- [ ] Page d'accueil affiche les offres
- [ ] Bouton cœur fonctionne (follow/unfollow)
- [ ] Compteur de followers s'incrémente
- [ ] Section "Vos Favoris" apparaît si connecté
- [ ] Dashboard partenaire affiche le graphique Recharts
- [ ] Dashboard admin affiche la table triable
- [ ] Route `/admin` protégée (redirige si pas admin)

### UX
- [ ] Animations Framer Motion fluides
- [ ] Couleurs PEP's Digital cohérentes (#3D9A9A, #E06B7D)
- [ ] Responsive mobile-first
- [ ] Pas d'erreurs console

---

## 🎯 RÉSULTAT ATTENDU

**Après tous les tests, vous devriez avoir:**

1. ✅ Un système de followers fonctionnel
2. ✅ Des suggestions IA pertinentes pour chaque partenaire
3. ✅ Un dashboard admin avec vue globale
4. ✅ Un dashboard partenaire enrichi avec graphiques
5. ✅ Une UX fluide et engageante

**Si tout fonctionne → V7.1 est un succès ! 🎉**

---

## 📞 SUPPORT

**En cas de problème:**
1. Vérifier les logs Railway
2. Vérifier les variables d'environnement
3. Exécuter `/api/nuke_db` puis `/api/setup_v7`
4. Vider le cache navigateur
5. Tester en navigation privée

**Fichiers de référence:**
- `VERIFICATION_REPORT.md` - Rapport de vérification V7
- `QUESTION_GEMINI_V7.1.md` - Spécifications complètes
- `TODO.md` - Migration future vers peps.digital
