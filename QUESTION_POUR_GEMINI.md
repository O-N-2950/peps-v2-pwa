# 🤔 QUESTION POUR GEMINI : Clarification Modèle Économique PEP's

Bonjour Gemini ! 👋

Merci pour ton aide précieuse sur le code V2 PRO de PEP's. Tout fonctionne parfaitement techniquement ! 🎉

Cependant, nous avons remarqué une **différence importante** entre le modèle économique que tu as implémenté et notre concept original.

Nous aimerions comprendre ta vision et bénéficier de tes recommandations.

---

## 📊 RÉSUMÉ ESSENTIEL : Les 4 Fonctionnalités Clés du Dashboard Partenaire

**Avant de tout lire, voici l'ESSENTIEL de ce que les commerçants partenaires doivent pouvoir faire :**

### 1️⃣ Offre Exclusive Permanente
- **Qui voit ?** TOUS les membres PEP's
- **Durée :** Toute l'année, tous les jours
- **Exemple :** "-10% sur tous les repas"
- **Obligation :** Chaque partenaire DOIT avoir au moins 1 offre permanente

### 2️⃣ Push aux Followers
- **Qui voit ?** SEULEMENT les membres qui ont mis ce commerçant en favoris
- **Contenu :** Message + Photo ou PDF
- **Fréquence :** Quotidien possible (ex: menu du jour chaque matin)
- **Exemple :** "🍽️ Menu du jour : Tartare, Risotto, Tiramisu - 25 CHF"

### 3️⃣ Offres Flash
- **Qui voit ?** TOUS les membres PEP's proches (géolocalisation)
- **Durée :** Quelques heures (invendus, désistement, tables dispo)
- **Stock :** Limité, premier arrivé premier servi
- **Règle :** Rabais flash > Rabais permanent (validation automatique)
- **Exemple :** "50% sur les invendus jusqu'à 18h (10 pains restants)"

