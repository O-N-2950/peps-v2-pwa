# Identifiants de Test - PEP'S Application

**Date de création :** 27 janvier 2026

---

## 🧪 **Compte Membre Test - Olivier Neukomm**

### Informations de connexion
- **URL de connexion :** https://www.peps.swiss/login
- **Email :** olivier.neukomm@bluewin.ch
- **Mot de passe :** Test1234++
- **Rôle :** Member (membre)
- **User ID :** 7

### Informations personnelles
- **Prénom :** Olivier
- **Nom :** Neukomm
- **Téléphone :** 079 579 25 00
- **Adresse :** Bellevue 7
- **Code postal :** 2950
- **Ville :** Courgenay
- **Pays :** Suisse (CH)
- **Devise :** CHF

### Statut du compte
- ✅ **Compte créé avec succès**
- ✅ **Connexion testée et fonctionnelle**
- ✅ **Token JWT généré**
- ✅ **Accès à l'application membre OK**
- ⚠️ **Aucun abonnement actif** (membre gratuit pour tests)
- ⚠️ **Pas de Stripe Customer ID** (pas de paiement requis)

### Fonctionnalités testées
- ✅ Connexion via formulaire web
- ✅ Redirection vers page d'accueil après connexion
- ✅ Accès à la carte interactive des partenaires
- ✅ Visualisation des offres de packs (Membres, Familles, Partenaires, Entreprises)

---

## 🏢 **Compte Partner - WIN WIN Finance Group**

### Informations de connexion
- **URL de connexion :** https://www.peps.swiss/login
- **Dashboard Partner :** https://www.peps.swiss/partner-dashboard
- **Email :** contact@winwin.swiss
- **Mot de passe :** Cristal4you11++
- **Rôle :** Partner (partenaire)
- **User ID :** 6
- **Partner ID :** 2

### Informations du partenaire
- **Nom :** WIN WIN Finance Group
- **Catégorie :** commerce
- **Ville :** Courgenay
- **Adresse :** Bellevue 7, 2950 Courgenay, CH
- **Téléphone :** +41 32 466 30 30
- **Site web :** www.winwin.swiss
- **Statut :** active
- **Validation :** published

### Fonctionnalités testées
- ✅ Connexion via formulaire web
- ✅ Accès au Dashboard Partner
- ✅ Onglet "Stats" fonctionnel
- ✅ Onglet "Privilèges" fonctionnel
- ✅ Onglet "Push" fonctionnel
- ✅ Création de privilège testée (ID: 1)
- ✅ Affichage du compteur d'utilisations

---

## 🔧 **Routes API temporaires créées**

### 1. Réinitialisation mot de passe WIN WIN
- **Endpoint :** `/api/reset-winwin-password-temp`
- **Méthode :** GET
- **Description :** Réinitialise le mot de passe de contact@winwin.swiss à "Cristal4you11++"
- **Usage :** `curl https://www.peps.swiss/api/reset-winwin-password-temp`

### 2. Création membre test Olivier
- **Endpoint :** `/api/create-test-member-olivier`
- **Méthode :** GET
- **Description :** Crée le compte membre test pour Olivier Neukomm
- **Usage :** `curl https://www.peps.swiss/api/create-test-member-olivier`
- **Réponse :**
```json
{
  "success": true,
  "message": "Membre test Olivier Neukomm créé avec succès",
  "user_id": 7,
  "email": "olivier.neukomm@bluewin.ch",
  "password": "Test1234++"
}
```

---

## 📊 **Tests à effectuer**

### Tests Membre
- [ ] Consulter la liste complète des partenaires
- [ ] Activer un privilège chez WIN WIN Finance Group
- [ ] Tester le système de géolocalisation
- [ ] Tester les filtres de recherche
- [ ] Vérifier l'historique des privilèges utilisés
- [ ] Tester l'abonnement (si implémenté)

### Tests Partner
- [ ] Créer plusieurs privilèges
- [ ] Modifier un privilège existant
- [ ] Supprimer un privilège
- [ ] Créer une offre flash (Push)
- [ ] Consulter les statistiques détaillées
- [ ] Tester les notifications

---

## ⚠️ **Notes importantes**

1. **Membre gratuit :** Le compte Olivier Neukomm est un compte test GRATUIT sans abonnement Stripe. Il ne doit pas être facturé.

2. **Accès aux privilèges :** Vérifier si le membre peut accéder aux privilèges sans abonnement actif (logique métier à définir).

3. **Routes temporaires :** Les routes `/api/reset-winwin-password-temp` et `/api/create-test-member-olivier` sont temporaires et devraient être supprimées en production.

4. **Sécurité :** Les mots de passe sont hashés avec scrypt (32768:8:1).

5. **Base de données :** Les données sont stockées dans PostgreSQL sur Railway.

---

## 🎯 **Prochaines étapes**

1. Tester l'activation d'un privilège par le membre
2. Vérifier le compteur d'utilisations côté Partner
3. Implémenter le système d'abonnement Stripe (si nécessaire)
4. Ajouter l'icône "œil" pour afficher/masquer le mot de passe (TODO)
5. Nettoyer les routes temporaires avant la mise en production

---

**Document créé le 27 janvier 2026 par Manus**
