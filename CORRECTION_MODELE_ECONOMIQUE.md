# 🚨 CORRECTION URGENTE : Modèle Économique PEP's

## ❌ PROBLÈME : Gemini a changé le modèle économique

Le code actuel implémente un système de **"crédits B2B"** qui n'existe PAS dans le cahier des charges original.

---

## 📊 COMPARAISON

### ❌ Ce que Gemini a codé (FAUX)

**Table `pack` actuelle :**
```sql
id | name       | credits | price
---|------------|---------|-------
1  | Starter    | 50      | 99.0
2  | Pro        | 200     | 299.0
3  | Enterprise | 1000    | 999.0
```

**Problèmes :**
- ❌ Seulement 3 packs (au lieu de 27)
- ❌ "credits" au lieu de "accès"
- ❌ Prix inventés (99, 299, 999 CHF)
- ❌ Pas de gestion des employés/membres
- ❌ Pas de système de confettis
- ❌ Pas d'offres permanentes

---

### ✅ VRAI MODÈLE (Cahier des charges)

## 1️⃣ PACKS = ACCÈS ANNUELS (27 paliers)

**Table `pack` correcte :**
```sql
id | name        | access_count | price_annual_chf | price_annual_eur
---|-------------|--------------|------------------|------------------
1  | 1 Accès     | 1            | 49.00            | 49.00
2  | 2 Accès     | 2            | 89.00            | 89.00
3  | 3 Accès     | 3            | 129.00           | 129.00
4  | 4 Accès     | 4            | 164.00           | 164.00
5  | 5 Accès     | 5            | 199.00           | 199.00
6  | 6 Accès     | 6            | 245.00           | 245.00
7  | 7 Accès     | 7            | 289.00           | 289.00
8  | 8 Accès     | 8            | 330.00           | 330.00
9  | 9 Accès     | 9            | 360.00           | 360.00
10 | 10 Accès    | 10           | 390.00           | 390.00
11 | 15 Accès    | 15           | 550.00           | 550.00
12 | 20 Accès    | 20           | 700.00           | 700.00
13 | 25 Accès    | 25           | 850.00           | 850.00
14 | 30 Accès    | 30           | 1000.00          | 1000.00
15 | 40 Accès    | 40           | 1274.00          | 1274.00
16 | 50 Accès    | 50           | 1590.00          | 1590.00
17 | 75 Accès    | 75           | 2390.00          | 2390.00
18 | 100 Accès   | 100          | 3185.00          | 3185.00
19 | 150 Accès   | 150          | 4410.00          | 4410.00
20 | 200 Accès   | 200          | 5880.00          | 5880.00
21 | 300 Accès   | 300          | 8820.00          | 8820.00
22 | 400 Accès   | 400          | 11760.00         | 11760.00
23 | 500 Accès   | 500          | 14700.00         | 14700.00
24 | 750 Accès   | 750          | 22050.00         | 22050.00
25 | 1000 Accès  | 1000         | 29400.00         | 29400.00
26 | 2500 Accès  | 2500         | 61250.00         | 61250.00
27 | 5000 Accès  | 5000         | 110250.00        | 110250.00
```

---

## 2️⃣ SYSTÈME D'ACCÈS (pas de crédits !)

### Entreprise achète un pack

**Exemple : Pack 50 Accès (1'590 CHF/an)**

```
Company "TechCorp SA"
├── pack_id: 16 (50 Accès)
├── access_total: 50
├── access_used: 12
├── access_available: 38
└── Employés avec accès actif:
    ├── employee1@techcorp.ch (accès actif jusqu'au 31/12/2025)
    ├── employee2@techcorp.ch (accès actif jusqu'au 31/12/2025)
    └── ... (10 autres)
```

### Dashboard Entreprise DOIT permettre :

1. **Voir le pack actuel**
   - Nombre d'accès total : 50
   - Accès utilisés : 12
   - Accès disponibles : 38

2. **Gérer les employés**
   - ✅ Ajouter un employé (email) → Consomme 1 accès
   - ✅ Retirer un employé → Libère 1 accès
   - ✅ Voir la liste des employés actifs
   - ✅ Voir la date d'expiration de l'abonnement

3. **Renouveler/Upgrader**
   - ✅ Renouveler le pack actuel (paiement Stripe)
   - ✅ Upgrader vers un pack supérieur (ex: 50 → 100 accès)

---

## 3️⃣ RÔLES UTILISATEURS

### Table `user` correcte :

```sql
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(200),
    role VARCHAR(50),  -- partner, company_admin, employee, member, family_admin, family_member
    company_id INTEGER REFERENCES company(id),
    family_id INTEGER REFERENCES family(id),
    access_active BOOLEAN DEFAULT FALSE,
    access_expires_at TIMESTAMP
);
```

### Rôles :

| Rôle | Description | Accès |
|------|-------------|-------|
| `partner` | Commerçant | Dashboard création offres permanentes |
| `company_admin` | Admin entreprise | Dashboard gestion employés + paiement |
| `employee` | Employé d'entreprise | Accès membre actif (offres permanentes) |
| `family_admin` | Chef de famille | Dashboard gestion membres famille + paiement |
| `family_member` | Membre de famille | Accès membre actif (offres permanentes) |
| `member` | Membre individuel | Accès membre actif (paiement personnel) |

---

## 4️⃣ OFFRES PERMANENTES (pas de flash deals !)

### Table `offer` correcte :

```sql
CREATE TABLE offer (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partner(id),
    title VARCHAR(200),  -- Ex: "10% sur tous les repas"
    description TEXT,
    discount_type VARCHAR(50),  -- percentage, fixed_amount, free_item
    discount_value VARCHAR(50),  -- "10%", "5 CHF", "Café offert"
    is_permanent BOOLEAN DEFAULT TRUE,  -- Toujours TRUE !
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),  -- Restaurant, Mode, Beauté, Sport, etc.
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Différence clé :**
- ❌ Pas de "stock" (offres permanentes = illimitées)
- ❌ Pas de "old_price" (c'est un rabais permanent, pas une promo)
- ✅ Offre valable tous les jours, toute l'année
- ✅ Le membre peut en profiter autant qu'il veut

---

## 5️⃣ SYSTÈME DE VALIDATION (Confettis)

### Quand un membre clique sur "Profiter de l'offre" :

**Frontend (React) :**
```jsx
<button onClick={handleUseOffer}>
  🎉 Profiter de l'offre exclusive
</button>

// Au clic :
1. Vérifier que l'utilisateur a un accès actif (access_active = true)
2. Afficher écran plein écran avec :
   - ✨ Animation de confettis (Framer Motion)
   - 🕐 Date et heure EN TEMPS RÉEL (mise à jour chaque seconde)
   - ✅ Nom du membre
   - 🏪 Nom du commerçant
   - 💳 Détails de l'offre
3. Empêcher les screenshots :
   - Date/heure qui défile en temps réel
   - Animation continue
   - Expiration après 30 secondes
```

**Backend (Flask) :**
```python
@app.route('/api/offers/<int:offer_id>/validate', methods=['POST'])
@jwt_required()
def validate_offer(offer_id):
    user = User.query.get(get_jwt_identity()['id'])
    
    # Vérifier que l'utilisateur a un accès actif
    if not user.access_active:
        return jsonify(error="Accès expiré"), 403
    
    if user.access_expires_at < datetime.now():
        return jsonify(error="Accès expiré"), 403
    
    # Logger l'utilisation (analytics)
    usage = OfferUsage(user_id=user.id, offer_id=offer_id)
    db.session.add(usage)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "user_name": user.email,
        "timestamp": datetime.now().isoformat()
    })
