# 📨 MESSAGE POUR GEMINI : GRILLE TARIFAIRE FINALE + DASHBOARDS

---

## 🎯 CONTEXTE ACTUEL

### ✅ Ce qui fonctionne (Backend V4)
- Base de données V4 opérationnelle
- Routes API `/api/nuke_db` et `/api/setup_v4` testées avec succès
- Système de parrainage implémenté
- Sécurité anti-partage (2 devices max) implémentée
- Compte démo créé : `company@peps.swiss` / `123456`

### ❌ Ce qui doit être corrigé

#### 1️⃣ **Grille tarifaire incorrecte**
Tu as créé 23 packs au lieu de 27, et les prix ne correspondent pas à notre grille officielle.

#### 2️⃣ **Dashboard manquant pour les familles**
Actuellement, seules les entreprises ont un dashboard. Les familles (1-9 accès) doivent aussi pouvoir gérer leurs membres.

#### 3️⃣ **Frontend ne se déploie pas sur Railway**
Railway ne rebuild pas le frontend malgré les changements. Nous avons besoin de ta solution.

---

## 📊 GRILLE TARIFAIRE OFFICIELLE (27 PACKS)

**IMPORTANT : Utilise EXACTEMENT ces prix (CHF = EUR) :**

| Accès | Prix Annuel (CHF/EUR) | Catégorie | Dashboard | Early Bird |
|-------|-----------------------|-----------|-----------|------------|
| 1     | 49                    | Individual | Basique   | ❌ Non     |
| 2     | 89                    | Family     | Basique   | ❌ Non     |
| 3     | 129                   | Family     | Basique   | ❌ Non     |
| 4     | 164                   | Family     | Basique   | ❌ Non     |
| 5     | 199                   | Family     | Basique   | ❌ Non     |
| 6     | 245                   | Family     | Basique   | ❌ Non     |
| 7     | 289                   | Family     | Basique   | ❌ Non     |
| 8     | 330                   | Family     | Basique   | ❌ Non     |
| 9     | 360                   | Family     | Basique   | ❌ Non     |
| 10    | 390                   | Business   | Pro       | ✅ -20%    |
| 15    | 550                   | Business   | Pro       | ✅ -20%    |
| 20    | 700                   | Business   | Pro       | ✅ -20%    |
| 25    | 850                   | Business   | Pro       | ✅ -20%    |
| 30    | 1000                  | Business   | Pro       | ✅ -20%    |
| 40    | 1274                  | Business   | Pro       | ✅ -20%    |
| 50    | 1590                  | Business   | Pro       | ✅ -30%    |
| 75    | 2390                  | Business   | Pro       | ✅ -30%    |
| 100   | 3185                  | Business   | Pro       | ✅ -40%    |
| 150   | 4410                  | Business   | Pro       | ✅ -40%    |
| 200   | 5880                  | Business   | Pro       | ✅ -40%    |
| 300   | 8820                  | Business   | Pro       | ✅ -40%    |
| 400   | 11760                 | Business   | Pro       | ✅ -40%    |
| 500   | 14700                 | Business   | Pro       | ✅ -40%    |
| 750   | 22050                 | Business   | Pro       | ✅ -40%    |
| 1000  | 29400                 | Business   | Pro       | ✅ -40%    |
| 2500  | 61250                 | Business   | Pro       | ✅ -40%    |
| 5000  | 110250                | Business   | Pro       | ✅ -40%    |

---

## 🎁 OFFRE EARLY BIRD (Lancement uniquement)

### **Principe**
Réduction progressive pour les packs 10+ accès (entreprises, PME, associations).

### **Réductions par palier**
```
10-49 accès  → -20% (ex: 10 accès = 312 CHF au lieu de 390 CHF)
50-99 accès  → -30% (ex: 50 accès = 1'113 CHF au lieu de 1'590 CHF)
100+ accès   → -40% (ex: 100 accès = 1'911 CHF au lieu de 3'185 CHF)
```

### **Conditions**
- ✅ Valable jusqu'au **30 juin 2025**
- ✅ Engagement **1 an minimum**
- ✅ Réservé aux **packs 10+ accès**

### **Exemples concrets**

