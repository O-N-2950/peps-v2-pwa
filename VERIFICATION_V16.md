# CHECKLIST VALIDATION V16

## 1. DÉPLOIEMENT
- [ ] Copier les 8 fichiers
- [ ] Pousser sur GitHub
- [ ] Attendre le Build (Vert)
- [ ] Reset DB: `https://www.peps.swiss/api/nuke_db`
- [ ] Setup V16: `https://www.peps.swiss/api/setup_v16`

## 2. TEST PARTENAIRE
- [ ] Login: `partner.mario@peps.swiss` / `123456`
- [ ] Vérifier: Dashboard s'affiche (PAS BLANC)
- [ ] Onglet Stats: Graphique visible (barres)
- [ ] Onglet Privilèges: Créer un privilège "Test V16"
- [ ] Action: Supprimer le privilège

## 3. TEST MEMBRE
- [ ] Login: `member@peps.swiss` / `123456`
- [ ] Vérifier: Liste des privilèges (ex: Mario Pizza)
- [ ] Action: Clic "PROFITER"
- [ ] Résultat: Pluie d'étoiles + Modal Code Vert
- [ ] Action: Fermer le modal et recommencer (Illimité) -> Nouveau code
- [ ] Vérifier: Onglet Historique liste les utilisations

## 4. TEST STATISTIQUES
- [ ] Login Partner: Onglet Stats
- [ ] Vérifier: Graphique recharts s'affiche
- [ ] Vérifier: Compteurs "Total Mois" et "Aujourd'hui"
- [ ] Vérifier: Top 3 privilèges affichés

## 5. TEST SYSTÈME ILLIMITÉ
- [ ] Utiliser le même privilège 5 fois de suite
- [ ] Vérifier: 5 codes différents générés
- [ ] Vérifier: 5 entrées dans l'historique membre
- [ ] Vérifier: Compteur partenaire augmente de 5

## 6. ZÉRO RÉGRESSION
- [ ] Flash Offers V15 fonctionnent toujours
- [ ] Login fonctionne pour tous les rôles
- [ ] Pas d'erreur 500 dans les logs Railway
