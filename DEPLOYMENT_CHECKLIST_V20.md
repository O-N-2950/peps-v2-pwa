# 🚀 V20 GLOBAL SCALE - Checklist de Déploiement

## 📋 PRÉ-REQUIS RAILWAY

### 1. Service Redis
- [ ] Créer service Redis dans Railway : `+ New > Database > Redis`
- [ ] Récupérer Private URL (onglet Connect)
- [ ] Ajouter variable `REDIS_URL` dans service Backend

### 2. Variables d'Environnement Backend
- [ ] `DATABASE_URL` (PostgreSQL - auto)
- [ ] `REDIS_URL` (Redis Private URL)
- [ ] `STRIPE_SECRET_KEY` (sk_live_... ou sk_test_...)
- [ ] `STRIPE_WEBHOOK_SECRET` (whsec_... depuis Stripe Dashboard)

### 3. Configuration Stripe Webhook
- [ ] Aller dans Stripe Dashboard > Developers > Webhooks
- [ ] Ajouter endpoint : `https://www.peps.swiss/api/webhooks/stripe`
- [ ] Événements à écouter :
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.deleted`
- [ ] Copier Signing Secret (whsec_...) dans Railway

---

## 🔧 DÉPLOIEMENT

### Étape 1 : Push Code
```bash
cd /home/ubuntu/peps-v2-pwa
git add -A
git commit -m "V20 GLOBAL SCALE - Final"
git push origin main
```

### Étape 2 : Attendre Build Railway (3-5 min)
- Frontend : Installation react-leaflet-cluster
- Backend : Installation flask-caching, redis

### Étape 3 : Reset & Setup DB
1. Reset : https://www.peps.swiss/api/nuke_db
2. Setup : https://www.peps.swiss/api/setup_v20
3. Vérifier : 29 packs créés + Admin créé

---

## 🧪 TESTS DE VALIDATION

### Test 1 : Multi-Devises
- [ ] Ouvrir https://www.peps.swiss
- [ ] Vérifier switcher CHF/EUR en haut à droite
- [ ] Vérifier affichage des 29 packs (B2C, PME, CORP)

### Test 2 : Carte Interactive
- [ ] Cliquer sur "EXPLORER"
- [ ] Vérifier clustering des marqueurs
- [ ] Vérifier popup avec nom + ville

### Test 3 : Admin Dashboard
- [ ] Login admin@peps.swiss / admin123
- [ ] Vérifier MRR CHF et MRR EUR séparés

### Test 4 : Cache Redis
- [ ] Ouvrir Network DevTools
- [ ] Appeler /api/packs?currency=CHF (2x)
- [ ] Vérifier temps de réponse < 50ms (cache hit)

---

## 📊 TESTS DE CHARGE (Optionnel)

### Installation Locust
```bash
pip install locust
```

### Lancement
```bash
cd /home/ubuntu/peps-v2-pwa
locust -f locustfile.py
```

### Interface
1. Ouvrir http://localhost:8089
2. Configurer :
   - Host : https://www.peps.swiss
   - Users : 500
   - Spawn rate : 10
3. Objectif : Temps de réponse moyen < 200ms

---

## 🎯 MIGRATION FIREBASE (67 Partenaires)

### Préparer le fichier JSON
1. Exporter Firebase Firestore en JSON
2. Renommer en `partners_data.json`
3. Placer dans `/home/ubuntu/peps-v2-pwa/backend/`

### Lancer la migration
```bash
cd /home/ubuntu/peps-v2-pwa/backend
python3 migrate_v20.py
```

### Vérifier
- [ ] Nombre de partenaires ajoutés
- [ ] Secteurs d'activité créés dynamiquement
- [ ] Coordonnées GPS mappées correctement

---

## ✅ VALIDATION FINALE

- [ ] 29 packs créés en DB
- [ ] Redis connecté (cache fonctionnel)
- [ ] Stripe webhook configuré
- [ ] Multi-devises CHF/EUR opérationnel
- [ ] Carte interactive avec clustering
- [ ] Admin dashboard avec MRR séparés
- [ ] Migration Firebase complétée (si applicable)

---

## 🚨 ROLLBACK (Si Problème)

```bash
cd /home/ubuntu/peps-v2-pwa
git revert HEAD
git push origin main
```

Puis attendre redéploiement Railway (3-5 min).

---

**Date de déploiement :** 20 janvier 2026  
**Version :** V20 GLOBAL SCALE  
**Objectif :** 10 000 membres d'ici fin 2026