| Pack | Prix normal | Early Bird | Économie |
|------|-------------|------------|----------|
| 10 accès | 390 CHF | 312 CHF | -78 CHF |
| 20 accès | 700 CHF | 560 CHF | -140 CHF |
| 50 accès | 1'590 CHF | 1'113 CHF | -477 CHF |
| 100 accès | 3'185 CHF | 1'911 CHF | -1'274 CHF |
| 500 accès | 14'700 CHF | 8'820 CHF | -5'880 CHF |

---

## 🖥️ DASHBOARDS : FONCTIONNALITÉS PAR TYPE

### **Dashboard Basique (1-9 accès)**

**Pour qui ?** Familles, petits groupes

**Fonctionnalités :**
- ✅ Voir les membres (liste avec email + nom)
- ✅ Ajouter un membre (email + nom)
- ✅ Retirer un membre
- ✅ Voir l'utilisation (qui a utilisé quoi, quand)
- ✅ Changer le propriétaire du pack

**Interface :**
```
👨‍👩‍👧‍👦 Famille Dupont
Pack : 5 accès (5/5 utilisés)

Membres actifs :
┌─────────────────────────────────────────┐
│ Jean Dupont (Propriétaire)              │
│ jean@gmail.com                          │
│ Dernière utilisation : Hier 18:30       │
│ [Retirer]                               │
├─────────────────────────────────────────┤
│ Marie Dupont                            │
│ marie@gmail.com                         │
│ Dernière utilisation : Aujourd'hui 12:15│
│ [Retirer]                               │
└─────────────────────────────────────────┘

[+ Ajouter un membre]
```

---

### **Dashboard Pro (10+ accès)**

**Pour qui ?** Entreprises, PME, associations

**Fonctionnalités :**
- ✅ Tout ce que le Dashboard Basique a
- ✅ **Facturation avec TVA** (télécharger facture PDF)
- ✅ **Analytics avancées** :
  - Taux d'utilisation (% d'employés actifs)
  - Top offres utilisées
  - Économies réalisées (total des rabais)
- ✅ **Support prioritaire** (réponse sous 24h)
- ✅ **Export CSV** (liste des employés)

**Interface :**
```
🏢 TechCorp SA
Pack : 50 accès (12/50 utilisés)

📊 Analytics :
- Taux d'utilisation : 24% (12/50)
- Économies réalisées : 1'245 CHF ce mois
- Top offre : Restaurant Chez Mario (45 utilisations)

Employés actifs :
┌─────────────────────────────────────────┐
│ Jean Dupont (Admin)                     │
│ jean@techcorp.ch                        │
│ Dernière utilisation : Hier 18:30       │
│ [Retirer] [Changer rôle]               │
└─────────────────────────────────────────┘

[+ Inviter un employé] [Exporter CSV] [Facturation]
```

---

## 🔧 CE QUE NOUS DEMANDONS

### **1️⃣ Corriger la grille tarifaire dans `app.py`**

Remplace la fonction `setup_v4()` pour créer les **27 packs EXACTS** avec les vrais prix.

**Code attendu :**
```python
@app.route('/api/setup_v4', methods=['GET'])
def setup_v4():
    try:
        with app.app_context():
            db.drop_all()
            db.create_all()
            logs = []
            
            # 27 PACKS OFFICIELS
            packs_data = [
                ("Solo 1 an", "Individual", 1, 49),
                ("Couple 1 an", "Family", 2, 89),
                ("Famille 3", "Family", 3, 129),
                ("Famille 4", "Family", 4, 164),
                ("Famille 5", "Family", 5, 199),
                ("Famille 6", "Family", 6, 245),
                ("Famille 7", "Family", 7, 289),
                ("Famille 8", "Family", 8, 330),
                ("Famille 9", "Family", 9, 360),
                ("PME 10", "Business", 10, 390),
                ("PME 15", "Business", 15, 550),
                ("PME 20", "Business", 20, 700),
                ("PME 25", "Business", 25, 850),
                ("PME 30", "Business", 30, 1000),
                ("PME 40", "Business", 40, 1274),
                ("PME 50", "Business", 50, 1590),
                ("PME 75", "Business", 75, 2390),
                ("PME 100", "Business", 100, 3185),
                ("Corp 150", "Business", 150, 4410),
                ("Corp 200", "Business", 200, 5880),
                ("Corp 300", "Business", 300, 8820),
                ("Corp 400", "Business", 400, 11760),
                ("Corp 500", "Business", 500, 14700),
                ("Corp 750", "Business", 750, 22050),
                ("Corp 1000", "Business", 1000, 29400),
                ("Corp 2500", "Business", 2500, 61250),
                ("Corp 5000", "Business", 5000, 110250)
            ]
            for name, cat, acc, price in packs_data:
                db.session.add(Pack(name=name, category=cat, access_count=acc, price_chf=price, price_eur=price))
            
            logs.append("✅ 27 Packs injectés")
            
            # ... reste du code (comptes démo, etc.)
            
            db.session.commit()
            return jsonify({"status": "SUCCESS", "logs": logs})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "ERROR", "error": str(e)}), 500
```

