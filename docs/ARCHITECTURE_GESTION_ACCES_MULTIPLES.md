# Architecture - Système de Gestion des Accès Multiples PEP'S

## 🎯 **OBJECTIF**

Permettre aux titulaires d'abonnements multi-accès (Familles OU Entreprises) de gérer à qui sont attribués les accès.

---

## 📋 **RÈGLES MÉTIER**

### Tarification Unique
**Pas de distinction Privé/Entreprise:**
- 1 accès = 49 CHF/an (Solo - particulier OU indépendant)
- 2 accès = 89 CHF/an (Couple OU petite PME)
- 3 accès = 129 CHF/an (Famille OU PME)
- 4 accès = 169 CHF/an
- 5 accès = 199 CHF/an
- 10+ accès = Tarifs dégressifs sur devis

### Gestion des Accès
**Dès 2+ accès, le titulaire peut:**
1. **Attribuer** un accès à un numéro de téléphone
2. **Voir la liste** des bénéficiaires (nom + téléphone)
3. **Révoquer** un accès (libère un slot)
4. **Réattribuer** l'accès libéré à quelqu'un d'autre

**Cas d'usage:**
- Famille: Donner accès aux enfants, parents
- PME: Donner accès aux employés, révoquer si départ

---

## 🗄️ **MODÈLE DE DONNÉES**

### Table `subscriptions` (existante)
```sql
id, user_id, pack_id, status, amount_paid, currency, 
start_date, end_date, stripe_subscription_id
```

### Table `access_slots` (existante - à vérifier)
```sql
CREATE TABLE access_slots (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER REFERENCES subscriptions(id),
  slot_number INTEGER NOT NULL,  -- 1, 2, 3, 4, 5...
  phone_number VARCHAR(20),       -- +41 79 123 45 67
  beneficiary_name VARCHAR(100),  -- Nom du bénéficiaire
  assigned_at TIMESTAMP,          -- Date d'attribution
  revoked_at TIMESTAMP,           -- Date de révocation (NULL si actif)
  status VARCHAR(20) DEFAULT 'active',  -- active, revoked
  UNIQUE(subscription_id, slot_number)
);
```

**Exemple:**
```
Abonnement #123 (5 accès - 199 CHF/an)
├─ Slot 1: +41 79 111 11 11 (Jean Dupont) - actif
├─ Slot 2: +41 78 222 22 22 (Marie Martin) - actif
├─ Slot 3: +41 77 333 33 33 (Pierre Dubois) - révoqué
├─ Slot 4: NULL (disponible)
└─ Slot 5: NULL (disponible)
```

---

## 🔌 **API ENDPOINTS**

### 1. Lister les accès d'un abonnement
```http
GET /api/subscriptions/{subscription_id}/access-slots
Authorization: Bearer {jwt_token}

Response 200:
{
  "subscription_id": 123,
  "total_slots": 5,
  "used_slots": 2,
  "available_slots": 3,
  "slots": [
    {
      "slot_number": 1,
      "phone_number": "+41 79 111 11 11",
      "beneficiary_name": "Jean Dupont",
      "status": "active",
      "assigned_at": "2026-01-15T10:00:00Z"
    },
    {
      "slot_number": 2,
      "phone_number": "+41 78 222 22 22",
      "beneficiary_name": "Marie Martin",
      "status": "active",
      "assigned_at": "2026-01-16T14:30:00Z"
    },
    {
      "slot_number": 3,
      "phone_number": null,
      "beneficiary_name": null,
      "status": "available"
    }
  ]
}
```

### 2. Attribuer un accès
```http
POST /api/subscriptions/{subscription_id}/access-slots
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "slot_number": 3,
  "phone_number": "+41 76 444 44 44",
  "beneficiary_name": "Sophie Leroy"
}

Response 201:
{
  "message": "Accès attribué avec succès",
  "slot": {
    "slot_number": 3,
    "phone_number": "+41 76 444 44 44",
    "beneficiary_name": "Sophie Leroy",
    "status": "active"
  }
}
```

### 3. Révoquer un accès
```http
DELETE /api/subscriptions/{subscription_id}/access-slots/{slot_number}
Authorization: Bearer {jwt_token}

Response 200:
{
  "message": "Accès révoqué avec succès",
  "slot_number": 2,
  "available_slots": 4
}
```

### 4. Réattribuer un accès révoqué
```http
PUT /api/subscriptions/{subscription_id}/access-slots/{slot_number}
Authorization: Bearer {jwt_token}
Content-Type: application/json

Body:
{
  "phone_number": "+41 75 555 55 55",
  "beneficiary_name": "Lucas Bernard"
}

Response 200:
{
  "message": "Accès réattribué avec succès",
  "slot": {
    "slot_number": 2,
    "phone_number": "+41 75 555 55 55",
    "beneficiary_name": "Lucas Bernard",
    "status": "active"
  }
}
```

