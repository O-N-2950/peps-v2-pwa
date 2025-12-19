# 🎯 QUESTION POUR GEMINI : Compléter la V3 de PEP's

Bonjour Gemini ! 👋

Merci pour ton travail sur la V3 ! Nous avons déployé le code et testé les routes.

Voici notre feedback et les éléments manquants à ajouter.

---

## ✅ CE QUI FONCTIONNE (V3 Actuelle)

**Routes testées :**
- ✅ `/api/nuke_db` → SUCCESS ✅ (Base de données nettoyée)
- ❌ `/api/setup_v3` → ERREUR 500 ❌ (Erreur serveur)

**Schéma de données :**
- ✅ Table `Pack` créée (avec `access_count`, `price_chf`, `price_eur`)
- ✅ Table `Company` créée (avec `access_total`, `access_used`)
- ✅ Table `User` créée (avec `referral_code`, `referred_by`, `bonus_months_earned`)
- ✅ Table `Referral` créée
- ✅ Table `Partner` créée (avec `follower_count`)
- ✅ Table `Offer` créée (avec `is_permanent` et `is_flash`)
- ✅ Table `PartnerFeedback` créée

**Frontend :**
- ✅ `ValidationScreen.jsx` créé (confettis + horloge anti-fraude)
- ✅ `canvas-confetti` installé

---

## ❌ PROBLÈMES À CORRIGER

### 🐛 BUG 1 : Erreur 500 sur `/api/setup_v3`

**Erreur :**
```
Internal Server Error
The server encountered an internal error and was unable to complete your request.
```

**Code actuel (app.py ligne 49-91) :**
```python
@app.route('/api/setup_v3')
def setup_v3():
    db.create_all()
    logs = []
    
    # 1. Injection des Packs (Option C - SQL)
    if not Pack.query.first():
        packs_data = [
            ("Individuel", 1, 49), ("Famille", 5, 199), ("PME 10", 10, 390), 
            ("PME 50", 50, 1590), ("Corporate 100", 100, 3185), ("Corp 1000", 1000, 29400)
        ]
        for name, acc, price in packs_data:
            db.session.add(Pack(name=name, access_count=acc, price_chf=price, price_eur=price))
        logs.append("✅ Packs tarifaires créés")

    # 2. Utilisateurs Démo
    demos = [('admin@peps.swiss', 'super_admin'), ('partner@peps.swiss', 'partner'), ('member@peps.swiss', 'member')]
    for email, role in demos:
        if not User.query.filter_by(email=email).first():
            u = User(email=email, password_hash=generate_password_hash('123456'), role=role)
            u.referral_code = f"PEPS-{role.upper()}-DEMO"
            db.session.add(u)
            db.session.commit()
            
            # Partenaire Mario (Avec Offre Permanente ET Flash)
            if role == 'partner':
                p = Partner(user_id=u.id, name="Chez Mario", category="Restaurant", distance="300m", image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500")
                db.session.add(p)
                db.session.commit()
                
                # Offre Permanente (Socle)
                perm = Offer(partner_id=p.id, title="-20% sur la carte", description="Valable midi et soir", is_permanent=True, discount_val="-20%")
                
                # Offre Flash (Opportunité)
                flash = Offer(partner_id=p.id, title="2 Tables Dispo Ce Soir", description="Remplissage", is_flash=True, stock=2, price="Carte", discount_val="-50%")
                
                db.session.add_all([perm, flash])
                logs.append("✅ Partenaire Mario créé (Permanent + Flash)")

    db.session.commit()
    return jsonify({"status": "SUCCESS", "logs": logs})
```

**Question :**
- Pourquoi cette erreur 500 ?
- Peux-tu corriger le code et me donner la version corrigée ?

---

## 🚨 FONCTIONNALITÉS MANQUANTES (Priorité Haute)

### 1️⃣ ROUTES D'INSCRIPTION (3 types)

**Problème actuel :**
- ❌ Pas de route `/api/register`
- ❌ Impossible pour un utilisateur de s'inscrire
- ❌ Seulement des comptes DÉMO créés manuellement