---

### **2️⃣ Créer le Dashboard Basique (FamilyDashboard.jsx)**

**Fichier :** `/frontend/src/components/FamilyDashboard.jsx`

**Fonctionnalités :**
- Afficher le nom du pack et le nombre d'accès utilisés
- Lister les membres (email, nom, dernière utilisation)
- Bouton "Ajouter un membre" (modal avec formulaire)
- Bouton "Retirer" pour chaque membre

**Design :** Utilise le Design System PEP's (tailwind.config.js)

---

### **3️⃣ Améliorer le Dashboard Pro (CompanyDashboard.jsx)**

**Fichier :** `/frontend/src/components/CompanyDashboard.jsx`

**Ajouter :**
- Section Analytics (taux d'utilisation, top offres, économies)
- Bouton "Télécharger facture PDF"
- Bouton "Exporter CSV"
- Badge "Support Prioritaire"

---

### **4️⃣ Créer la route `/api/family/info`**

**Similaire à `/api/company/info` mais pour les familles (1-9 accès)**

**Retour JSON :**
```json
{
  "name": "Famille Dupont",
  "pack": "Famille 5",
  "used": 5,
  "total": 5,
  "members": [
    {"email": "jean@gmail.com", "name": "Jean Dupont", "last_used": "2025-12-18 18:30"},
    {"email": "marie@gmail.com", "name": "Marie Dupont", "last_used": "2025-12-19 12:15"}
  ]
}
```

---

### **5️⃣ Créer la route `/api/family/add-member`**

**Similaire à `/api/company/add-member` mais pour les familles**

**Paramètres :**
```json
{
  "email": "lucas@gmail.com",
  "name": "Lucas Dupont"
}
```

**Logique :**
- Vérifier que le pack n'est pas plein (used < total)
- Créer un compte avec mot de passe par défaut `welcome123`
- Envoyer un email d'invitation

---

### **6️⃣ Résoudre le problème de déploiement Railway**

**Problème :** Railway ne rebuild pas le frontend malgré les changements.

**Question :** Comment forcer Railway à rebuild le frontend à chaque push sans commiter le dossier `dist/` ?

**Configuration actuelle (nixpacks.toml) :**
```toml
[phases.setup]
nixPkgs = ["python3", "nodejs", "npm"]

[phases.install]
cmds = [
  "cd frontend && npm install",
  "cd backend && pip install -r requirements.txt"
]

[phases.build]
cmds = ["cd frontend && npm run build"]

[start]
cmd = "cd backend && gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT app:app"
```

**Que faut-il modifier ?**

---

## 📋 RÉCAPITULATIF DES FICHIERS ATTENDUS

1. ✅ `/backend/app.py` (corrigé avec 27 packs)
2. ✅ `/frontend/src/components/FamilyDashboard.jsx` (nouveau)
3. ✅ `/frontend/src/components/CompanyDashboard.jsx` (amélioré)
4. ✅ `/frontend/src/App.jsx` (ajouter route `/family`)
5. ✅ `nixpacks.toml` (corrigé pour forcer rebuild)

---

## 🙏 MERCI GEMINI !

Nous avons besoin de ton expertise pour :
- Corriger la grille tarifaire avec les VRAIS prix
- Créer le dashboard famille (1-9 accès)
- Améliorer le dashboard entreprise (10+ accès)
- Résoudre le problème de déploiement Railway

**Fournis-nous le code complet pour chaque fichier ! 🚀**