---

## 🖥️ **INTERFACE DASHBOARD**

### Page: `/dashboard/access-management`

**Composants:**
1. **Header** - Récapitulatif abonnement
   ```
   Abonnement: 5 accès (199 CHF/an)
   Utilisés: 3/5 | Disponibles: 2
   ```

2. **Liste des accès** - Tableau interactif
   ```
   | # | Téléphone          | Nom            | Statut | Actions        |
   |---|-------------------|----------------|--------|----------------|
   | 1 | +41 79 111 11 11  | Jean Dupont    | Actif  | [Révoquer]     |
   | 2 | +41 78 222 22 22  | Marie Martin   | Actif  | [Révoquer]     |
   | 3 | -                 | -              | Libre  | [Attribuer]    |
   | 4 | -                 | -              | Libre  | [Attribuer]    |
   | 5 | -                 | -              | Libre  | [Attribuer]    |
   ```

3. **Modal Attribuer** - Formulaire
   ```
   Attribuer l'accès #3
   
   Numéro de téléphone: [+41 __ ___ __ __]
   Nom du bénéficiaire: [_______________]
   
   [Annuler] [Confirmer]
   ```

4. **Modal Révoquer** - Confirmation
   ```
   ⚠️ Révoquer l'accès de Jean Dupont ?
   
   Cette action libérera un slot que vous pourrez
   réattribuer à une autre personne.
   
   [Annuler] [Confirmer la révocation]
   ```

---

## 🔔 **NOTIFICATIONS**

### SMS au bénéficiaire (attribution)
```
🎉 PEP'S: Vous avez reçu un accès PEP'S !
Téléchargez l'app et connectez-vous avec ce numéro.
www.peps.swiss
```

### SMS au bénéficiaire (révocation)
```
ℹ️ PEP'S: Votre accès a été révoqué.
Pour toute question, contactez le titulaire de l'abonnement.
```

### Email au titulaire (confirmation)
```
Sujet: Accès PEP'S attribué à Sophie Leroy

Bonjour,

Vous avez attribué l'accès #3 à:
- Nom: Sophie Leroy
- Téléphone: +41 76 444 44 44

Accès restants: 2/5

Gérer mes accès: www.peps.swiss/dashboard/access-management
```

---

## 🔒 **SÉCURITÉ**

### Contrôles d'accès
1. **Authentification JWT** obligatoire
2. **Vérification propriétaire** - Seul le titulaire peut gérer SES accès
3. **Validation numéro** - Format international +41 XX XXX XX XX
4. **Rate limiting** - Max 10 attributions/révocations par heure
5. **Logs audit** - Tracer toutes les opérations

### Validation métier
- ❌ Impossible d'attribuer plus d'accès que le pack souscrit
- ❌ Impossible d'attribuer 2 fois le même numéro
- ❌ Impossible de révoquer un accès déjà révoqué
- ✅ Possible de réattribuer un accès révoqué

---

## 📊 **MÉTRIQUES À TRACKER**

1. **Taux d'utilisation** - Accès attribués / Total accès
2. **Churn des bénéficiaires** - Révocations / Attributions
3. **Temps moyen avant attribution** - Délai entre souscription et attribution
4. **Taux de réattribution** - Accès réattribués après révocation

---

## 🚀 **PLAN DE DÉVELOPPEMENT**

### Phase 1: Backend (2-3 jours)
- [ ] Créer/vérifier table `access_slots`
- [ ] Développer endpoints API (CRUD)
- [ ] Tests unitaires + intégration
- [ ] Documentation API

### Phase 2: Frontend (3-4 jours)
- [ ] Page Dashboard gestion accès
- [ ] Composants: Liste, Modal Attribuer, Modal Révoquer
- [ ] Intégration API
- [ ] Tests E2E

### Phase 3: Notifications (1-2 jours)
- [ ] Service SMS (Twilio/MessageBird)
- [ ] Templates email
- [ ] Logs audit

### Phase 4: Déploiement (1 jour)
- [ ] Migration BDD production
- [ ] Tests en staging
- [ ] Déploiement Railway
- [ ] Monitoring

**Total estimé: 7-10 jours**

---

## 📝 **NOTES IMPORTANTES**

1. **Pas de distinction Privé/Entreprise** - Même tarif, même fonctionnalités
2. **Gestion centralisée** - Seul le titulaire contrôle les accès
3. **Flexibilité maximale** - Révoquer/réattribuer à volonté
4. **UX simple** - Interface intuitive pour PME et familles
5. **Évolutivité** - Architecture prête pour 100+ accès (grandes entreprises)
