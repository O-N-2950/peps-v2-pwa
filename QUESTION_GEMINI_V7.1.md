# 🤖 Question Complète pour Gemini - PEP's Digital V7.1

---

## 📋 CONTEXTE

J'ai déployé avec succès **PEP's Digital V7** sur Railway (https://www.peps.swiss). Le code backend et frontend fonctionne, mais j'ai besoin d'ajouter des fonctionnalités critiques pour le système de **Followers Analytics** et **IA Proactive**.

**Stack actuelle:**
- Backend: Flask + SQLAlchemy + SocketIO + Stripe + Perplexity API
- Frontend: React + Vite + Tailwind + Framer Motion + Leaflet
- Database: SQLite (via SQLAlchemy)
- Déploiement: Railway avec Nixpacks

**Code actuel:** Le fichier `models.py` contient déjà la table `followers` (relation many-to-many entre User et Partner), mais les endpoints et interfaces n'existent pas encore.

---

## 🎯 OBJECTIFS V7.1

### 1. Système Followers Analytics Complet
Chaque partenaire doit pouvoir voir combien de membres le suivent, avec statistiques en temps réel.

### 2. IA Proactive pour Croissance
L'intelligence artificielle (Perplexity) doit détecter les partenaires avec peu de followers et leur proposer des actions concrètes (offres flash, push notifications, promotions).

### 3. Dashboard Admin Global
Un dashboard administrateur avec vue complète sur tous les partenaires, classement par engagement, alertes automatiques.

### 4. Dashboard Partenaire Enrichi
Interface partenaire avec stats followers, graphiques d'évolution, suggestions IA personnalisées.

---

## 🔧 PROBLÈMES À CORRIGER

### Problème 1: FRONTEND_URL incorrect
**Fichier:** `backend/app.py` ligne 33
**Actuel:** `FRONTEND_URL = "https://www.peps.world"`
**Correction:** `FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://www.peps.swiss')`

**Raison:** Le domaine actuel est peps.swiss, pas peps.world. Les redirections Stripe utilisent cette variable.

### Problème 2: Endpoint /api/setup_v7 retourne 404
**Test effectué:** `curl https://www.peps.swiss/api/setup_v7` → 404 Not Found
**Attendu:** `{"success": true}` avec création des données de démo

**Diagnostic possible:** 
- Le backend Flask ne démarre pas correctement
- Les routes ne sont pas enregistrées
- Problème avec gunicorn + eventlet

**Besoin:** Vérifier la configuration de démarrage et s'assurer que toutes les routes sont accessibles.

---

## 📦 FONCTIONNALITÉS À AJOUTER

### A. Backend - Nouveaux Endpoints Followers

#### 1. Suivre/Ne plus suivre un partenaire
```python
@app.route('/api/partner/follow/<int:partner_id>', methods=['POST'])
@jwt_required()
def follow_partner(partner_id):
    """
    Permet à un membre de suivre un partenaire.
    Retourne: {"success": true, "followers_count": X}
    """
    pass

@app.route('/api/partner/unfollow/<int:partner_id>', methods=['POST'])
@jwt_required()
def unfollow_partner(partner_id):
    """
    Permet à un membre de ne plus suivre un partenaire.
    Retourne: {"success": true, "followers_count": X}
    """
    pass
```

#### 2. Vérifier si un membre suit un partenaire
```python
@app.route('/api/partner/<int:partner_id>/is-following')
@jwt_required()
def is_following(partner_id):
    """
    Retourne: {"following": true/false}
    """
    pass
```

#### 3. Stats du partenaire connecté
```python
@app.route('/api/partner/my-stats')
@jwt_required()  # role='partner'
def my_partner_stats():
    """
    Retourne les stats du partenaire connecté:
    {
        "followers_count": 42,
        "followers_list": [{"id": 1, "email": "user@example.com", "joined_at": "..."}],
        "offers_count": 5,
        "active_offers_count": 3,
        "total_activations": 127,
        "last_7_days_activations": 15,
        "engagement_score": 8.5  # Score sur 10
    }
    """
    pass
```

#### 4. Évolution des followers (graphique)
```python
@app.route('/api/partner/followers-evolution')
@jwt_required()  # role='partner'
def followers_evolution():
    """
    Retourne l'évolution des followers sur 30 jours:
    {
        "labels": ["2025-11-19", "2025-11-20", ...],
        "data": [10, 12, 15, 18, ...]
    }
    """
    pass
```

### B. Backend - IA Proactive avec Perplexity

#### 5. Suggestions de croissance personnalisées
```python
@app.route('/api/partner/growth-suggestions')
@jwt_required()  # role='partner'
def growth_suggestions():
    """
    Analyse le profil du partenaire et utilise Perplexity pour générer des suggestions:
    
    Règles:
    - Si < 10 followers → Suggérer "Créer une offre flash pour attirer l'attention"
    - Si pas d'offre active → Suggérer "Créer une offre permanente pour fidéliser"
    - Si pas d'activation depuis 7j → Suggérer "Lancer une promotion saisonnière"
    - Comparer avec partenaires similaires (même catégorie)
    
    Prompt Perplexity:
    "Tu es un expert marketing pour commerces locaux. Analyse ce profil:
    - Catégorie: {category}
    - Followers: {followers_count}
    - Offres actives: {active_offers}
    - Dernière activation: {last_activation_days} jours
    
    Donne 3 actions concrètes et personnalisées pour augmenter l'engagement. 
    Format: JSON avec {action, description, priority (1-3)}"
    
    Retourne:
    {
        "suggestions": [
            {
                "action": "Créer Offre Flash",
                "description": "Une pizza offerte pour les 20 premiers membres attire l'attention",
                "priority": 1,
                "icon": "⚡"
            },
            ...
        ],
        "engagement_level": "low" | "medium" | "high",
        "benchmark": {
            "category_average_followers": 25,
            "your_position": "below_average"
        }
    }
    """
    pass
```

### C. Backend - Dashboard Admin

#### 6. Vue globale des partenaires
```python
@app.route('/api/admin/partners-overview')
@jwt_required()  # role='admin'
def admin_partners_overview():
    """
    Retourne tous les partenaires avec leurs stats:
    [
        {
            "id": 1,
            "name": "Mario's Pizza",
            "category": "Restaurant",
            "followers_count": 42,
            "offers_count": 5,
            "active_offers_count": 3,
            "total_activations": 127,
            "last_activity": "2025-12-15",
            "engagement_score": 8.5,
            "status": "active" | "low_engagement" | "inactive"
        },
        ...
    ]
    
    Trié par followers_count décroissant par défaut.
    """
    pass

@app.route('/api/admin/low-engagement-partners')
@jwt_required()  # role='admin'
def low_engagement_partners():
    """
    Retourne les partenaires nécessitant une attention:
    - < 5 followers
    - OU pas d'offre active
    - OU pas d'activation depuis 30 jours
    
    Format identique à partners-overview mais filtré.
    """
    pass
```

#### 7. Stats globales admin
```python
@app.route('/api/admin/global-stats')
@jwt_required()  # role='admin'
def admin_global_stats():
    """
    {
        "total_partners": 150,
        "total_members": 3500,
        "total_followers": 8200,
        "avg_followers_per_partner": 54.6,
        "total_offers": 450,
        "total_activations": 12500,
        "engagement_rate": 0.72,  # Ratio activations / total_followers
        "top_categories": [
            {"category": "Restaurant", "count": 45},
            {"category": "Beauté", "count": 32},
            ...
        ]
    }
    """
    pass
```

### D. Frontend - PartnerDashboard.jsx Enrichi

**Fichier à créer/modifier:** `frontend/src/components/PartnerDashboard.jsx`

**Sections à ajouter:**

1. **Section "Mes Followers"** (en haut)
   - Compteur animé avec Framer Motion
   - Badge coloré selon le niveau (< 10: rouge, 10-50: orange, > 50: vert)
   - Bouton "Voir la liste" → Modal avec liste des followers

2. **Graphique d'évolution** (Chart.js ou Recharts)
   - Évolution des followers sur 7j, 30j, 90j (onglets)
   - Ligne de tendance

3. **Section "Suggestions IA"**
   - Cartes d'action avec icônes
   - Priorité visuelle (rouge = urgent, jaune = important, vert = optionnel)
   - Boutons d'action rapide: "Créer Offre Flash", "Créer Promotion", etc.

4. **Section "Benchmark"**
   - Comparaison avec la moyenne de la catégorie
   - Indicateur de position (top 10%, moyenne, en dessous)

**Design:**
- Utiliser les couleurs PEP's Digital (turquoise #3D9A9A, rose #E06B7D)
- Animations Framer Motion pour les transitions
- Responsive mobile-first

### E. Frontend - AdminDashboard.jsx (Nouveau)

**Fichier à créer:** `frontend/src/components/AdminDashboard.jsx`

**Fonctionnalités:**

1. **Stats globales** (cartes en haut)
   - Total partenaires
   - Total membres
   - Total followers
   - Taux d'engagement moyen

2. **Table des partenaires**
   - Colonnes: Nom, Catégorie, Followers, Offres actives, Dernière activité, Score, Actions
   - Tri par colonne
   - Filtres: Catégorie, Niveau d'engagement
   - Recherche par nom

3. **Alertes visuelles**
   - Badge rouge si < 5 followers
   - Badge orange si pas d'activité depuis 30j
   - Badge vert si tout va bien

4. **Actions rapides**
   - Bouton "Contacter" (ouvre modal avec email)
   - Bouton "Voir profil"
   - Bouton "Envoyer notification"

5. **Graphiques**
   - Top 10 partenaires par followers
   - Répartition par catégorie
   - Évolution globale des followers

**Route:** `/admin` (protégée, role='admin')

### F. Frontend - MemberHome.jsx Enrichi

**Modifications à apporter:**

1. **Bouton "Suivre" sur WahooCard**
   - Icône cœur (vide si pas suivi, plein si suivi)
   - Animation au clic
   - Mise à jour en temps réel du compteur

2. **Badge followers sur les cartes**
   - "X followers" affiché discrètement
   - Incitatif social ("Rejoint par 42 membres")

3. **Section "Mes partenaires suivis"** (en haut, avant les offres)
   - Carrousel horizontal des partenaires suivis
   - Accès rapide à leurs offres

---

## 🗂️ STRUCTURE DES FICHIERS À FOURNIR

Merci de me fournir les fichiers complets suivants:

### Backend
1. **backend/app.py** (version complète avec tous les nouveaux endpoints)
2. **backend/models.py** (si modifications nécessaires, sinon confirmer que l'actuel suffit)

### Frontend
3. **frontend/src/components/PartnerDashboard.jsx** (version enrichie complète)
4. **frontend/src/components/AdminDashboard.jsx** (nouveau fichier complet)
5. **frontend/src/components/MemberHome.jsx** (version enrichie avec boutons suivre)
6. **frontend/src/components/WahooCard.jsx** (version enrichie avec bouton suivre)

### Configuration
7. **frontend/src/App.jsx** (si modifications nécessaires pour la route /admin)

---

## 🎨 DESIGN & UX

**Couleurs PEP's Digital:**
- Turquoise: `#3D9A9A`
- Rose: `#E06B7D`
- Gris foncé: `#1F2937`
- Blanc cassé: `#F9FAFB`

**Animations:**
- Framer Motion pour les transitions
- Compteurs animés (CountUp.js ou custom)
- Skeleton loaders pendant chargement

**Responsive:**
- Mobile-first
- Breakpoints Tailwind (sm, md, lg, xl)

---

## 🔐 SÉCURITÉ

1. **Tous les endpoints sensibles** doivent utiliser `@jwt_required()`
2. **Vérification du rôle** pour les endpoints admin: `if get_jwt_identity()['role'] != 'admin': return 401`
3. **Validation des données** côté backend (ne jamais faire confiance au frontend)
4. **Rate limiting** sur les endpoints IA (max 10 requêtes/minute par partenaire)

---

## 📊 DONNÉES DE DÉMO

Pour tester, merci d'enrichir `/api/setup_v7` avec:
- 1 admin: `admin@peps.swiss` / `admin123` (role='admin')
- 3 partenaires avec différents niveaux de followers:
  - Mario's Pizza: 50 followers (high engagement)
  - Café du Centre: 8 followers (low engagement)
  - Salon Beauté: 25 followers (medium engagement)
- 10 membres qui suivent ces partenaires de manière variée

---

## ✅ CHECKLIST DE VALIDATION

Avant de me fournir les fichiers, merci de vérifier:

- [ ] Tous les endpoints retournent du JSON valide
- [ ] Les erreurs sont gérées (try/except avec messages clairs)
- [ ] Les relations SQLAlchemy sont correctes (followers many-to-many)
- [ ] L'IA Perplexity est appelée avec le bon format
- [ ] Les composants React utilisent hooks (useState, useEffect)
- [ ] Les appels API utilisent fetch avec gestion d'erreurs
- [ ] Le design est cohérent avec les couleurs PEP's Digital
- [ ] Les animations sont fluides (Framer Motion)
- [ ] Le code est commenté aux endroits critiques
- [ ] Les fichiers sont complets (pas de `// ... reste du code`)

---

## 🚀 DÉPLOIEMENT

Une fois les fichiers fournis:
1. Je les copierai dans le projet
2. Je commiterai sur GitHub
3. Railway redéploiera automatiquement
4. Je testerai toutes les fonctionnalités
5. Je fournirai un rapport de validation

---

## 📞 QUESTIONS COMPLÉMENTAIRES

Si certains points ne sont pas clairs, merci de:
1. Implémenter selon les meilleures pratiques Flask/React
2. Ajouter des commentaires pour expliquer les choix techniques
3. Proposer des améliorations si tu vois des opportunités

---

**Merci pour ton aide précieuse ! 🙏**

Cette version V7.1 va transformer PEP's Digital en une plateforme vraiment intelligente et engageante pour les commerçants locaux.
