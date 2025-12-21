# 🌐 Migration vers www.peps.digital

**Date:** 19 décembre 2025  
**Statut:** ✅ DNS configuré - En attente de propagation

---

## ✅ CONFIGURATION TERMINÉE

### DNS Swisscenter
- ✅ CNAME: `www.peps.digital` → `mtpum53m.up.railway.app` (TTL: 4h)
- ✅ Redirection HTTP 302: `peps.digital` → `https://www.peps.digital`

### Railway
- ✅ Plan Hobby activé ($5/mois)
- ✅ Domaine `peps.digital` ajouté au service peps-v2-pwa
- ✅ CNAME Railway: `mtpum53m.up.railway.app`

### Code
- ✅ manifest.json: `start_url: "/"` (relatif, s'adapte automatiquement)
- ✅ app.py: `FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://www.peps.swiss')`

---

## ⏳ EN ATTENTE

### 1. Propagation DNS (1-48h)
**Test de propagation:**
```bash
# Vérifier que www.peps.digital pointe vers Railway
nslookup www.peps.digital

# Test depuis différents DNS
dig www.peps.digital @8.8.8.8
dig www.peps.digital @1.1.1.1
```

**Résultat attendu:**
```
www.peps.digital → mtpum53m.up.railway.app → IP Railway
```

### 2. Certificat SSL Railway
Railway génère automatiquement un certificat SSL Let's Encrypt une fois le DNS propagé.

**Vérification:**
- Aller sur Railway → Settings → Domains
- Voir le statut de `peps.digital`
- Attendre que le cadenas vert apparaisse

---

## 🔧 ACTIONS À FAIRE APRÈS PROPAGATION

### 1. Mettre à jour la variable d'environnement Railway

**Variables à modifier:**
```
FRONTEND_URL=https://www.peps.digital
```

**Comment faire:**
1. Railway → Settings → Variables
2. Modifier `FRONTEND_URL`
3. Sauvegarder (redéploiement automatique)

### 2. Mettre à jour le webhook Stripe

**Ancienne URL:**
```
https://www.peps.swiss/api/stripe-webhook
```

**Nouvelle URL:**
```
https://www.peps.digital/api/stripe-webhook
```

**Comment faire:**
1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer sur le webhook existant
3. Modifier l'URL
4. Sauvegarder
5. Tester avec "Send test webhook"

**⚠️ Important:** Le secret webhook reste le même (`whsec_RHUaIf949F3AWjDTpBZG6BKwdPz8OxDk`)

### 3. Tester l'application

**Tests à effectuer:**
```bash
# 1. Vérifier que le site est accessible
curl -I https://www.peps.digital

# 2. Tester la redirection du domaine racine
curl -I https://peps.digital
# Doit retourner: Location: https://www.peps.digital

# 3. Initialiser la base de données
curl https://www.peps.digital/api/nuke_db
curl https://www.peps.digital/api/setup_v7

# 4. Tester l'API
curl https://www.peps.digital/api/offers
```

**Tests navigateur:**
- ✅ Ouvrir https://www.peps.digital
- ✅ Vérifier le certificat SSL (cadenas vert)
- ✅ Se connecter avec admin@peps.swiss / admin123
- ✅ Tester le dashboard admin
- ✅ Tester le système de followers
- ✅ Vérifier les suggestions IA

### 4. Mettre à jour les liens externes

**Où mettre à jour:**
- ✅ Réseaux sociaux (si applicable)
- ✅ Google Search Console (ajouter nouvelle propriété)
- ✅ Analytics (si configuré)
- ✅ Documentation client
- ✅ Emails de communication

---

## 🔄 Redirection 301 (SEO)

**Statut actuel:** Redirection 302 (temporaire)  
**Recommandation:** Passer en 301 (permanente) après validation

**Comment faire (2 options):**

### Option A: Via Swisscenter (si supporté)
1. Aller dans l'interface Swisscenter
2. Modifier la redirection HTTP
3. Changer de 302 à 301

### Option B: Via .htaccess
Si Swisscenter ne supporte pas la 301 directe, créer un fichier `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^peps\.digital$ [NC]
RewriteRule ^(.*)$ https://www.peps.digital/$1 [R=301,L]
```

---

## 📊 Monitoring post-migration

### Vérifications quotidiennes (première semaine)

**Jour 1-2:**
- [ ] DNS propagé mondialement
- [ ] SSL actif sur www.peps.digital
- [ ] Redirection peps.digital → www.peps.digital fonctionne
- [ ] Application accessible et fonctionnelle

**Jour 3-7:**
- [ ] Aucune erreur dans les logs Railway
- [ ] Webhook Stripe fonctionne correctement
- [ ] Pas de baisse de trafic
- [ ] Tous les endpoints API répondent

### Outils de monitoring

**DNS:**
```bash
# Vérifier la propagation mondiale
https://dnschecker.org/#A/www.peps.digital
```

**SSL:**
```bash
# Vérifier le certificat
https://www.ssllabs.com/ssltest/analyze.html?d=www.peps.digital
```

**Uptime:**
- Railway Dashboard → Metrics
- Configurer des alertes si disponible

---

## 🐛 Troubleshooting

### Problème: DNS ne se propage pas
**Cause:** TTL trop élevé ou erreur de configuration  
**Solution:**
1. Vérifier la configuration sur Swisscenter
2. Attendre le TTL complet (4h)
3. Tester avec `dig` depuis différents DNS

### Problème: SSL non généré par Railway
**Cause:** DNS pas encore propagé ou erreur de validation  
**Solution:**
1. Attendre 24h supplémentaires
2. Vérifier que le CNAME pointe bien vers Railway
3. Contacter le support Railway si nécessaire

### Problème: Redirection ne fonctionne pas
**Cause:** Configuration Swisscenter incorrecte  
**Solution:**
1. Vérifier la redirection HTTP dans Swisscenter
2. Tester avec `curl -I https://peps.digital`
3. Reconfigurer si nécessaire

### Problème: Webhook Stripe échoue
**Cause:** URL pas mise à jour ou certificat SSL invalide  
**Solution:**
1. Vérifier l'URL du webhook sur Stripe
2. Tester avec "Send test webhook"
3. Vérifier les logs Railway pour voir les erreurs

---

## 📝 Checklist complète

### Configuration DNS (✅ Fait)
- [x] CNAME www créé sur Swisscenter
- [x] Redirection HTTP configurée
- [x] Domaine ajouté sur Railway

### En attente de propagation
- [ ] DNS propagé (test: `nslookup www.peps.digital`)
- [ ] SSL actif sur Railway (cadenas vert)
- [ ] Site accessible sur https://www.peps.digital

### Post-propagation
- [ ] Variable `FRONTEND_URL` mise à jour sur Railway
- [ ] Webhook Stripe mis à jour
- [ ] Base de données initialisée (`/api/setup_v7`)
- [ ] Tests complets effectués
- [ ] Redirection 301 configurée (SEO)

### Nettoyage
- [ ] Documenter la migration
- [ ] Archiver www.peps.swiss (garder actif quelques mois)
- [ ] Mettre à jour tous les liens externes

---

## 🎯 Timeline estimée

**Jour 0 (aujourd'hui):**
- ✅ Configuration DNS terminée
- ⏳ Attente propagation

**Jour 1-2:**
- ⏳ DNS propagé
- ⏳ SSL actif
- 🔧 Mise à jour variables Railway
- 🔧 Mise à jour webhook Stripe
- ✅ Tests complets

**Jour 3-7:**
- 📊 Monitoring intensif
- 🐛 Correction bugs éventuels
- ✅ Validation stabilité

**Semaine 2:**
- 🔄 Passage en redirection 301
- 📢 Communication officielle
- ✅ Migration complète

---

## 📞 Support

**En cas de problème:**
1. Vérifier cette documentation
2. Consulter les logs Railway
3. Tester avec les commandes de debugging
4. Contacter le support Railway si nécessaire

**Fichiers de référence:**
- `TODO.md` - Tâches générales
- `DEPLOIEMENT_V7.1.md` - Guide de déploiement
- `VERIFICATION_REPORT.md` - Rapport de vérification

---

**🎉 Une fois la propagation terminée, PEP's Digital sera officiellement sur www.peps.digital !**