**Ce que nous voulons :**

#### A) Inscription Commerçant Partenaire (GRATUIT)

**Route :** `POST /api/register/partner`

**Paramètres :**
```json
{
  "email": "mario@restaurant.com",
  "password": "motdepasse123",
  "partner_name": "Chez Mario",
  "category": "Restaurant",
  "address": "Rue de Nidau 12, 2500 Bienne",
  "referral_code": "PEPS-JEAN-ABC123" // Optionnel (si parrainé par un membre)
}
```

**Logique :**
1. Créer un `User` avec `role='partner'`
2. Créer un `Partner` lié à ce `User`
3. Générer un `referral_code` unique pour ce partenaire
4. Si `referral_code` fourni → Ajouter +1 mois au parrain
5. Retourner un JWT token

#### B) Inscription Membre (PAYANT selon pack)

**Route :** `POST /api/register/member`

**Paramètres :**
```json
{
  "email": "jean@gmail.com",
  "password": "motdepasse123",
  "pack_id": 1, // ID du pack choisi (ex: Individuel = 1, Famille = 2)
  "referral_code": "PEPS-SOPHIE-XYZ789", // Optionnel (si parrainé)
  "payment_intent_id": "pi_abc123" // ID Stripe après paiement
}
```

**Logique :**
1. Vérifier que le paiement Stripe est valide
2. Créer un `User` avec `role='member'`
3. Calculer `access_expires_at` :
   - Si `referral_code` fourni → 13 mois (au lieu de 12)
   - Sinon → 12 mois
4. Générer un `referral_code` unique pour ce membre
5. Si `referral_code` fourni → Ajouter +1 mois au parrain
6. Retourner un JWT token

#### C) Inscription Hybride (Commerçant + Membre)

**Route :** `POST /api/register/hybrid`

**Paramètres :**
```json
{
  "email": "mario@restaurant.com",
  "password": "motdepasse123",
  "partner_name": "Chez Mario",
  "category": "Restaurant",
  "address": "Rue de Nidau 12, 2500 Bienne",
  "pack_id": 1, // Pack membre choisi
  "payment_intent_id": "pi_abc123" // Paiement Stripe
}
```

**Logique :**
1. Créer un `User` avec `role='partner'` (mais avec `access_expires_at` car il est aussi membre)
2. Créer un `Partner` lié à ce `User`
3. Calculer `access_expires_at` selon le pack
4. Générer un `referral_code` unique
5. Retourner un JWT token

**Question :**
- Peux-tu créer ces 3 routes avec le code complet ?
- Peux-tu ajouter la validation des emails (format, unicité) ?

---

### 2️⃣ SÉCURISATION ANTI-PARTAGE (Device Fingerprinting)

**Problème actuel :**
- ❌ Un membre peut partager son login/password avec 10 amis
- ❌ Pas de limitation d'appareils
- ❌ Pas de détection de connexions simultanées

**Ce que nous voulons :**

#### A) Table `device_session`

