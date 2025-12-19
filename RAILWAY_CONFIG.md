# 🚂 Configuration Railway - PEP's Digital V7

## 📋 Variables d'environnement à configurer

Connectez-vous à votre projet Railway et ajoutez ces 4 variables dans l'onglet **Variables** :

### 1. STRIPE_SECRET_KEY
```
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
```

### 2. STRIPE_PUBLIC_KEY
```
pk_live_51R6rR9GpzOqyzNB7aMcWLjUX9kb3jpthTGjMnUxtBDe8vwepoO2phcyCu5qfdmduzklE94jq73AChxncY0624XH600Ffrlqarp
```

### 3. STRIPE_WEBHOOK_SECRET
```
whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk
```

### 4. PERPLEXITY_API_KEY
```
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
```

### 5. FRONTEND_URL (optionnel, défaut: www.peps.swiss)
```
https://www.peps.swiss
```

---

## 🔄 Déploiement

Une fois les variables configurées, Railway va automatiquement redéployer l'application.

**Temps estimé:** 3-5 minutes

---

## ✅ Tests post-déploiement

### 1. Réinitialiser la base de données
```bash
curl https://www.peps.swiss/api/nuke_db
```

### 2. Initialiser les données V7
```bash
curl https://www.peps.swiss/api/setup_v7
```

### 3. Vérifier l'API
```bash
curl https://www.peps.swiss/api/offers
```

### 4. Tests manuels
- [ ] Ouvrir https://www.peps.swiss
- [ ] Accepter la géolocalisation GPS
- [ ] Vérifier le tri par distance
- [ ] Tester les filtres (Flash, Club, Du Jour, etc.)
- [ ] Ouvrir la carte interactive (/map)
- [ ] Tester une réservation
- [ ] Vérifier le paiement Stripe (mode test)

---

## 🐛 Debugging

### Logs Railway
```bash
railway logs
```

### Vérifier les variables d'environnement
```bash
railway variables
```

### Webhook Stripe
- URL configurée: `https://www.peps.swiss/api/stripe-webhook`
- Secret: `whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk`
- Tester: https://dashboard.stripe.com/webhooks

---

## 📱 Installation PWA

Sur mobile (iOS/Android):
1. Ouvrir https://www.peps.swiss dans Safari/Chrome
2. Menu → "Ajouter à l'écran d'accueil"
3. L'icône PEP's Digital apparaît sur l'écran d'accueil

---

## 🔐 Sécurité

⚠️ **IMPORTANT:** Les clés Stripe sont en mode **LIVE**. Ne jamais les exposer dans le code ou les logs.

✅ Toutes les clés sont stockées dans les variables d'environnement Railway (sécurisées).

---

## 🎯 Prochaines étapes

Voir `TODO.md` pour la migration vers `peps.digital` quand le domaine sera actif.
