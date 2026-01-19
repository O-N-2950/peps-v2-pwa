# Checklist V15 - Push & Geo

## 1. Déploiement
- [ ] Copier les 11 fichiers
- [ ] Push GitHub
- [ ] Ajouter variables Railway `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`
- [ ] Reset DB: `/api/nuke_db`
- [ ] Setup V15: `/api/setup_v15`

## 2. Test Push
- [ ] Login Member sur Mobile (Autoriser GPS + Push)
- [ ] Login Partner sur PC
- [ ] Partner: Créer Offre "Test Flash" (-50%, 5km)
- [ ] Member: Vérifier réception Notification

## 3. Test Claim
- [ ] Member: Voir l'offre dans la liste
- [ ] Click "Je prends" -> QR Code
- [ ] Vérifier décrémentation stock

LANCEZ LA V15 !
1. Copiez les 11 fichiers.
2. Poussez sur GitHub.
3. Ajoutez les clés VAPID dans Railway.
4. Lancez les URLs de reset/setup.