### 4️⃣ Galerie Photos/PDF sur la Page Partenaire
- **Qui voit ?** TOUS les membres PEP's (page publique)
- **Types de contenu :**
  - **Permanent :** Photos du restaurant, carte, ambiance
  - **Temporaire (aujourd'hui) :** Menu du jour, plat du jour
  - **Programmé (semaine) :** Menu de la semaine (PDF qui change automatiquement)
- **Exemple :** Upload de 4 PDF (menus semaines 1, 2, 3, 4) qui s'affichent automatiquement

**Différence clé :**
- **Push Followers** = Notification privée (comme une newsletter)
- **Page Partenaire** = Publique (comme un site web)
- **Push Flash** = Notification géolocalisée (offre limitée)

**Maintenant, les détails complets...**

---

## 🎁 SYSTÈME DE PARRAINAGE (Croissance Virale)

**PEP's intègre un système de parrainage double pour favoriser la croissance organique.**

### 1️⃣ Parrainage Membre → Membre

**Fonctionnement :**
1. Membre actif PEP's génère son code de parrainage unique (ex: `PEPS-JEAN-ABC123`)
2. Il partage ce code à un ami (WhatsApp, email, etc.)
3. L'ami s'inscrit avec le code de parrainage
4. **L'ami reçoit 13 mois d'accès au lieu de 12** (1 mois gratuit)
5. **Le parrain reçoit +1 mois gratuit** sur son abonnement actuel

**Exemple concret :**
```
Membre actif : Jean
Abonnement actuel : Expire le 31/12/2025
Code de parrainage : PEPS-JEAN-ABC123

Ami parrainé : Marie
Inscription : 15/01/2025
Paiement : 49 CHF pour 1 accès

Résultat :
- Marie reçoit un accès valable jusqu'au 15/02/2026 (13 mois)
- Jean voit son abonnement prolongé jusqu'au 31/01/2026 (+1 mois gratuit)
```

**Avantages :**
- ✅ Croissance virale (les membres recrutent pour eux)
- ✅ Win-win (les 2 gagnent 1 mois)
- ✅ Coût d'acquisition client = 0
- ✅ Motivation forte (1 mois = 49 CHF de valeur)

### 2️⃣ Parrainage Membre → Partenaire

**Fonctionnement :**
1. Membre actif PEP's recommande PEP's à un commerçant
2. Le commerçant s'inscrit comme partenaire avec le code du membre
3. **Le membre parrain reçoit +1 mois gratuit** sur son abonnement
4. Le commerçant bénéficie de la plateforme gratuitement

**Exemple concret :**
```
Membre actif : Sophie
Abonnement actuel : Expire le 31/12/2025
Code de parrainage : PEPS-SOPHIE-XYZ789

Commerçant parrainé : Restaurant "Chez Mario"
Inscription : 20/01/2025
Paiement : 0 CHF (inscription partenaire gratuite)

Résultat :
- Mario crée son compte partenaire et son offre permanente
- Sophie voit son abonnement prolongé jusqu'au 31/01/2026 (+1 mois gratuit)
```

**Avantages :**
- ✅ Les membres deviennent des ambassadeurs
- ✅ Recrutement de partenaires sans effort commercial
- ✅ Les membres sont motivés à trouver de nouveaux commerces
- ✅ Effet réseau : Plus de partenaires = Plus de valeur pour les membres

### 📊 Dashboard Membre - Section Parrainage

**Interface utilisateur :**
```
🎁 Parrainez et gagnez des mois gratuits !

Vos statistiques :
- Amis parrainés : 3 personnes
- Partenaires parrainés : 1 commerçant
- Mois gratuits gagnés : 4 mois
- Prochaine expiration : 30/04/2026 (au lieu de 31/12/2025)

Votre code de parrainage :
[PEPS-JEAN-ABC123]  [📋 Copier]

Partager :
[📱 WhatsApp]  [📧 Email]  [🔗 Lien]

👥 Parrainer un ami
- Votre ami reçoit 1 mois gratuit (13 mois au total)
- Vous recevez +1 mois gratuit

🏪 Parrainer un commerçant
- Le commerçant s'inscrit gratuitement
- Vous recevez +1 mois gratuit
- Aidez à agrandir le réseau PEP's !
```

### 📧 Email de parrainage automatique

**Quand un membre partage son code :**
```
Objet : 🎁 Jean vous offre 1 mois gratuit sur PEP's !

Bonjour,

Votre ami Jean vous invite à rejoindre PEP's, la plateforme de privilèges exclusifs en Suisse.

🎉 Offre spéciale parrainage :
Inscrivez-vous avec le code PEPS-JEAN-ABC123 et recevez 13 mois d'accès au lieu de 12 !

Avec PEP's, profitez de centaines d'offres exclusives :
- Restaurants : -10% à -20% sur les repas
- Coiffeurs : -15% sur les coupes
- Magasins : -15% sur toute la collection
- Et bien plus !

Prix : 49 CHF/an (soit 4 CHF/mois)

[S'inscrire maintenant]

Bien à vous,
L'équipe PEP's
```

### 💻 Implémentation Technique

**Table SQL :**
```sql
CREATE TABLE referral (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES user(id),  -- Le parrain
    referred_id INTEGER REFERENCES user(id),  -- Le parrainé
    referral_type VARCHAR(50),  -- 'member' ou 'partner'
    referral_code VARCHAR(50) UNIQUE,
    status VARCHAR(50),  -- 'pending', 'completed'
    bonus_applied BOOLEAN DEFAULT FALSE,
    bonus_months INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ajouter le code de parrainage à la table user
ALTER TABLE user ADD COLUMN referral_code VARCHAR(50) UNIQUE;
```

**API - Générer le code de parrainage :**
```python
@app.route('/api/user/referral-code', methods=['GET'])
@jwt_required()
def get_referral_code():
    user = get_current_user()
    
    # Générer un code unique si pas encore créé
    if not user.referral_code:
        user.referral_code = f"PEPS-{user.email.split('@')[0].upper()}-{generate_random_string(6)}"
        db.session.commit()
    
    # Compter les parrainages
    referrals = Referral.query.filter_by(referrer_id=user.id, bonus_applied=True).all()
    
    return jsonify({
        'code': user.referral_code,
        'share_url': f'https://www.peps.swiss/register?ref={user.referral_code}',
        'total_referrals': len(referrals),
        'member_referrals': len([r for r in referrals if r.referral_type == 'member']),
        'partner_referrals': len([r for r in referrals if r.referral_type == 'partner']),
        'bonus_months': sum([r.bonus_months for r in referrals])
    })
```

**API - Inscription avec code de parrainage :**
```python
@app.route('/api/register', methods=['POST'])
def register():
    email = request.json['email']
    password = request.json['password']
    role = request.json['role']  # 'member' ou 'partner'
    referral_code = request.json.get('referral_code')  # Optionnel
    
    # Créer le compte
    new_user = User(
        email=email,
        password_hash=generate_password_hash(password),
        role=role
    )
    
    # Si code de parrainage fourni
    if referral_code:
        referrer = User.query.filter_by(referral_code=referral_code).first()
        if referrer and referrer.access_active:
            # Créer la relation de parrainage
            referral = Referral(
                referrer_id=referrer.id,
                referred_id=new_user.id,
                referral_type=role,
                referral_code=referral_code,
                status='completed'
            )
            db.session.add(referral)
            
            if role == 'member':
                # Le parrainé reçoit 13 mois au lieu de 12
                new_user.access_expires_at = datetime.now() + timedelta(days=395)  # 13 mois
                new_user.access_active = True
            
            # Le parrain reçoit +1 mois
            referrer.access_expires_at += timedelta(days=30)
            referral.bonus_applied = True
            
            # Envoyer email de confirmation au parrain
            send_email(
                to=referrer.email,
                subject="🎉 Vous avez parrainé avec succès !",
                body=f"Félicitations ! Votre filleul {email} s'est inscrit. Vous recevez +1 mois gratuit !"
            )
    else:
        if role == 'member':
            # Abonnement normal de 12 mois
            new_user.access_expires_at = datetime.now() + timedelta(days=365)
            new_user.access_active = True
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(success=True, bonus_applied=bool(referral_code))
```

**Questions pour toi Gemini :**
1. Faut-il limiter le nombre de parrainages par membre (ex: max 10/an) ?
2. Comment éviter les abus (faux comptes pour gagner des mois gratuits) ?
3. Faut-il un système de validation (le parrainé doit être actif 1 mois avant que le bonus soit appliqué) ?
4. Comment tracker les conversions de parrainages (combien de parrainés deviennent actifs) ?

---

## 📝 SYSTÈME DE RETOUR D'EXPÉRIENCE (Privé Admin)

**IMPORTANT : Contrôle qualité des partenaires**

### 🎯 Objectif

Détecter les commerçants partenaires qui **"ne jouent pas le jeu"** :
- Refusent d'appliquer le privilège promis
- Appliquent un rabais inférieur à celui promis
- Ont un service client médiocre
- Mentent sur leurs offres

### 🔒 Confidentialité CRUCIALE

**⚠️ PAS de notation publique !**

- ❌ PAS d'étoiles visibles par les autres membres
- ❌ PAS de commentaires publics
- ❌ PAS de "TripAdvisor" ou "Google Reviews"
- ✅ Retours visibles UNIQUEMENT par l'Admin (moi)

**Pourquoi ?**
- Éviter de décourager les partenaires
- Éviter les faux avis négatifs
- Garder le contrôle de la qualité
- Gérer les problèmes en interne

### 📱 Expérience Utilisateur (Membre)

**Après avoir utilisé un privilège :**

```jsx
// Popup après avoir déclenché les confettis
<div className="feedback-popup">
  <h3>🙏 Comment s'est passée votre expérience chez {partnerName} ?</h3>
  
  <div className="quick-feedback">
    <button className="positive">😊 Très bien</button>
    <button className="neutral">😐 Correct</button>
    <button className="negative">😞 Problème</button>
  </div>
  
  {selectedNegative && (
    <>
      <p>Que s'est-il passé ?</p>
      <textarea placeholder="Décrivez le problème..." />
      
      <div className="issue-types">
        <label>
          <input type="checkbox" /> Privilège refusé
        </label>
        <label>
          <input type="checkbox" /> Rabais incorrect
        </label>
        <label>
          <input type="checkbox" /> Service médiocre
        </label>
        <label>
          <input type="checkbox" /> Autre
        </label>
      </div>
    </>
  )}
  
  <button onClick={submitFeedback}>Envoyer</button>
  <button onClick={skip}>Passer</button>
</div>
```

**Message de confirmation :**
```
✅ Merci pour votre retour !

Votre avis nous aide à maintenir la qualité du réseau PEP's.
Nous allons contacter le partenaire si nécessaire.
```

### 🛡️ Dashboard Admin - Gestion des Retours

**Interface Admin :**

```
🚨 ALERTES QUALITÉ

⚠️ 3 retours négatifs non traités

---

Restaurant "Chez Mario" - Bienne
⭐ Note moyenne : 2.3/5 (privé)
Retours : 12 positifs, 3 neutres, 5 négatifs

Derniers retours négatifs :

1. Jean D. - Il y a 2 jours
   😞 Problème : Privilège refusé
   "Le serveur m'a dit qu'il ne connaissait pas PEP's et a refusé d'appliquer le rabais."
   [Contacter le partenaire] [Marquer comme traité]

2. Sophie M. - Il y a 5 jours
   😞 Problème : Rabais incorrect
   "Ils ont appliqué seulement 5% au lieu de 10% promis."
   [Contacter le partenaire] [Marquer comme traité]

3. Marc L. - Il y a 1 semaine
   😞 Problème : Service médiocre
   "Serveur désagréable quand j'ai mentionné PEP's."
   [Contacter le partenaire] [Marquer comme traité]

Actions possibles :
[⚠️ Envoyer un avertissement]
[📞 Appeler le partenaire]
[🚫 Suspendre temporairement]
[❌ Exclure de PEP's]
```

**Email automatique d'avertissement :**
```
Objet : ⚠️ PEP's - Retours négatifs reçus

Bonjour Mario,

Nous avons reçu plusieurs retours négatifs concernant votre établissement "Chez Mario".

Problèmes signalés :
- Privilège PEP's refusé par le personnel
- Rabais incorrect appliqué (5% au lieu de 10%)

Rappel de votre engagement :
Vous avez promis "-10% sur tous les repas" pour les membres PEP's actifs.

Actions nécessaires :
1. Former votre personnel sur le programme PEP's
2. Afficher une signalisation "Partenaire PEP's" visible
3. Respecter le rabais promis (10%)

Si ces problèmes persistent, nous serons contraints de suspendre votre compte partenaire.

Merci de votre compréhension.

Cordialement,
L'équipe PEP's
```

### 📊 Statistiques Qualité (Admin)

```
QUALITÉ DES PARTENAIRES

Moyenne globale : 4.2/5

Top 5 partenaires :
1. Restaurant "Le Gourmet" - 4.9/5 (89 retours)
2. Coiffeur "Salon Chic" - 4.8/5 (67 retours)
3. Boulangerie "Le Pétrin" - 4.7/5 (124 retours)

Bottom 5 partenaires :
1. Restaurant "Chez Mario" - 2.3/5 (20 retours) ⚠️
2. Magasin "Mode & Co" - 2.8/5 (15 retours) ⚠️
3. Coiffeur "Quick Cut" - 3.1/5 (12 retours)

Partenaires à surveiller : 2
Avertissements envoyés ce mois : 3
Exclusions ce mois : 0
```

### 💻 Implémentation Technique

**Table SQL :**
```sql
CREATE TABLE partner_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    partner_id INTEGER REFERENCES partner(id),
    offer_id INTEGER REFERENCES offer(id),
    rating INTEGER,  -- 1 à 5 (1=négatif, 5=positif)
    sentiment VARCHAR(50),  -- 'positive', 'neutral', 'negative'
    comment TEXT,
    issues JSON,  -- ["privilege_refused", "incorrect_discount", "poor_service"]
    admin_viewed BOOLEAN DEFAULT FALSE,
    admin_action VARCHAR(100),  -- 'warning_sent', 'partner_contacted', 'suspended', 'excluded'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partner_feedback_partner ON partner_feedback(partner_id);
CREATE INDEX idx_partner_feedback_sentiment ON partner_feedback(sentiment);
```

**API - Soumettre un retour :**
```python
@app.route('/api/feedback/submit', methods=['POST'])
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()['id']
    partner_id = request.json['partner_id']
    rating = request.json['rating']  # 1-5
    comment = request.json.get('comment', '')
    issues = request.json.get('issues', [])  # ['privilege_refused', ...]
    
    # Déterminer le sentiment
    if rating >= 4:
        sentiment = 'positive'
    elif rating == 3:
        sentiment = 'neutral'
    else:
        sentiment = 'negative'
    
    feedback = PartnerFeedback(
        user_id=user_id,
        partner_id=partner_id,
        rating=rating,
        sentiment=sentiment,
        comment=comment,
        issues=issues
    )
    db.session.add(feedback)
    db.session.commit()
    
    # Si négatif, notifier l'admin
    if sentiment == 'negative':
        send_admin_notification(
            subject="⚠️ Nouveau retour négatif",
            body=f"Partenaire : {partner.name}\nMembre : {user.email}\nCommentaire : {comment}"
        )
    
    return jsonify(success=True)

# API - Dashboard Admin : Voir tous les retours
@app.route('/api/admin/feedbacks', methods=['GET'])
@jwt_required()
@admin_required
def get_all_feedbacks():
    sentiment_filter = request.args.get('sentiment')  # 'negative', 'neutral', 'positive'
    partner_id = request.args.get('partner_id')
    
    query = PartnerFeedback.query
    
    if sentiment_filter:
        query = query.filter_by(sentiment=sentiment_filter)
    if partner_id:
        query = query.filter_by(partner_id=partner_id)
    
    feedbacks = query.order_by(PartnerFeedback.created_at.desc()).all()
    
    return jsonify([
        {
            'id': f.id,
            'user_email': f.user.email,
            'partner_name': f.partner.name,
            'rating': f.rating,
            'sentiment': f.sentiment,
            'comment': f.comment,
            'issues': f.issues,
            'created_at': f.created_at.isoformat(),
            'admin_action': f.admin_action
        }
        for f in feedbacks
    ])

# API - Envoyer un avertissement
@app.route('/api/admin/partner/<int:partner_id>/warn', methods=['POST'])
@jwt_required()
@admin_required
def warn_partner(partner_id):
    partner = Partner.query.get(partner_id)
    message = request.json.get('message')
    
    # Envoyer email d'avertissement
    send_email(
        to=partner.user.email,
        subject="⚠️ PEP's - Avertissement",
        body=message
    )
    
    # Logger l'action
    admin_log = AdminAction(
        admin_id=get_jwt_identity()['id'],
        action_type='partner_warning',
        target_id=partner_id,
        details=message
    )
    db.session.add(admin_log)
    db.session.commit()
    
    return jsonify(success=True)
```

**Questions pour toi Gemini :**
1. Comment calculer une note moyenne pertinente (pondérer les retours récents) ?
2. Faut-il un système de "strikes" (3 avertissements = exclusion automatique) ?
3. Comment détecter les faux retours négatifs (membres malveillants) ?

---

## 📊 DASHBOARD ADMIN - STATISTIQUES EN TEMPS RÉEL

**L'Admin doit avoir une vue complète de la plateforme à l'instant T.**

### 📊 Vue d'ensemble (KPIs)

```
📈 TABLEAU DE BORD ADMIN

💰 REVENUS
Ce mois : 61'103 CHF (+12% vs mois dernier)
Cette année : 487'250 CHF
MRR (Monthly Recurring Revenue) : 58'400 CHF

👥 MEMBRES
Actifs (payants) : 1'247 (+34 ce mois)
Gratuits (visiteurs) : 342 (-12 ce mois)
Taux de conversion : 78.5%
Churn rate : 3.2%

🏪 PARTENAIRES
Actifs : 89 (+5 ce mois)
En attente de validation : 7
Suspen

---

## 📊 NOTRE CONCEPT ORIGINAL (PEP's)

### 🎯 Vision Générale

**PEP's = Plateforme de Privilèges Exclusifs Permanents**

- Les **Membres** paient un abonnement annuel pour accéder à des **offres permanentes exclusives** chez des commerçants partenaires
- Les **Commerçants** s'inscrivent gratuitement et créent des offres permanentes (ex: -10% tous les jours)
- Les **Entreprises et Familles** achètent des packs d'accès pour leurs employés/membres

---

### 💳 SYSTÈME DE TARIFICATION (27 Packs)

**Packs = Nombre d'ACCÈS annuels (pas de crédits)**

Chaque accès = 1 compte utilisateur personnel valable 1 an.

**Exemples de packs :**

| Accès | Prix annuel (CHF/EUR) | Usage typique |
|-------|----------------------|---------------|
| 1 | 49.– | Membre individuel |
| 5 | 199.– | Famille (2 parents + 3 enfants) |
| 10 | 390.– | Petite entreprise |
| 50 | 1'590.– | Moyenne entreprise |
| 100 | 3'185.– | Grande entreprise |
| 1000 | 29'400.– | Très grande entreprise |
| 5000 | 110'250.– | Corporation |

**Liste COMPLÈTE des 27 packs avec TOUS les prix :**

| # | Accès | Prix annuel CHF | Prix annuel EUR |
|---|-------|----------------|----------------|
| 1 | 1 | 49.00 | 49.00 |
| 2 | 2 | 89.00 | 89.00 |
| 3 | 3 | 129.00 | 129.00 |
| 4 | 4 | 164.00 | 164.00 |
| 5 | 5 | 199.00 | 199.00 |
| 6 | 6 | 245.00 | 245.00 |
| 7 | 7 | 289.00 | 289.00 |
| 8 | 8 | 330.00 | 330.00 |
| 9 | 9 | 360.00 | 360.00 |
| 10 | 10 | 390.00 | 390.00 |
| 11 | 15 | 550.00 | 550.00 |
| 12 | 20 | 700.00 | 700.00 |
| 13 | 25 | 850.00 | 850.00 |
| 14 | 30 | 1'000.00 | 1'000.00 |
| 15 | 40 | 1'274.00 | 1'274.00 |
| 16 | 50 | 1'590.00 | 1'590.00 |
| 17 | 75 | 2'390.00 | 2'390.00 |
| 18 | 100 | 3'185.00 | 3'185.00 |
| 19 | 150 | 4'410.00 | 4'410.00 |
| 20 | 200 | 5'880.00 | 5'880.00 |
| 21 | 300 | 8'820.00 | 8'820.00 |
| 22 | 400 | 11'760.00 | 11'760.00 |
| 23 | 500 | 14'700.00 | 14'700.00 |
| 24 | 750 | 22'050.00 | 22'050.00 |
| 25 | 1000 | 29'400.00 | 29'400.00 |
| 26 | 2500 | 61'250.00 | 61'250.00 |
| 27 | 5000 | 110'250.00 | 110'250.00 |

**Note importante :** +5000 accès = Sur demande (tarif personnalisé)

---

### ⚙️ EXTERNALISATION DES TARIFS (Ta recommandation)

**Tu nous avais dit de mettre les tarifs dans un fichier séparé !**

Pour pouvoir modifier les prix sans refaire l'application.

**Options possibles :**

**Option A : Fichier JSON**
```json
// /backend/config/pricing.json
{
  "packs": [
    {"id": 1, "access_count": 1, "price_chf": 49.00, "price_eur": 49.00},
    {"id": 2, "access_count": 2, "price_chf": 89.00, "price_eur": 89.00},
    // ... 25 autres
  ]
}
```

**Option B : Fichier YAML**
```yaml
# /backend/config/pricing.yaml
packs:
  - id: 1
    access_count: 1
    price_chf: 49.00
    price_eur: 49.00
  - id: 2
    access_count: 2
    price_chf: 89.00
    price_eur: 89.00
```

**Option C : Table SQL avec flag "editable"**
```sql
CREATE TABLE pack (
    id SERIAL PRIMARY KEY,
    access_count INTEGER,
    price_chf DECIMAL(10,2),
    price_eur DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Admin pour modifier les prix sans toucher au code
```

**Option D : Variables d'environnement**
```bash
# Railway Environment Variables
PACK_1_PRICE_CHF=49.00
PACK_2_PRICE_CHF=89.00
# ... (pas pratique pour 27 packs)
```

**Question pour toi Gemini :**
Quelle option recommandes-tu ? Ou as-tu une meilleure idée ?

**Critères importants :**
- ✅ Facile à modifier sans redéployer l'app
- ✅ Pas besoin de toucher au code
- ✅ Versionning des changements de prix (historique)
- ✅ Possibilité de faire des promotions temporaires (ex: -20% sur le pack 50 accès)

---

### 👥 RÔLES UTILISATEURS

#### 1. **Partenaire (Commerçant)**
- ✅ Inscription GRATUITE
- ✅ Obligation : Créer 1 offre permanente exclusive minimum
- ✅ Dashboard : Gérer ses offres permanentes
- ✅ Analytics : Voir combien de membres utilisent ses offres

**Exemple d'offre permanente :**
- Restaurant : "10% de rabais sur tous les repas, tous les jours"
- Magasin de vêtements : "15% de rabais sur tout l'assortiment"
- Coiffeur : "Shampoing offert à chaque coupe"

**Important :** Les offres sont **PERMANENTES** = valables tous les jours, toute l'année, sans limite d'utilisation.

#### 2. **Entreprise (Company Admin)**
- ✅ Achète un pack (ex: 50 accès = 1'590 CHF/an)
- ✅ Dashboard pour gérer les employés :
  - Ajouter un employé (email) → Consomme 1 accès
  - Retirer un employé → Libère 1 accès (réattribuable)
  - Voir la liste des employés actifs
  - Voir : Accès total / Accès utilisés / Accès disponibles
- ✅ Peut upgrader le pack (ex: 50 → 100 accès)
- ✅ Renouvellement annuel automatique (Stripe)

**Cas d'usage :**
Une entreprise de 50 employés achète le pack "50 accès" pour 1'590 CHF/an.
- Elle attribue 45 accès à ses employés actuels
- Il lui reste 5 accès disponibles
- Un employé quitte l'entreprise → Elle retire son accès → 6 accès disponibles
- Elle embauche un nouvel employé → Elle lui attribue 1 accès → 5 accès disponibles

#### 3. **Famille (Family Admin)**
- ✅ Même principe qu'entreprise mais pour usage familial
- ✅ Achète un pack (ex: 5 accès = 199 CHF/an)
- ✅ Dashboard pour gérer les membres de la famille
- ✅ Peut ajouter/retirer des membres (enfants, grands-parents, etc.)

#### 4. **Employé / Membre Famille**
- ✅ Reçoit un accès attribué par son entreprise ou sa famille
- ✅ Compte personnel (email + mot de passe)
- ✅ Peut utiliser toutes les offres permanentes
- ✅ Application mobile pour "Profiter de l'offre"

#### 5. **Membre Individuel**
- ✅ Achète son propre accès (49 CHF/an pour 1 accès)
- ✅ Même fonctionnalités qu'un employé

---

### 🎉 SYSTÈME DE VALIDATION (Anti-Partage)

**Problème à résoudre :**
Empêcher qu'un membre partage son accès avec d'autres personnes (screenshot, partage de code, etc.).

**Solution actuelle (Flutter) :**
- Accès lié à l'appareil (1 appareil = 1 compte)
- Mais problème : Si quelqu'un change de téléphone ?

**Solution souhaitée (Web/PWA) :**

Quand un membre clique sur "🎉 Profiter de l'offre exclusive" :

1. **Écran plein écran avec :**
   - ✨ Animation de confettis (Framer Motion)
   - 📅 Date du jour
   - 🕐 Heure qui défile EN TEMPS RÉEL (mise à jour chaque seconde)
   - 👤 Nom du membre
   - 🏪 Nom du commerçant + Détails de l'offre

2. **Anti-screenshot :**
   - L'heure défile en temps réel → Impossible de faire un screenshot réutilisable
   - Expiration après 30 secondes → Le membre doit réactiver l'offre
   - Animation continue → Détection visuelle facile pour le commerçant

3. **Validation commerçant :**
   - Si les confettis "explosent" → Le membre est actif → Offre valide
   - Contrôle visuel ultra-rapide (< 2 secondes)

**Question pour toi :** Y a-t-il une meilleure solution technique pour empêcher le partage d'accès ?

---

### 🤖 TRIPLE USAGE DE L'IA GOOGLE GEMINI

**L'IA n'est pas seulement pour générer des descriptions !**

#### Usage 1 : Génération de descriptions (✅ Déjà codé)
```python
@app.route('/api/ai/generate', methods=['POST'])
def generate_ai():
    context = request.json.get('context')
    # Génère une description marketing pour l'offre
    return jsonify({'text': ai_response})
```

#### Usage 2 : Suggestions de Push Flash (❌ À implémenter)

**L'IA analyse le contexte et suggère des push au bon moment.**

**Exemples de suggestions :**

**Pour une boulangerie :**
```
Heure : 17h00
Suggestion IA : "💡 Il vous reste du pain ? Proposez un push 'Invendus -50%' !"
Template généré : "🥐 50% sur tous les invendus jusqu'à 18h !"
```

**Pour un restaurant :**
```
Jour : Mardi soir (jour creux)
Suggestion IA : "💡 Les mardis sont calmes. Proposez un push '2 tables -20%' !"
Template généré : "🍽️ 2 tables de 4 disponibles ce soir - 20% de rabais !"
```

**Pour un coiffeur :**
```
Événement : Désistement détecté (agenda connecté ?)
Suggestion IA : "💡 Place libre détectée à 16h. Envoyer un push ?"
Template généré : "💇 Place dispo aujourd'hui 16h - 20% de rabais !"
```

**API nécessaire :**
```python
@app.route('/api/ai/suggest-push', methods=['POST'])
@jwt_required()
def suggest_push():
    partner = get_current_partner()
    context = {
        'business_type': partner.category,  # Restaurant, Boulangerie, etc.
        'current_time': datetime.now(),
        'day_of_week': datetime.now().strftime('%A'),
        'recent_pushes': partner.recent_pushes,
        'follower_count': partner.follower_count
    }
    
    # L'IA analyse et suggère
    suggestion = ai_client.models.generate_content(
        model='gemini-1.5-flash',
        contents=f"Tu es expert marketing pour {context['business_type']}. 
                   Il est {context['current_time']}. 
                   Suggère un push flash pertinent avec template prêt à envoyer."
    )
    
    return jsonify({
        'suggestion': suggestion.text,
        'template': generated_template,
        'recommended_time': best_time
    })
```

#### Usage 3 : Aide aux nouveaux partenaires (❌ À implémenter)

**L'IA détecte les commerçants avec peu de followers et les aide.**

**Scénario :**
```
Partenaire : Nouveau restaurant inscrit il y a 1 semaine
Followers : 12 membres
Push envoyés : 0

Notification IA dans le dashboard :
"💡 Vous avez peu de followers. Voici 3 idées de push pour vous faire connaître :

1. 🍽️ Push découverte : '20% pour votre 1ère visite !'
2. 🎉 Push événement : 'Soirée d'inauguration vendredi - Apéro offert !'
3. ⏰ Push happy hour : 'Happy hour 17h-19h - Cocktails à moitié prix !'

Envoyer maintenant ?"
```

**Analytics IA :**
```
Dashboard partenaire :
"📊 Vos statistiques :
- Vos push à 18h ont 3x plus de succès
- Les offres -30% génèrent 2x plus de réservations que -20%
- Vos followers préférés : Mardi et Jeudi soir

💡 Recommandation : Envoyez un push mardi 18h avec -30% !"
```

**Question pour toi Gemini :**
Comment structurer ces 3 usages de l'IA dans le code ?
Faut-il 3 routes API séparées ou une seule route intelligente ?

---

### 💡 IA SUGGÈRE DES PRIVILÈGES INTELLIGENTS (Pas juste "Café offert")

**PROBLÈME RÉEL OBSERVÉ :**

Beaucoup de restaurateurs proposent **"Café offert après les repas"** comme privilège permanent.

**Pourquoi c'est FAIBLE :**
- ❌ Valeur perçue trop faible (café = 4-5 CHF)
- ❌ Ne fait PAS déplacer les membres spécifiquement pour ça
- ❌ Tous les restaurants font pareil (pas différenciant)

**CAS RÉEL :**
```
Restaurant "Chez Paolo"
Jour : Mardi soir
Clients : 2 personnes (nous) dans tout le restaurant
Privilège actuel : "☕ Café offert après les repas"

Suggestion donnée au restaurateur :
"💡 Pourquoi ne pas faire -20% sur les repas les mardis ?
Vous remplissez vos jours creux et les membres viennent spécifiquement pour ça !"

Résultat : Le restaurateur n'y avait jamais pensé (pas le temps, pas d'idées)
```

**RÔLE DE L'IA : Conseiller Marketing Intelligent**

L'IA doit analyser :
1. **Type de commerce** (Restaurant, Coiffeur, Magasin, etc.)
2. **Privilège actuel** ("Café offert")
3. **Statistiques d'utilisation** (Peu de membres utilisent l'offre)
4. **Jours creux** (Mardi/Mercredi vides)

Et suggérer des privilèges **STRATÉGIQUES** :

**Suggestions IA pour Restaurants :**
```
❌ Faible : "Café offert"
✅ Fort : "-20% sur les repas les mardis et mercredis"
✅ Fort : "-15% sur la carte tous les jours"
✅ Fort : "Menu du jour à 15 CHF au lieu de 20 CHF"
✅ Fort : "Apéro offert pour toute table de 4+"
```

**Suggestions IA pour Coiffeurs :**
```
❌ Faible : "Shampoing offert"
✅ Fort : "-20% sur toutes les coupes les lundis"
✅ Fort : "-15% sur les colorations"
✅ Fort : "Coupe + brushing au prix de la coupe seule"
```

**Suggestions IA pour Magasins de vêtements :**
```
❌ Faible : "-5% sur tout"
✅ Fort : "-15% sur toute la collection"
✅ Fort : "-20% sur les nouveautés"
✅ Fort : "Achetez 2 articles, le 3ème à -50%"
```

**Dashboard Partenaire - Notification IA :**
```
💡 Suggestion d'amélioration de votre privilège

Privilège actuel : "☕ Café offert après les repas"
Utilisation : 23 membres en 2 mois (faible)

Analyse IA :
- Valeur perçue trop faible
- Vos mardis et mercredis sont vides (analytics)
- 87% de vos concurrents offrent aussi le café

Recommandation :
🎯 "-20% sur les repas les mardis et mercredis"

Avantages :
- Remplit vos jours creux
- Valeur perçue 10x supérieure (20% sur 50 CHF = 10 CHF vs café 4 CHF)
- Différenciant (peu de restaurants font ça)
- Estimation : +15 couverts/semaine

Modifier mon privilège maintenant ?
[OUI]  [Voir d'autres suggestions]
```

**API nécessaire :**
```python
@app.route('/api/ai/analyze-privilege', methods=['POST'])
@jwt_required()
def analyze_privilege():
    partner = get_current_partner()
    
    context = {
        'business_type': partner.category,
        'current_privilege': partner.permanent_offer.description,
        'usage_stats': get_usage_stats(partner.id),
        'empty_days': analyze_empty_days(partner.id),
        'competitor_privileges': get_competitor_privileges(partner.category)
    }
    
    # L'IA analyse et recommande
    analysis = ai_client.models.generate_content(
        model='gemini-1.5-flash',
        contents=f"""Tu es consultant marketing pour restaurants.
        
        Contexte :
        - Type : {context['business_type']}
        - Privilège actuel : {context['current_privilege']}
        - Utilisation : {context['usage_stats']['usage_count']} en {context['usage_stats']['months']} mois
        - Jours creux : {context['empty_days']}
        
        Analyse le privilège actuel et recommande 3 alternatives STRATÉGIQUES plus attractives.
        Pour chaque suggestion, explique pourquoi c'est mieux et estime l'impact.
        """
    )
    
    return jsonify({
        'analysis': analysis.text,
        'suggestions': parsed_suggestions,
        'estimated_impact': estimated_impact
    })
```

**Question pour toi Gemini :**
Comment l'IA peut-elle quantifier l'attractivité d'un privilège ?
Peut-elle apprendre des privilèges qui marchent le mieux ?

---

### 📊 DOUBLE SYSTÈME D'OFFRES

**IMPORTANT : Il y a 2 TYPES d'offres !**

#### 1️⃣ OFFRES PERMANENTES (Base)

**Caractéristiques :**

**Différence clé avec ton implémentation actuelle :**

| Ton code actuel | Notre concept |
|-----------------|---------------|
| Offres "flash" avec stock limité | Offres permanentes illimitées |
| `stock: 5` → Épuisable | Pas de stock → Illimité |
| `is_urgent: true` → Temporaire | `is_permanent: true` → Toute l'année |
| `old_price` / `discount` → Promo | `discount_value: "10%"` → Rabais permanent |

**Exemple d'offre permanente :**

```json
{
  "partner": "Restaurant Sushi Démo",
  "title": "10% de rabais sur tous les repas",
  "description": "Valable tous les jours, midi et soir, sur toute la carte",
  "discount_type": "percentage",
  "discount_value": "10%",
  "is_permanent": true,
  "category": "Restaurant",
  "usage_count": 1247  // Analytics : combien de fois utilisée
}
```

Un membre peut utiliser cette offre **tous les jours** s'il le souhaite (tant mieux pour le restaurant !).

#### 2️⃣ OFFRES FLASH (Opportunités)

**NOUVEAU : Système de Push Notifications en temps réel**

**Cas d'usage :**

**Exemple 1 : Boulangerie - Invendus**
```
Heure : 17h00
Push : "🥐 50% sur tous les invendus jusqu'à 18h aujourd'hui !"
Stock : Limité (ce qui reste)
Premier arrivé, premier servi
```

**Exemple 2 : Coiffeur - Désistement**
```
Heure : 14h30
Push : "💇 Une place disponible aujourd'hui à 16h00 - 20% de rabais !"
Stock : 1 place
Le premier membre qui clique l'obtient
```

**Exemple 3 : Restaurant - Tables disponibles**
```
Heure : 18h00
Push : "🍽️ 2 tables de 4 personnes ce soir - 20% sur les repas !"
Stock : 8 places (2 tables × 4)
Réservation instantanée
```

**Fonctionnement :**
1. Le commerçant crée un push flash depuis son dashboard
2. **Validation automatique : Le rabais flash DOIT être > au rabais permanent**
3. Le push est envoyé aux membres proches (géolocalisation)
4. Le premier membre qui clique obtient l'offre
5. Le commerçant est notifié de qui a réservé
6. Le push est automatiquement désactivé quand le stock est épuisé

**⚠️ RÈGLE MÉTIER CRUCIALE : Flash > Permanent**

**Problème à éviter :**
```
Restaurant "Chez Mario"
Offre permanente : 10% de rabais sur tous les repas

Push Flash (INVALIDE) : "🍽️ 10% de rabais ce soir !"
❌ REFUSÉ : Le rabais flash doit être SUPÉRIEUR au permanent !

Push Flash (VALIDE) : "🍽️ 20% de rabais ce soir !"
✅ ACCEPTÉ : 20% > 10%
```

**Validation backend :**
```python
@app.route('/api/partner/create-flash-offer', methods=['POST'])
@jwt_required()
def create_flash_offer():
    partner = get_current_partner()
    permanent_offer = partner.permanent_offer  # Ex: 10%
    flash_discount = request.json['discount']  # Ex: 20%
    
    # Extraire les valeurs numériques
    permanent_value = extract_percentage(permanent_offer.discount_value)  # 10
    flash_value = extract_percentage(flash_discount)  # 20
    
    if flash_value <= permanent_value:
        return jsonify({
            'error': f"Le rabais flash ({flash_value}%) doit être supérieur au rabais permanent ({permanent_value}%) !"
        }), 400
    
    # Créer le push flash
    # ...
```

**Question pour toi Gemini :**
Comment gérer les différents types de rabais ?
- Pourcentage : 10%, 20%, 50%
- Montant fixe : 5 CHF, 10 CHF
- Gratuité : "Café offert", "Dessert offert"

Comment comparer "10% permanent" vs "Dessert offert flash" ?

**Différences avec offres permanentes :**

| Critère | Offres Permanentes | Offres Flash |
|---------|-------------------|-------------|
| Durée | Toute l'année | Quelques heures |
| Stock | Illimité | Limité |
| Fréquence | 1-2 par partenaire | Plusieurs par jour |
| Notification | Non | Push notification |
| Réservation | Non | Oui (premier arrivé) |
| Rabais | 10-15% | 20-50% |

---

---

### ⭐ SYSTÈME DE FOLLOWERS + PUSH MENUS (Très Important !)

**NOUVEAU : Les membres peuvent "suivre" leurs restaurants préférés**

#### Fonctionnalité 1 : Bouton "Ajouter aux favoris"

**Sur la page de chaque partenaire :**
```jsx
<button onClick={followPartner}>
  ⭐ Ajouter aux favoris
</button>

// Une fois suivi :
<button onClick={unfollowPartner}>
  ★ Retirer des favoris
</button>
```

**Avantages pour les membres :**
- Liste de leurs restaurants/commerces préférés
- Reçoivent les news/menus de leurs favoris
- Accès rapide depuis "Mes favoris"

**Avantages pour les partenaires :**
- Savent combien de membres les suivent (analytics)
- Peuvent communiquer directement avec leurs followers
- Fidélisation client

#### Fonctionnalité 2 : Push aux Followers UNIQUEMENT

**DIFFÉRENCE CRUCIALE avec Push Flash :**

| Critère | Push Flash | Push Followers |
|---------|-----------|----------------|
| Destin. | Tous membres proches (géoloc) | Seulement followers |
| But | Offre limitée (stock) | Info/News/Menu |
| Fréq. | Occasionnel | Quotidien possible |
| Contenu | Rabais exceptionnel | Menu, news, événement |
| Fichier | Non | Oui (photo, PDF) |

**Cas d'usage Push Followers :**

**Exemple 1 : Menu du jour (Ardoise)**
```
Restaurant "Chez Mario"
Chaque matin à 9h00 :

1. Le restaurateur prend en photo son ardoise avec le menu du jour
2. Upload la photo dans son dashboard
3. Clique sur "Envoyer aux followers"
4. Tous ses 247 followers reçoivent une notification :

   🍽️ Chez Mario - Menu du jour
   "Entrée : Salade césar
    Plat : Osso bucco
    Dessert : Tiramisu
    Prix : 25 CHF"
   [Voir la photo]
```

**Exemple 2 : Événement spécial**
```
Coiffeur "Salon Chic"

"Nous avons reçu la nouvelle gamme de produits bio !
Venez découvrir nos soins naturels.
-10% sur les soins cette semaine pour nos followers 💚"
```

**Exemple 3 : Fermeture exceptionnelle**
```
Boulangerie "Le Pétrin d'Or"

"⚠️ Fermé demain pour congés annuels.
Réouverture lundi 8h00 !
Merci de votre compréhension 🙏"
```

**Dashboard Partenaire - Interface Push Followers :**
```jsx
<div className="push-followers-section">
  <h3>Envoyer un message à vos {followerCount} followers</h3>
  
  <textarea placeholder="Votre message..." />
  
  <div className="file-upload">
    <button>📷 Ajouter une photo</button>
    <button>📄 Ajouter un PDF</button>
  </div>
  
  <button className="send-btn">
    Envoyer aux followers
  </button>
</div>
```

#### Fonctionnalité 3 : Programmation de Menus (PDF)

**CAS D'USAGE RÉEL :**

Un restaurant veut afficher son **menu de la semaine** sur sa page PEP's.

Plutôt que de le changer manuellement chaque semaine, il peut **programmer à l'avance**.

**Workflow :**

**Étape 1 : Upload des menus**
```
Dashboard Partenaire > Menus programmés

[Upload PDF]
- menu_semaine_20-26_janvier.pdf ✅
- menu_semaine_27-02_fevrier.pdf ✅
- menu_semaine_03-09_fevrier.pdf ✅
```

**Étape 2 : Programmation**
```
Semaine du 20 au 26 janvier → menu_semaine_20-26_janvier.pdf
Semaine du 27 au 02 février → menu_semaine_27-02_fevrier.pdf
Semaine du 03 au 09 février → menu_semaine_03-09_fevrier.pdf
```

**Étape 3 : Affichage automatique**
```
Page du restaurant (visible par TOUS les membres) :

🍽️ Restaurant "Chez Mario"
📍 Bienne, 200m
⭐ 247 followers

[Privilège permanent]
10% de rabais sur tous les repas

[Menu de la semaine] 📄
> menu_semaine_20-26_janvier.pdf
  (Affiché automatiquement du 20 au 26 janvier)
  
[Ajouter aux favoris ⭐]
```

**Étape 4 : Notification automatique aux followers**
```
Chaque lundi matin à 8h00 :

Notification push aux 247 followers :
"🍽️ Chez Mario - Nouveau menu de la semaine !
Découvrez notre carte du 20 au 26 janvier.
[Voir le menu]"
```

**IMPORTANT : Visibilité publique vs Push privé**

| Fonctionnalité | Visible par | Notification |
|----------------|-------------|-------------|
| Page partenaire | TOUS les membres | Non |
| Menu programmé (PDF) | TOUS les membres | Non |
| Privilège permanent | TOUS les membres | Non |
| Push Followers | Seulement followers | Oui |
| Push Flash | Membres proches (géoloc) | Oui |

**Différence clé :**
- **Page du restaurant** = Publique (comme un site web)
- **Push aux followers** = Privé (comme une newsletter)

**API nécessaires :**

```python
# Suivre un partenaire
@app.route('/api/partners/<int:partner_id>/follow', methods=['POST'])
@jwt_required()
def follow_partner(partner_id):
    user_id = get_jwt_identity()['id']
    follow = PartnerFollower(user_id=user_id, partner_id=partner_id)
    db.session.add(follow)
    db.session.commit()
    return jsonify(success=True)

# Push aux followers
@app.route('/api/partner/push-to-followers', methods=['POST'])
@jwt_required()
def push_to_followers():
    partner = get_current_partner()
    message = request.json['message']
    file = request.files.get('file')  # Photo ou PDF
    
    # Récupérer tous les followers
    followers = User.query.join(PartnerFollower).filter(
        PartnerFollower.partner_id == partner.id
    ).all()
    
    # Envoyer push notification
    for follower in followers:
        send_push_notification(
            user_id=follower.id,
            title=f"{partner.name}",
            message=message,
            file_url=file_url if file else None
        )
    
    return jsonify(success=True, sent_to=len(followers))

# Programmer un menu
@app.route('/api/partner/schedule-menu', methods=['POST'])
@jwt_required()
def schedule_menu():
    partner = get_current_partner()
    pdf_file = request.files['pdf']
    start_date = request.form['start_date']  # 2025-01-20
    end_date = request.form['end_date']      # 2025-01-26
    
    # Upload PDF
    pdf_url = upload_to_s3(pdf_file)
    
    # Programmer
    menu = ScheduledMenu(
        partner_id=partner.id,
        pdf_url=pdf_url,
        start_date=start_date,
        end_date=end_date
    )
    db.session.add(menu)
    db.session.commit()
    
    return jsonify(success=True)

# Afficher le menu actuel (public)
@app.route('/api/partners/<int:partner_id>/current-menu')
def get_current_menu(partner_id):
    today = datetime.now().date()
    menu = ScheduledMenu.query.filter(
        ScheduledMenu.partner_id == partner_id,
        ScheduledMenu.start_date <= today,
        ScheduledMenu.end_date >= today
    ).first()
    
    if menu:
        return jsonify({
            'pdf_url': menu.pdf_url,
            'valid_until': menu.end_date
        })
    return jsonify(menu=None)
```

**Tables SQL nécessaires :**

```sql
-- Followers
CREATE TABLE partner_follower (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    partner_id INTEGER REFERENCES partner(id),
    followed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, partner_id)
);

-- Menus programmés
CREATE TABLE scheduled_menu (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partner(id),
    pdf_url TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Push historique
CREATE TABLE partner_push (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partner(id),
    message TEXT,
    file_url TEXT,
    sent_to_count INTEGER,
    sent_at TIMESTAMP DEFAULT NOW()
);
```

**Question pour toi Gemini :**
1. Comment gérer les notifications push (Firebase, OneSignal, autre) ?
2. Faut-il limiter le nombre de push aux followers (ex: 1/jour max) ?
3. Comment optimiser l'envoi de push à 1000+ followers (queue, batch) ?

---

## 💳 HYPOTHÈSE : Les Crédits pour les Partenaires ?

**Maintenant que tu connais le système de Push Flash, voici notre hypothèse :**

### Scénario A : Crédits pour Push Flash

**Les partenaires achètent des crédits pour envoyer des push flash.**

**Tarification possible :**
- 1 Push Flash = 1 crédit
- Pack 50 crédits = 99 CHF → 50 push flash
- Pack 200 crédits = 299 CHF → 200 push flash  
- Pack 1000 crédits = 999 CHF → 1000 push flash

**Logique :**
- Offres permanentes = GRATUITES (obligation d'inscription)
- Push Flash = PAYANTS (consomme des crédits)
- Plus un commerçant envoie de push, plus il paie

**Avantages :**
- ✅ Monétisation des partenaires (pas seulement des membres)
- ✅ Évite le spam de push (limité par les crédits)
- ✅ Modèle économique équilibré (B2C + B2B)

**Inconvénients :**
- ❌ Peut freiner les commerçants à envoyer des push
- ❌ Complexité : 2 systèmes de crédits (membres + partenaires)

### Scénario B : Push Flash gratuits, Crédits pour Premium

**Les push flash sont gratuits mais limités.**

**Exemple :**
- 5 push flash gratuits par mois
- Au-delà, achat de crédits nécessaire

**OU : Crédits pour features premium :**
- 🎯 Push prioritaire (envoyé en premier aux membres)
- 📍 Push géolocalisé ultra-ciblé (rayon 500m)
- 📊 Analytics avancées (taux de conversion, meilleurs horaires)
- ⭐ Promotion en haut de page (offre mise en avant)
- 🤖 Suggestions IA illimitées

**Avantages :**
- ✅ Encourage l'usage des push (gratuits)
- ✅ Monétisation sur les features premium
- ✅ Modèle freemium classique

**Inconvénients :**
- ❌ Risque de spam si push gratuits illimités
- ❌ Moins de revenus si peu de partenaires upgradent

### Scénario C : Pas de crédits pour les partenaires

**Les partenaires ne paient rien, tout est gratuit.**

**Monétisation uniquement sur les membres :**
- Membres paient pour accéder aux offres
- Partenaires bénéficient gratuitement de la visibilité
- Modèle 100% B2C

**Avantages :**
- ✅ Simplicité maximale
- ✅ Facile de recruter des partenaires (tout gratuit)
- ✅ Pas de friction pour envoyer des push

**Inconvénients :**
- ❌ Aucune monétisation des partenaires
- ❌ Risque de spam de push
- ❌ Dépendance totale aux abonnements membres

**Question pour toi Gemini :**
Quel scénario recommandes-tu ? Ou as-tu une meilleure idée ?

---

## ❓ TON IMPLÉMENTATION (Système de Crédits)

### Ce que tu as codé :

**Table `pack` :**
```sql
id | name       | credits | price
---|------------|---------|-------
1  | Starter    | 50      | 99.0
2  | Pro        | 200     | 299.0
3  | Enterprise | 1000    | 999.0
```

**Table `company` :**
```sql
id | name        | credits_balance
---|-------------|----------------
1  | TechCorp SA | 100
```

**Route `/api/company/buy-pack` :**
```python
company.credits_balance += pack.credits
```

### 🤔 NOS QUESTIONS POUR TOI :

1. **Qu'avais-tu prévu avec ce système de "crédits" ?**
   - À quoi devaient servir ces crédits ?
   - 1 crédit = 1 réservation d'offre ?
   - 1 crédit = 1 accès temporaire ?
   - Autre chose ?

2. **Pourquoi 3 packs seulement (Starter, Pro, Enterprise) ?**
   - Était-ce une simplification pour le MVP ?
   - Ou une recommandation business de ta part ?

3. **Quelle était ta vision du modèle économique ?**
   - Les entreprises achètent des crédits pour leurs employés ?
   - Les crédits se consomment à chaque utilisation d'offre ?
   - Les crédits se rechargent automatiquement ?

---

## 💡 TES RECOMMANDATIONS

Maintenant que tu comprends notre concept original, nous aimerions avoir ton avis d'expert :

### 1. **Modèle de données**

Quelle structure de base de données recommandes-tu pour gérer :
- Les **27 packs d'accès** (1 à 5000) avec prix CHF et EUR
- La gestion des employés/membres famille
- Le tracking des accès utilisés/disponibles
- Les abonnements annuels avec renouvellement automatique
- **L'historique des changements de prix** (pour analytics et transparence)
- **Les promotions temporaires** sur certains packs

### 2. **Anti-partage d'accès**

Le système de confettis + date/heure live est-il suffisant ?

Recommandes-tu d'autres techniques :
- Device fingerprinting ?
- Limitation du nombre d'appareils par compte ?
- Détection de connexions simultanées ?
- QR codes dynamiques ?
- Autre ?

### 3. **Offres permanentes vs Flash Deals**

Ton implémentation actuelle gère des offres "flash" avec stock limité.

Pour des offres **permanentes illimitées** :
- Faut-il quand même tracker chaque utilisation (analytics) ?
- Comment éviter les abus (ex: un membre qui utilise 10x/jour la même offre) ?
- Faut-il ajouter des limites (ex: 1 utilisation/jour/offre) ?

### 4. **Gestion des employés**

Pour le dashboard Company/Family, quelle est la meilleure approche :

**Option A : Invitation par email**
```
1. Admin ajoute un email
2. Système envoie un email d'invitation avec mot de passe temporaire
3. Employé crée son compte et change le mot de passe
```

**Option B : Génération de codes d'accès**
```
1. Admin génère un code d'accès unique (ex: PEPS-ABC123)
2. Admin donne le code à l'employé
3. Employé s'inscrit avec le code
```

**Option C : Autre ?**

### 5. **Intégration Stripe**

Pour les abonnements annuels :
- Stripe Subscriptions (avec renouvellement auto) ?
- Stripe Checkout one-time payment + webhook pour tracking ?
- Stripe Customer Portal pour que les entreprises gèrent elles-mêmes leurs abonnements ?

### 6. **Scalabilité**

Notre tarification va jusqu'à **5000 accès** (110'250 CHF/an).

Pour une entreprise avec 5000 employés :
- Comment optimiser les requêtes SQL ?
- Faut-il ajouter de la pagination ?
- Redis pour le cache ?
- Autre optimisation ?

### 7. **Comparaison des 2 modèles**

**Système de crédits (ton code) vs Système d'accès annuels (notre concept)**

Selon toi, quels sont les avantages/inconvénients de chaque approche ?

| Critère | Crédits | Accès annuels |
|---------|---------|---------------|
| Simplicité | ? | ? |
| Flexibilité | ? | ? |
| Monétisation | ? | ? |
| UX Entreprise | ? | ? |
| UX Membre | ? | ? |

### 8. **Recommandations business**

En tant qu'IA avec une vision globale :
- Notre modèle de tarification (27 packs) est-il trop complexe ?
- Devrions-nous simplifier à 5-6 packs comme tu l'as fait ?
- Le concept d'offres permanentes illimitées est-il viable pour les commerçants ?
- Y a-t-il des risques que nous n'avons pas anticipés ?

---

## 🎯 CE QUE NOUS ATTENDONS DE TOI

1. ✅ **Explique-nous ta vision** du système de crédits que tu as implémenté
2. ✅ **Compare les 2 approches** (crédits vs accès annuels) avec avantages/inconvénients
3. ✅ **Recommande la meilleure solution technique** pour notre concept
4. ✅ **Propose des améliorations** que nous n'avons pas envisagées
5. ✅ **Identifie les risques** techniques et business
6. ✅ **Donne-nous le code corrigé** si tu penses que notre concept est meilleur
7. ✅ **Ou explique-nous pourquoi ton système de crédits serait préférable** et comment l'adapter à notre vision

---

## 📝 CONTEXTE TECHNIQUE ACTUEL

**Stack :**
- Backend : Flask + PostgreSQL + Google Gemini AI
- Frontend : React + TailwindCSS + Framer Motion
- Déploiement : Railway
- Paiements : Stripe (à intégrer)

**Code actuel :**
- ✅ Authentification JWT multi-rôle fonctionne
- ✅ Dashboard Partner fonctionne
- ✅ Dashboard Company fonctionne (mais avec système de crédits)
- ❌ Gestion des employés pas encore implémentée
- ❌ Système de confettis pas encore implémenté
- ❌ Offres permanentes pas encore implémentées (actuellement flash deals)

---

## 🙏 MERCI GEMINI !

Nous apprécions énormément ton aide et ta vision technique.

Prends le temps d'analyser notre concept et de nous donner tes meilleures recommandations.

Nous sommes ouverts à modifier notre approche si tu identifies des problèmes ou des opportunités d'amélioration !

**À toi de jouer ! 🚀**

---

**Date :** 18 Décembre 2025  
**Préparé par :** L'équipe PEP's avec Manus AI

Restaurant "Chez Mario" - Bienne
⭐ Note moyenne : 2.3/5 (privé)
Retours : 12 positifs, 3 neutres, 5 négatifs

Derniers retours négatifs :

1. Jean D. - Il y a 2 jours
   😞 Problème : Privilège refusé
   "Le serveur m'a dit qu'il ne connaissait pas PEP's et a refusé d'appliquer le rabais."
   [Contacter le partenaire] [Marquer comme traité]

2. Sophie M. - Il y a 5 jours
   😞 Problème : Rabais incorrect
   "Ils ont appliqué seulement 5% au lieu de 10% promis."
   [Contacter le partenaire] [Marquer comme traité]

3. Marc L. - Il y a 1 semaine
   😞 Problème : Service médiocre
   "Serveur désagréable quand j'ai mentionné PEP's."
   [Contacter le partenaire] [Marquer comme traité]

Actions possibles :
[⚠️ Envoyer un avertissement]
[📞 Appeler le partenaire]
[🚫 Suspendre temporairement]
[❌ Exclure de PEP's]
```

**Email automatique d'avertissement :**
```
Objet : ⚠️ PEP's - Retours négatifs reçus

Bonjour Mario,

Nous avons reçu plusieurs retours négatifs concernant votre établissement "Chez Mario".

Problèmes signalés :
- Privilège PEP's refusé par le personnel
- Rabais incorrect appliqué (5% au lieu de 10%)

Rappel de votre engagement :
Vous avez promis "-10% sur tous les repas" pour les membres PEP's actifs.

Actions nécessaires :
1. Former votre personnel sur le programme PEP's
2. Afficher une signalisation "Partenaire PEP's" visible
3. Respecter le rabais promis (10%)

Si ces problèmes persistent, nous serons contraints de suspendre votre compte partenaire.

Merci de votre compréhension.

Cordialement,
L'équipe PEP's
```

### 📊 Statistiques Qualité (Admin)

```
QUALITÉ DES PARTENAIRES

Moyenne globale : 4.2/5

Top 5 partenaires :
1. Restaurant "Le Gourmet" - 4.9/5 (89 retours)
2. Coiffeur "Salon Chic" - 4.8/5 (67 retours)
3. Boulangerie "Le Pétrin" - 4.7/5 (124 retours)

Bottom 5 partenaires :
1. Restaurant "Chez Mario" - 2.3/5 (20 retours) ⚠️
2. Magasin "Mode & Co" - 2.8/5 (15 retours) ⚠️
3. Coiffeur "Quick Cut" - 3.1/5 (12 retours)

Partenaires à surveiller : 2
Avertissements envoyés ce mois : 3
Exclusions ce mois : 0
```

### 💻 Implémentation Technique

**Table SQL :**
```sql
CREATE TABLE partner_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    partner_id INTEGER REFERENCES partner(id),
    offer_id INTEGER REFERENCES offer(id),
    rating INTEGER,  -- 1 à 5 (1=négatif, 5=positif)
    sentiment VARCHAR(50),  -- 'positive', 'neutral', 'negative'
    comment TEXT,
    issues JSON,  -- ["privilege_refused", "incorrect_discount", "poor_service"]
    admin_viewed BOOLEAN DEFAULT FALSE,
    admin_action VARCHAR(100),  -- 'warning_sent', 'partner_contacted', 'suspended', 'excluded'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_partner_feedback_partner ON partner_feedback(partner_id);
CREATE INDEX idx_partner_feedback_sentiment ON partner_feedback(sentiment);
```

**API - Soumettre un retour :**
```python
@app.route('/api/feedback/submit', methods=['POST'])
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()['id']
    partner_id = request.json['partner_id']
    rating = request.json['rating']  # 1-5
    comment = request.json.get('comment', '')
    issues = request.json.get('issues', [])  # ['privilege_refused', ...]
    
    # Déterminer le sentiment
    if rating >= 4:
        sentiment = 'positive'
    elif rating == 3:
        sentiment = 'neutral'
    else:
        sentiment = 'negative'
    
    feedback = PartnerFeedback(
        user_id=user_id,
        partner_id=partner_id,
        rating=rating,
        sentiment=sentiment,
        comment=comment,
        issues=issues
    )
    db.session.add(feedback)
    db.session.commit()
    
    # Si négatif, notifier l'admin
    if sentiment == 'negative':
        send_admin_notification(
            subject="⚠️ Nouveau retour négatif",
            body=f"Partenaire : {partner.name}\nMembre : {user.email}\nCommentaire : {comment}"
        )
    
    return jsonify(success=True)

# API - Dashboard Admin : Voir tous les retours
@app.route('/api/admin/feedbacks', methods=['GET'])
@jwt_required()
@admin_required
def get_all_feedbacks():
    sentiment_filter = request.args.get('sentiment')  # 'negative', 'neutral', 'positive'
    partner_id = request.args.get('partner_id')
    
    query = PartnerFeedback.query
    
    if sentiment_filter:
        query = query.filter_by(sentiment=sentiment_filter)
    if partner_id:
        query = query.filter_by(partner_id=partner_id)
    
    feedbacks = query.order_by(PartnerFeedback.created_at.desc()).all()
    
    return jsonify([
        {
            'id': f.id,
            'user_email': f.user.email,
            'partner_name': f.partner.name,
            'rating': f.rating,
            'sentiment': f.sentiment,
            'comment': f.comment,
            'issues': f.issues,
            'created_at': f.created_at.isoformat(),
            'admin_action': f.admin_action
        }
        for f in feedbacks
    ])

# API - Envoyer un avertissement
@app.route('/api/admin/partner/<int:partner_id>/warn', methods=['POST'])
@jwt_required()
@admin_required
def warn_partner(partner_id):
    partner = Partner.query.get(partner_id)
    message = request.json.get('message')
    
    # Envoyer email d'avertissement
    send_email(
        to=partner.user.email,
        subject="⚠️ PEP's - Avertissement",
        body=message
    )
    
    # Logger l'action
    admin_log = AdminAction(
        admin_id=get_jwt_identity()['id'],
        action_type='partner_warning',
        target_id=partner_id,
        details=message
    )
    db.session.add(admin_log)
    db.session.commit()
    
    return jsonify(success=True)
```

**Questions pour toi Gemini :**
1. Comment calculer une note moyenne pertinente (pondérer les retours récents) ?
2. Faut-il un système de "strikes" (3 avertissements = exclusion automatique) ?
3. Comment détecter les faux retours négatifs (membres malveillants) ?

---

## 📊 DASHBOARD ADMIN - STATISTIQUES EN TEMPS RÉEL

**L'Admin doit avoir une vue complète de la plateforme à l'instant T.**

### 📈 Vue d'ensemble (KPIs)

```
📊 TABLEAU DE BORD ADMIN

💰 REVENUS
Ce mois : 61'103 CHF (+12% vs mois dernier)
Cette année : 487'250 CHF
MRR (Monthly Recurring Revenue) : 58'400 CHF
Prévision fin d'année : 700'800 CHF

👥 MEMBRES
Actifs (payants) : 1'247 (+34 ce mois)
Gratuits (visiteurs) : 342 (-12 ce mois)
Taux de conversion : 78.5%
Churn rate : 3.2%
LTV (Lifetime Value) : 147 CHF

🏪 PARTENAIRES
Actifs : 89 (+5 ce mois)
En attente de validation : 7
Suspendus : 2
Exclus (historique) : 3

🎯 ENGAGEMENT
Offres permanentes actives : 89
Offres Flash ce mois : 234
Push envoyés ce mois : 1'247
Taux d'ouverture push : 67%
Privilèges utilisés ce mois : 3'456
```

### 👥 Statistiques Membres DÉTAILLÉES

**Par Genre :**
```
Hommes : 562 (45%)
Femmes : 685 (55%)
```

**Par Âge :**
```
18-25 ans : 150 (12%)
26-35 ans : 474 (38%)
36-50 ans : 436 (35%)
51-65 ans : 162 (13%)
65+ ans : 25 (2%)
```

**Par Localité (Top 10) :**
```
1. Bienne : 234 membres
2. Neuchâtel : 189 membres
3. Fribourg : 156 membres
4. La Chaux-de-Fonds : 123 membres
5. Delémont : 98 membres
6. Porrentruy : 87 membres
7. Moutier : 76 membres
8. Yverdon : 65 membres
9. Fleurier : 54 membres
10. Tavannes : 43 membres
```

**Par Canton :**
```
Berne : 456 membres (36.6%)
Neuchâtel : 289 membres (23.2%)
Fribourg : 234 membres (18.8%)
Jura : 187 membres (15.0%)
Vaud : 81 membres (6.5%)
```

**Par Pays :**
```
Suisse : 1'223 membres (98.1%)
France : 24 membres (1.9%)
```

**Par Type de Pack :**
```
1 accès (individuel) : 789 membres
5 accès (famille) : 123 familles (615 membres)
10 accès (petite entreprise) : 34 entreprises (340 membres)
50 accès (moyenne entreprise) : 5 entreprises (250 membres)
100 accès (grande entreprise) : 1 entreprise (100 membres)
```

### 🏪 Statistiques Partenaires DÉTAILLÉES

**Par Localité (Top 10) :**
```
1. Bienne : 23 partenaires
2. Neuchâtel : 18 partenaires
3. Fribourg : 15 partenaires
4. La Chaux-de-Fonds : 12 partenaires
5. Delémont : 8 partenaires
6. Porrentruy : 5 partenaires
7. Moutier : 4 partenaires
8. Yverdon : 2 partenaires
9. Fleurier : 1 partenaire
10. Tavannes : 1 partenaire
```

**Par Canton :**
```
Berne : 45 partenaires (50.6%)
Neuchâtel : 25 partenaires (28.1%)
Fribourg : 19 partenaires (21.3%)
```

**Par Type d'Activité :**
```
Restaurants : 34 partenaires (38.2%)
Coiffeurs : 12 partenaires (13.5%)
Magasins de vêtements : 10 partenaires (11.2%)
Boulangeries : 8 partenaires (9.0%)
Salons de beauté : 6 partenaires (6.7%)
Magasins de sport : 5 partenaires (5.6%)
Taxis : 4 partenaires (4.5%)
Pharmacies : 3 partenaires (3.4%)
Librairies : 3 partenaires (3.4%)
Autres : 4 partenaires (4.5%)
```

**Par Popularité (Followers) :**
```
Top 5 :
1. Restaurant "Le Gourmet" - 347 followers
2. Boulangerie "Le Pétrin d'Or" - 289 followers
3. Coiffeur "Salon Chic" - 234 followers
4. Magasin "Mode & Style" - 198 followers
5. Restaurant "Chez Mario" - 176 followers

Bottom 5 :
1. Taxi "Express" - 12 followers
2. Librairie "Le Livre" - 15 followers
3. Pharmacie "Santé+" - 18 followers
4. Magasin "Sport Pro" - 21 followers
5. Coiffeur "Quick Cut" - 23 followers
```

### 📊 Statistiques d'Engagement

**Offres Permanentes :**
```
Total : 89 offres
Utilisations ce mois : 2'134
Moyenne par offre : 24 utilisations/mois
Top offre : Restaurant "Le Gourmet" -15% (234 utilisations)
```

**Offres Flash :**
```
Envoyées ce mois : 234 offres
Taux de saisie : 87% (204 offres saisies)
Moyenne temps de saisie : 4 minutes
Top partenaire : Boulangerie "Le Pétrin" (23 offres flash ce mois)
```

**Push Notifications :**
```
Push Flash envoyés : 1'247
Taux d'ouverture : 67%
Taux de clic : 43%

Push Followers envoyés : 456
Taux d'ouverture : 82%
Taux de clic : 61%
```

### 💻 Implémentation Technique

**API - Dashboard Admin KPIs :**
```python
@app.route('/api/admin/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def admin_dashboard():
    # Revenus
    current_month_revenue = calculate_monthly_revenue()
    yearly_revenue = calculate_yearly_revenue()
    mrr = calculate_mrr()
    
    # Membres
    active_members = User.query.filter_by(role='member', access_active=True).count()
    free_users = User.query.filter_by(access_active=False).count()
    conversion_rate = calculate_conversion_rate()
    churn_rate = calculate_churn_rate()
    
    # Partenaires
    active_partners = Partner.query.filter_by(status='active').count()
    pending_partners = Partner.query.filter_by(status='pending').count()
    suspended_partners = Partner.query.filter_by(status='suspended').count()
    
    # Engagement
    permanent_offers = Offer.query.filter_by(is_permanent=True).count()
    flash_offers_this_month = FlashOffer.query.filter(
        FlashOffer.created_at >= first_day_of_month()
    ).count()
    
    return jsonify({
        'revenue': {
            'current_month': current_month_revenue,
            'yearly': yearly_revenue,
            'mrr': mrr
        },
        'members': {
            'active': active_members,
            'free': free_users,
            'conversion_rate': conversion_rate,
            'churn_rate': churn_rate
        },
        'partners': {
            'active': active_partners,
            'pending': pending_partners,
            'suspended': suspended_partners
        },
        'engagement': {
            'permanent_offers': permanent_offers,
            'flash_offers_this_month': flash_offers_this_month
        }
    })

# API - Statistiques Membres
@app.route('/api/admin/stats/members', methods=['GET'])
@jwt_required()
@admin_required
def member_stats():
    members = User.query.filter_by(role='member', access_active=True).all()
    
    # Par genre
    gender_stats = {
        'male': len([m for m in members if m.gender == 'male']),
        'female': len([m for m in members if m.gender == 'female'])
    }
    
    # Par âge
    age_stats = calculate_age_distribution(members)
    
    # Par localité
    location_stats = calculate_location_distribution(members)
    
    # Par canton
    canton_stats = calculate_canton_distribution(members)
    
    return jsonify({
        'gender': gender_stats,
        'age': age_stats,
        'location': location_stats,
        'canton': canton_stats
    })

# API - Statistiques Partenaires
@app.route('/api/admin/stats/partners', methods=['GET'])
@jwt_required()
@admin_required
def partner_stats():
    partners = Partner.query.filter_by(status='active').all()
    
    # Par localité
    location_stats = calculate_partner_location_distribution(partners)
    
    # Par type d'activité
    category_stats = {}
    for partner in partners:
        category = partner.category
        category_stats[category] = category_stats.get(category, 0) + 1
    
    # Par popularité (followers)
    popularity_stats = sorted(
        [(p.name, p.follower_count) for p in partners],
        key=lambda x: x[1],
        reverse=True
    )
    
    return jsonify({
        'location': location_stats,
        'category': category_stats,
        'popularity': popularity_stats
    })
```

**Questions pour toi Gemini :**
1. Quels autres KPIs seraient pertinents pour l'Admin ?
2. Comment optimiser les requêtes SQL pour calculer ces stats en temps réel ?
3. Faut-il un système de cache (Redis) pour les stats consultées fréquemment ?

---

## 📧 RAPPELS AUTOMATIQUES (Conversions)

**Objectif : Convertir les visiteurs gratuits en membres payants**

### 🎯 Stratégie de Conversion

**Problème :**
- 342 personnes inscrites gratuitement
- Elles peuvent voir les partenaires mais pas utiliser les privilèges
- Elles doivent payer pour débloquer les fonctionnalités

**Solution : Séquence d'emails automatiques**

### 📧 Email 1 : Bienvenue (J+0)

```
Objet : 🎉 Bienvenue sur PEP's !

Bonjour,

Merci de vous être inscrit sur PEP's !

Vous avez maintenant accès à la liste de nos 89 commerçants partenaires à Bienne et dans la région.

🔓 Pour profiter des privilèges exclusifs :
- Activez votre accès membre (49 CHF/an)
- Déclenchez les privilèges chez nos partenaires
- Saisissez les offres Flash en temps réel

[Activer mon accès maintenant]

Découvrez quelques offres exclusives :
- Restaurant "Le Gourmet" : -15% sur tous les repas
- Boulangerie "Le Pétrin d'Or" : -10% tous les jours
- Coiffeur "Salon Chic" : -20% sur les coupes

À bientôt !
L'équipe PEP's
```

### 📧 Email 2 : Rappel (J+3)

```
Objet : 💡 Vous avez découvert nos 89 partenaires ?

Bonjour,

Vous êtes inscrit sur PEP's depuis 3 jours.

Avez-vous eu le temps de découvrir nos commerçants partenaires ?

📊 Quelques chiffres :
- 89 partenaires à Bienne et dans la région
- 234 offres Flash envoyées ce mois
- 78% de nos visiteurs activent leur accès dans les 7 jours

🎁 Offre spéciale : Activez votre accès aujourd'hui et recevez 1 mois supplémentaire gratuit !

[Activer mon accès (49 CHF/an)]

Bien à vous,
L'équipe PEP's
```

### 📧 Email 3 : Urgence (J+7)

```
Objet : ⏰ Dernière chance : +1 mois gratuit expire ce soir !

Bonjour,

Votre offre spéciale expire ce soir à minuit !

🎁 Activez votre accès aujourd'hui et recevez 13 mois au lieu de 12 (1 mois gratuit).

Ce que vous manquez en restant visiteur :
- ❌ Impossible de profiter des privilèges permanents
- ❌ Impossible de saisir les offres Flash
- ❌ Pas de notifications push
- ❌ Pas de système de favoris

✅ Devenez membre actif pour seulement 49 CHF/an (4 CHF/mois) !

[Activer mon accès maintenant]

Cette offre expire dans 12 heures.

L'équipe PEP's
```

### 📧 Email 4 : Réengagement (J+14)

```
Objet : 🤔 PEP's ne vous convient pas ?

Bonjour,

Vous êtes inscrit sur PEP's depuis 2 semaines mais vous n'avez pas encore activé votre accès.

Nous aimerions comprendre pourquoi.

Pouvez-vous nous dire ce qui vous retient ?
- Le prix (49 CHF/an)
- Pas assez de partenaires dans votre région
- Vous ne comprenez pas le concept
- Autre raison

[Répondre à ce sondage (2 minutes)]

En remerciement, nous vous offrons un code promo -20% si vous activez votre accès cette semaine.

Merci de votre temps !
L'équipe PEP's
```

### 📧 Email 5 : Dernière tentative (J+30)

```
Objet : 👋 On vous dit au revoir ?

Bonjour,

Cela fait 1 mois que vous êtes inscrit sur PEP's sans avoir activé votre accès.

Nous comprenons que PEP's ne soit peut-être pas pour vous.

Avant de partir, une dernière offre :

🎁 Code promo BIENVENUE30 : -30% sur votre première année
Prix : 34.30 CHF au lieu de 49 CHF

Ce code expire dans 48 heures.

[Activer mon accès avec le code promo]

Si vous ne souhaitez plus recevoir d'emails, vous pouvez vous désinscrire.

[Se désinscrire]

Bonne continuation !
L'équipe PEP's
```

### 💻 Implémentation Technique

**Table SQL :**
```sql
CREATE TABLE conversion_email (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user(id),
    email_type VARCHAR(50),  -- 'welcome', 'reminder_3d', 'urgency_7d', 'reengagement_14d', 'last_chance_30d'
    sent_at TIMESTAMP DEFAULT NOW(),
    opened BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    converted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conversion_email_user ON conversion_email(user_id);
```

**Script Cron (exécuté chaque jour) :**
```python
from datetime import datetime, timedelta

def send_conversion_emails():
    today = datetime.now()
    
    # Email J+3
    users_3d = User.query.filter(
        User.access_active == False,
        User.created_at >= today - timedelta(days=3),
        User.created_at < today - timedelta(days=2)
    ).all()
    
    for user in users_3d:
        # Vérifier si email déjà envoyé
        already_sent = ConversionEmail.query.filter_by(
            user_id=user.id,
            email_type='reminder_3d'
        ).first()
        
        if not already_sent:
            send_email(
                to=user.email,
                subject="💡 Vous avez découvert nos 89 partenaires ?",
                template='conversion_reminder_3d.html'
            )
            
            # Logger l'envoi
            email_log = ConversionEmail(
                user_id=user.id,
                email_type='reminder_3d'
            )
            db.session.add(email_log)
    
    # Email J+7
    users_7d = User.query.filter(
        User.access_active == False,
        User.created_at >= today - timedelta(days=7),
        User.created_at < today - timedelta(days=6)
    ).all()
    
    for user in users_7d:
        already_sent = ConversionEmail.query.filter_by(
            user_id=user.id,
            email_type='urgency_7d'
        ).first()
        
        if not already_sent:
            send_email(
                to=user.email,
                subject="⏰ Dernière chance : +1 mois gratuit expire ce soir !",
                template='conversion_urgency_7d.html'
            )
            
            email_log = ConversionEmail(
                user_id=user.id,
                email_type='urgency_7d'
            )
            db.session.add(email_log)
    
    # Email J+14, J+30...
    # (même logique)
    
    db.session.commit()

# Exécuter via Cron chaque jour à 9h00
# 0 9 * * * python3 /path/to/send_conversion_emails.py
```

**API - Tracker les ouvertures et clics :**
```python
@app.route('/api/email/track/open/<int:email_id>', methods=['GET'])
def track_email_open(email_id):
    email = ConversionEmail.query.get(email_id)
    if email:
        email.opened = True
        db.session.commit()
    
    # Retourner un pixel transparent
    return send_file('static/pixel.png', mimetype='image/png')

@app.route('/api/email/track/click/<int:email_id>', methods=['GET'])
def track_email_click(email_id):
    email = ConversionEmail.query.get(email_id)
    if email:
        email.clicked = True
        db.session.commit()
    
    # Rediriger vers la page d'activation
    return redirect('https://www.peps.swiss/activate')
```

**Dashboard Admin - Statistiques Conversions :**
```
📧 CONVERSIONS (Visiteurs → Membres)

Visiteurs gratuits actuels : 342

Séquence d'emails :
- Email J+0 (Bienvenue) : 342 envoyés, 89% ouverts, 23% clics
- Email J+3 (Rappel) : 263 envoyés, 76% ouverts, 34% clics
- Email J+7 (Urgence) : 189 envoyés, 82% ouverts, 41% clics
- Email J+14 (Réengagement) : 123 envoyés, 67% ouverts, 28% clics
- Email J+30 (Dernière chance) : 67 envoyés, 54% ouverts, 19% clics

Taux de conversion global : 78.5%
Temps moyen de conversion : 12 jours
Meilleur email : J+7 (Urgence) - 41% de clics

Conversions ce mois : 89 nouveaux membres
Revenus générés : 4'361 CHF
```

**Questions pour toi Gemini :**
1. La séquence d'emails est-elle trop agressive (5 emails en 30 jours) ?
2. Faut-il ajouter des SMS en complément des emails ?
3. Comment personnaliser les emails selon la localité de l'utilisateur ?
4. Faut-il un système de scoring (lead scoring) pour prioriser les visiteurs les plus engagés ?

---

## 🎯 RÉCAPITULATIF COMPLET : Ce que nous attendons de toi, Gemini

Merci d'avoir lu ce document ultra-détaillé ! 🙏

Nous avons maintenant expliqué **TOUT** notre concept PEP's.

### 📋 RÉSUMÉ DES FONCTIONNALITÉS

**Pour les Membres :**
1. ✅ Packs d'accès annuels (27 paliers de 1 à 5000 accès)
2. ✅ Offres permanentes illimitées
3. ✅ Offres Flash géolocalisées
4. ✅ Système de confettis anti-partage
5. ✅ Système de favoris (suivre des partenaires)
6. ✅ Push notifications (Flash + Followers)
7. ✅ Parrainage (Membre→Membre, Membre→Partenaire)
8. ✅ Retour d'expérience après utilisation

**Pour les Partenaires :**
1. ✅ Inscription gratuite
2. ✅ Offre permanente obligatoire
3. ✅ Offres Flash (invendus, désistements)
4. ✅ Push aux followers
5. ✅ Galerie photos/PDF programmée
6. ✅ Suggestions IA pour privilèges intelligents
7. ✅ Suggestions IA pour Push Flash
8. ✅ Analytics et aide IA

**Pour les Entreprises/Familles :**
1. ✅ Achat de packs (10, 50, 100, 1000 accès)
2. ✅ Dashboard gestion employés/membres
3. ✅ Ajout/Retrait d'accès
4. ✅ Renouvellement automatique (Stripe)

**Pour l'Admin :**
1. ✅ Dashboard statistiques temps réel
2. ✅ Gestion des retours d'expérience (privés)
3. ✅ Avertissements/Exclusions partenaires
4. ✅ Statistiques membres (genre, âge, localité, canton)
5. ✅ Statistiques partenaires (localité, type, popularité)
6. ✅ Suivi des conversions visiteurs→membres

---

## ❓ NOS QUESTIONS POUR TOI

### 1️⃣ **Explique-nous ton système de "crédits"**

Dans ton code actuel, tu as implémenté :
```python
company.credits_balance += pack.credits
```

**Questions :**
- À quoi devaient servir ces crédits ?
- 1 crédit = 1 réservation d'offre ?
- 1 crédit = 1 accès temporaire ?
- 1 crédit = 1 push flash ?
- Autre chose ?

**Penses-tu que les crédits sont complémentaires à notre système d'accès annuels ?**

Par exemple :
- **Accès annuels** = Pour les membres (B2C)
- **Crédits** = Pour les partenaires (prestations premium) ?

### 2️⃣ **Compare les 2 approches**

| Critère | Système de Crédits (ton code) | Système d'Accès Annuels (notre concept) |
|---------|-------------------------------|------------------------------------------|
| Simplicité | ? | ? |
| Flexibilité | ? | ? |
| Monétisation | ? | ? |
| UX Entreprise | ? | ? |
| UX Membre | ? | ? |
| Scalabilité | ? | ? |

**Quelle approche recommandes-tu et pourquoi ?**

### 3️⃣ **Recommandations sur notre concept**

**Modèle économique :**
- Les 27 packs sont-ils trop complexes ? Devrions-nous simplifier à 5-6 packs ?
- Le concept d'offres permanentes illimitées est-il viable pour les commerçants ?
- Faut-il monétiser les partenaires (crédits pour push flash, features premium) ?

**Architecture technique :**
- Quelle structure de base de données recommandes-tu ?
- Comment gérer les 27 packs (fichier JSON, YAML, table SQL, variables d'environnement) ?
- Comment optimiser les requêtes pour 5000 accès (grande entreprise) ?

**Anti-partage d'accès :**
- Le système de confettis + date/heure live est-il suffisant ?
- Faut-il ajouter device fingerprinting, limitation d'appareils, détection de connexions simultanées ?

**IA Google Gemini :**
- Comment structurer les 3 usages (descriptions, suggestions push, aide partenaires) ?
- Comment quantifier l'attractivité d'un privilège ?
- Comment apprendre des privilèges qui marchent le mieux ?

**Push Notifications :**
- Firebase, OneSignal ou autre solution ?
- Comment optimiser l'envoi à 1000+ followers (queue, batch) ?
- Faut-il limiter le nombre de push/jour aux followers ?

**Validation Offres Flash :**
- Comment comparer "10% permanent" vs "Dessert offert flash" ?
- Comment gérer les différents types de rabais (pourcentage, montant fixe, gratuité) ?

**Système de Parrainage :**
- Faut-il limiter le nombre de parrainages (max 10/an) ?
- Comment éviter les abus (faux comptes) ?
- Faut-il valider que le parrainé soit actif 1 mois avant d'appliquer le bonus ?

**Retours d'Expérience :**
- Comment calculer une note moyenne pertinente (pondérer les retours récents) ?
- Faut-il un système de "strikes" (3 avertissements = exclusion automatique) ?
- Comment détecter les faux retours négatifs ?

**Conversions :**
- La séquence de 5 emails en 30 jours est-elle trop agressive ?
- Faut-il ajouter des SMS ?
- Comment personnaliser selon la localité ?

### 4️⃣ **Identifie les risques**

**Techniques :**
- Quels sont les points faibles de notre architecture ?
- Où peuvent survenir des problèmes de performance ?
- Quelles sont les failles de sécurité potentielles ?

**Business :**
- Quels sont les risques que nous n'avons pas anticipés ?
- Y a-t-il des incohérences dans notre modèle économique ?
- Quelles sont les opportunités d'amélioration ?

### 5️⃣ **Donne-nous le code corrigé**

Si tu penses que notre concept est meilleur que ton système de crédits actuel :

**Fournis-nous le code complet pour :**
1. ✅ Modèle de données corrigé (tables SQL)
2. ✅ Les 27 packs externalisés (format recommandé)
3. ✅ Routes API pour gestion employés/famille
4. ✅ Routes API pour offres Flash avec validation (Flash > Permanent)
5. ✅ Routes API pour système de followers + push
6. ✅ Routes API pour galerie photos/PDF programmée
7. ✅ Routes API pour parrainage
8. ✅ Routes API pour retours d'expérience
9. ✅ Routes API pour dashboard admin
10. ✅ Script cron pour rappels automatiques
11. ✅ Intégration IA (3 usages)
12. ✅ Intégration Stripe (abonnements annuels)

**Ou explique-nous pourquoi ton système de crédits serait préférable et comment l'adapter à notre vision.**

---

## 🙏 MERCI GEMINI !

Nous apprécions énormément ton aide et ta vision technique.

Prends le temps d'analyser notre concept complet et de nous donner tes meilleures recommandations.

Nous sommes ouverts à modifier notre approche si tu identifies des problèmes ou des opportunités d'amélioration !

**À toi de jouer ! 🚀**

---

**Document préparé par :** L'équipe PEP's avec Manus AI  
**Date :** 18 Décembre 2025  
**Version :** 2.0 ULTRA-COMPLÈTE