**Schéma SQL :**
```sql
CREATE TABLE device_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    device_fingerprint VARCHAR(255) UNIQUE, -- Hash de l'appareil
    device_name VARCHAR(100), -- Ex: "iPhone 13 Pro"
    device_os VARCHAR(50), -- Ex: "iOS 17.2"
    last_active TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### B) Logique de limitation

**Règle :**
- **Pack Individuel (1 accès)** → Maximum 1 appareil actif
- **Pack Famille (5 accès)** → Maximum 5 appareils actifs
- **Pack PME 10 (10 accès)** → Maximum 10 appareils actifs
- Etc.

**Fonctionnement :**
1. À chaque login, générer un `device_fingerprint` (hash de User-Agent + IP + Browser)
2. Vérifier si cet appareil existe déjà dans `device_sessions`
3. Si OUI → Mettre à jour `last_active`
4. Si NON → Vérifier le nombre d'appareils actifs :
   - Si `count(device_sessions WHERE user_id=X AND is_active=True) < pack.access_count` → Autoriser
   - Sinon → **REFUSER** avec message "Nombre maximum d'appareils atteint"

#### C) Route pour gérer les appareils

**Route :** `GET /api/user/devices`

**Retour :**
```json
{
  "devices": [
    {
      "id": 1,
      "device_name": "iPhone 13 Pro",
      "device_os": "iOS 17.2",
      "last_active": "2025-12-18T14:30:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "device_name": "MacBook Pro",
      "device_os": "macOS 14.2",
      "last_active": "2025-12-17T10:15:00Z",
      "is_active": true
    }
  ],
  "max_devices": 1,
  "current_devices": 2,
  "warning": "Vous avez dépassé le nombre d'appareils autorisés"
}
```

**Route :** `DELETE /api/user/devices/:id`

**Logique :**
- Permet au membre de supprimer un appareil (ex: ancien téléphone)
- Met `is_active=False` pour cet appareil

**Question :**
- Peux-tu créer cette table et ces routes avec le code complet ?
- Comment générer un `device_fingerprint` fiable ?

---

### 3️⃣ GESTION EMPLOYÉS/FAMILLE (Dashboard Company)

**Problème actuel :**
- ❌ Une entreprise achète un pack 50 accès mais ne peut pas gérer les employés
- ❌ Pas de dashboard pour ajouter/retirer des accès

**Ce que nous voulons :**

#### A) Table `company_employee`

**Schéma SQL :**
```sql
CREATE TABLE company_employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    employee_email VARCHAR(120) UNIQUE,
    employee_name VARCHAR(100),
    access_granted_at TIMESTAMP DEFAULT NOW(),
    access_revoked_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### B) Routes pour gérer les employés

**Route :** `GET /api/company/employees`

**Retour :**
```json
{
  "company_name": "Acme Corp",
  "pack_name": "PME 50",
  "access_total": 50,
  "access_used": 23,
  "access_available": 27,
  "employees": [
    {
      "id": 1,
      "email": "jean@acme.com",
      "name": "Jean Dupont",
      "is_active": true,
      "access_granted_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "email": "sophie@acme.com",
      "name": "Sophie Martin",
      "is_active": false,
      "access_revoked_at": "2025-12-10T14:30:00Z"
    }
  ]
}
```

**Route :** `POST /api/company/employees/add`

**Paramètres :**
```json
{
  "employee_email": "nouveau@acme.com",
  "employee_name": "Nouveau Employé"
}
```

**Logique :**
1. Vérifier que `company.access_used < company.access_total`
2. Créer un `User` avec `role='member'` et `company_id=X`
3. Envoyer un email d'invitation avec lien d'activation
4. Incrémenter `company.access_used`
5. Ajouter dans `company_employees`

**Route :** `DELETE /api/company/employees/:id`

**Logique :**
1. Mettre `is_active=False` pour cet employé
2. Mettre `access_revoked_at=NOW()`
3. Décrémenter `company.access_used`
4. Désactiver le compte `User` de cet employé

**Question :**
- Peux-tu créer ces routes avec le code complet ?
- Comment gérer les invitations par email ?

---

## 📋 RÉSUMÉ DES DEMANDES

**À corriger :**
1. ✅ Bug 500 sur `/api/setup_v3`

**À ajouter :**
1. ✅ 3 routes d'inscription (Partner, Member, Hybrid)
2. ✅ Sécurisation anti-partage (device_sessions + limitation)
3. ✅ Gestion employés/famille (company_employees + routes)

**Code demandé :**
- ✅ `app.py` corrigé et complété
- ✅ `models.py` avec les nouvelles tables (`device_sessions`, `company_employees`)
- ✅ Toutes les routes API avec validation et gestion d'erreurs

---

## 🙏 MERCI GEMINI !

Nous apprécions énormément ton aide ! 🚀

Peux-tu nous fournir le **CODE COMPLET** pour ces 3 points ?

**Format souhaité :**
1. `models.py` (avec les nouvelles tables)
2. `app.py` (avec toutes les routes)
3. Instructions de déploiement (si nécessaire)

---

**Document préparé par :** L'équipe PEP's avec Manus AI  
**Date :** 19 Décembre 2025  
**Version :** V3 Completion Request
