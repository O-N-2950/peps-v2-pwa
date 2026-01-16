PROMPT OFFICIEL À TRANSMETTRE À GEMINI
Implémentation du module Réservation PEPS – Spécification fonctionnelle complète
🎯 CONTEXTE GÉNÉRAL PEPS

PEPS est une application communautaire mettant en relation :

des utilisateurs (clients),

et des commerçants partenaires.

Le modèle PEPS repose sur 3 principes non négociables :

Tout le monde peut s’inscrire gratuitement sur PEPS

Les privilèges sont réservés exclusivement aux membres actifs PEPS (abonnement payant)

Tout commerçant partenaire PEPS DOIT obligatoirement proposer au moins un privilège exclusif

La réservation en ligne est introduite comme :

un outil de croissance

un levier d’acquisition d’utilisateurs

et non comme une barrière financière.

1️⃣ STATUTS UTILISATEURS (CLIENTS)
1. Utilisateur non inscrit

Peut :

consulter l’application

voir les commerçants partenaires

voir les prestations et privilèges

Ne peut PAS :

réserver

bénéficier de privilèges

2. Utilisateur inscrit gratuit (compte PEPS)

Peut :

réserver un rendez-vous chez un commerçant partenaire

consulter son historique de réservations

Ne peut PAS :

bénéficier des privilèges PEPS

Doit voir clairement :

qu’un privilège existe

qu’il est réservé aux membres actifs

👉 Inscription gratuite obligatoire pour réserver
👉 Aucun abonnement requis pour réserver

3. Membre actif PEPS (abonnement payé)

Peut :

réserver

bénéficier automatiquement du privilège exclusif du commerçant partenaire

Doit être identifié clairement comme “Membre actif PEPS”

2️⃣ RÈGLES FONDAMENTALES – PRÉCISION CRITIQUE

Réservation ≠ privilège

Le privilège :

est obligatoire pour chaque commerçant partenaire

est exclusivement réservé aux membres actifs PEPS

Aucun commerçant partenaire ne peut :

être visible comme “partenaire actif”

activer la réservation
sans avoir défini un privilège valide

⚠️ Bloquer techniquement le statut “partenaire actif” si aucun privilège n’est défini.

3️⃣ STATUT COMMERÇANT PARTENAIRE
Principe fondamental

👉 PEPS est gratuit pour les commerçants partenaires.

Contrepartie obligatoire

Tout commerçant partenaire PEPS doit proposer au minimum un privilège exclusif pour les membres actifs PEPS.

Règles

Un commerçant partenaire :

DOIT :

définir au moins un privilège exclusif

PEUT :

activer la réservation en ligne

NE PEUT PAS :

être listé sans privilège

bénéficier de la visibilité PEPS sans privilège

4️⃣ MODULE “RÉSERVATION” – POSITIONNEMENT PRODUIT
Décision stratégique

La réservation est offerte au lancement

Elle est :

optionnelle pour le commerçant

gratuite

pensée comme un moteur de croissance

Aucune facturation n’est activée à ce stade

5️⃣ GESTION DES PRESTATIONS (OBLIGATOIRE)

Chaque commerçant partenaire doit pouvoir gérer une liste de prestations réservables, propre à son établissement.

Exemples

Coupe cheveux

Barbe

Coupe + barbe

Massage 60 minutes

Massage 90 minutes

Soin du visage

Règles techniques

Implémenter une entité services liée à partner_id avec au minimum :

name

duration_minutes

price_chf (prix indicatif)

description (optionnel)

is_active

Règles fonctionnelles

Le flux de réservation commence obligatoirement par le choix d’une prestation

La durée de la prestation détermine :

la durée du rendez-vous

les créneaux disponibles

Le service_id doit appartenir au même partner_id que le rendez-vous (validation serveur obligatoire)

6️⃣ AGENDA PAR COMMERÇANT + TEMPS RÉEL (ANTI DOUBLE BOOKING)

Chaque commerçant partenaire dispose de son agenda indépendant.

Calcul des disponibilités

Les créneaux sont calculés à partir :

des règles d’ouverture (jours / horaires)

des exceptions (jours fermés, vacances)

des rendez-vous existants pour ce partner_id
reminds.

Garantie anti double booking

Au moment de la confirmation :

le backend revalide la disponibilité

empêche tout chevauchement de rendez-vous

👉 Implémenter une garantie transactionnelle :

idéalement via une contrainte PostgreSQL de non-chevauchement (partner_id + interval start_at/end_at)

ou à défaut via transaction + verrouillage + vérification avant insertion

Comportement UX

Si un créneau est pris entre affichage et confirmation :

afficher un message clair

forcer le rafraîchissement des créneaux

7️⃣ RÈGLES CÔTÉ RÉSERVATION (CLIENT)

Pour réserver :

inscription gratuite PEPS obligatoire

abonnement PEPS NON requis

Lors de la réservation :

membre actif → privilège appliqué

non-membre → réservation standard

UX obligatoire

Badge visible :

“Privilège PEPS appliqué”

ou “Réservation standard”

Message non bloquant :

“Ce privilège est réservé aux membres actifs PEPS.”

⚠️ Ne jamais bloquer une réservation pour forcer un abonnement.

8️⃣ NOTIFICATIONS

Confirmation + rappels envoyés :

par email

par push PEPS

Pas de SMS (volontairement exclu)

9️⃣ PRÉPARATION À L’ÉVOLUTION FUTURE (SANS L’ACTIVER)

Même si la réservation est gratuite au lancement, prévoir :

un flag booking_enabled

un flag booking_plan = free | pro

une architecture compatible Stripe (abonnement futur)

du tracking par commerçant :

nombre de réservations

utilisateurs générés

taux membres actifs / non actifs

⚠️ Aucune facturation n’est activée à ce stade.

1️⃣0️⃣ UX / TECH – POINTS DE VIGILANCE

Inscription rapide et fluide

Réservation simple (pas de tunnel long)

Privilège toujours visible

Historique des rendez-vous (client + commerçant)

Politique d’annulation visible

Fuseau horaire par défaut : Europe/Zurich

🧠 PHILOSOPHIE PEPS (NON NÉGOCIABLE)

Le privilège est la clé du modèle PEPS

La réservation est un accélérateur

La valeur précède la monétisation

L’abonnement est une conséquence de l’usage, jamais une contrainte

✅ RÉSUMÉ FINAL

Tout utilisateur peut s’inscrire gratuitement et réserver sur PEPS ; tout commerçant partenaire doit obligatoirement offrir un privilège exclusif aux membres actifs ; chaque commerçant dispose de son propre agenda de réservation en temps réel avec prestations définies ; la réservation est gratuite au lancement et pensée comme un moteur de croissance durable pour l’écosystème PEPS.