```

---

## 6️⃣ GESTION DES EMPLOYÉS (Company Dashboard)

### API nécessaires :

```python
# Ajouter un employé
@app.route('/api/company/add-employee', methods=['POST'])
@jwt_required()
def add_employee():
    company_admin = User.query.get(get_jwt_identity()['id'])
    company = Company.query.get(company_admin.company_id)
    
    # Vérifier qu'il reste des accès disponibles
    if company.access_used >= company.access_total:
        return jsonify(error="Plus d'accès disponibles"), 400
    
    employee_email = request.json['email']
    
    # Créer le compte employé
    employee = User(
        email=employee_email,
        password_hash=generate_password_hash(random_password()),
        role='employee',
        company_id=company.id,
        access_active=True,
        access_expires_at=company.subscription_expires_at
    )
    db.session.add(employee)
    company.access_used += 1
    db.session.commit()
    
    # Envoyer email d'invitation
    send_invitation_email(employee_email, random_password)
    
    return jsonify(success=True)

# Retirer un employé
@app.route('/api/company/remove-employee/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def remove_employee(employee_id):
    employee = User.query.get(employee_id)
    employee.access_active = False
    
    company = Company.query.get(employee.company_id)
    company.access_used -= 1
    db.session.commit()
    
    return jsonify(success=True)
```

---

## 🎯 ACTIONS CORRECTIVES NÉCESSAIRES

### 1. Modifier la table `pack`
- ❌ Supprimer `credits`
- ✅ Ajouter `access_count`
- ✅ Ajouter `price_annual_chf` et `price_annual_eur`
- ✅ Créer les 27 packs

### 2. Modifier la table `company`
- ❌ Supprimer `credits_balance`
- ✅ Ajouter `pack_id` (référence au pack acheté)
- ✅ Ajouter `access_total` (nombre d'accès du pack)
- ✅ Ajouter `access_used` (nombre d'accès attribués)
- ✅ Ajouter `subscription_expires_at` (date d'expiration annuelle)

### 3. Créer la table `family`
```sql
CREATE TABLE family (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    pack_id INTEGER REFERENCES pack(id),
    access_total INTEGER,
    access_used INTEGER,
    subscription_expires_at TIMESTAMP
);
```

### 4. Modifier la table `user`
- ✅ Ajouter `family_id`
- ✅ Ajouter `access_active`
- ✅ Ajouter `access_expires_at`
- ✅ Ajouter rôles : `employee`, `family_admin`, `family_member`

### 5. Modifier la table `offer`
- ❌ Supprimer `stock`, `old_price`, `is_urgent`
- ✅ Ajouter `is_permanent` (toujours TRUE)
- ✅ Ajouter `discount_type` et `discount_value`

### 6. Créer la table `offer_usage` (analytics)
```sql
CREATE TABLE offer_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    offer_id INTEGER REFERENCES offer(id),
    used_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Implémenter les fonctionnalités manquantes
- ✅ Dashboard Company : Gestion employés
- ✅ Dashboard Family : Gestion membres famille
- ✅ Système de confettis avec date/heure live
- ✅ Intégration Stripe pour paiements annuels
- ✅ Emails d'invitation pour employés/membres famille

---

## 📝 QUESTION POUR GEMINI

**Préparer une mega-question structurée pour corriger tout le modèle économique en une seule fois.**

---

**Date :** 18 Décembre 2025  
**Statut :** 🚨 CORRECTION URGENTE NÉCESSAIRE
