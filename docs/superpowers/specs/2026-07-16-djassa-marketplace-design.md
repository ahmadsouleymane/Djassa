# DJASSA — Marketplace de confiance (design v1)

## Contexte

La deuxième itération du projet (précédemment "Relance"/"DJASSA" dans `~/Desktop/relance`) repart sur un repo neuf. Le constat de départ reste le même : plus de 50% de l'e-commerce en Côte d'Ivoire (et en Afrique plus largement) passe par les réseaux sociaux (Facebook, WhatsApp, TikTok), où vendeurs et acheteurs échangent un numéro de téléphone pour conclure la vente. Ce mode d'échange souffre d'un déficit de confiance structurel :

- Les acheteurs craignent de perdre leur argent sans recevoir le produit.
- Les vendeurs craignent d'expédier sans garantie d'être payés.

DJASSA vise à combler ce déficit sans forcer un changement d'habitude radical : les vendeurs continuent d'exister sur les réseaux sociaux, DJASSA devient la couche de confiance et de paiement qu'ils branchent sur leur activité existante.

## Positionnement

- Marketplace **généraliste** (tout produit, pas de niche imposée) au lancement.
- Périmètre géographique : **Côte d'Ivoire uniquement** au lancement (pas d'extension régionale immédiate).
- Message central : *« Vends et achète comme avant, mais l'argent reste protégé jusqu'à la réception. »*
- Différenciateur face à Facebook Marketplace / groupes WhatsApp : ceux-ci n'offrent aucun signal de confiance vérifiable. DJASSA en offre plusieurs, empilés (voir ci-dessous).

## Système de confiance

Le système de confiance est composé de quatre couches cumulatives, chacune renforçant la précédente :

### 1. Escrow (paiement séquestre)

L'argent du paiement reste bloqué sur le compte de la plateforme dès la commande. Il n'est libéré au vendeur que lorsque l'acheteur confirme la réception, ou automatiquement après un délai de silence de l'acheteur (protège le vendeur d'un acheteur injoignable). Symétriquement, si le vendeur n'expédie jamais, un délai déclenche un remboursement automatique (protège l'acheteur). Deux délais indépendants, chacun protégeant une partie du silence de l'autre — mécanique reprise du modèle Order existant (`en_attente_paiement -> paye -> expedie -> confirme`, avec bascule possible vers `en_litige` puis résolution manuelle admin).

### 2. Vérification d'identité vendeur

Avant de pouvoir vendre, un vendeur doit soumettre une pièce d'identité, revue manuellement par un administrateur. C'est un gate obligatoire : pas de vente possible sans vérification approuvée. Première barrière contre l'anonymat qui permet l'arnaque.

### 3. Avis publics post-commande

Après une commande réellement confirmée (`Order.status = confirme`), l'acheteur peut laisser une note (étoiles) et un avis textuel, visible sur le profil du vendeur. L'avis est **lié à une commande réelle** (pas de soumission libre) — ce lien direct élimine la fraude aux faux avis achetés, puisqu'il faut avoir réellement transigé pour pouvoir noter.

### 4. Score de confiance composite

Un score visible, affiché en badge sur le profil et les annonces du vendeur (ex : « Vendeur Fiable — 92/100 »), calculé à partir de plusieurs signaux :

- Taux de litiges (poids fort — signal négatif direct)
- Délai moyen d'expédition (rapidité perçue = sérieux)
- Ancienneté du compte
- Taux de réponse dans le chat

C'est le principal argument marketing différenciant : là où Facebook Marketplace n'offre aucun signal chiffré, DJASSA en donne un, public et vérifiable par construction (dérivé de transactions réelles, pas déclaratif).

**Scope V1** : le score est un affichage seul. Il ne modifie pas encore automatiquement les délais d'escrow ni les autorisations — ça reste un levier manuel pour l'équipe (un score bas peut faire l'objet d'une revue prioritaire par l'équipe litiges), pas un mécanisme automatisé. L'automatisation (ex : délais assouplis pour bon score) est explicitement reportée en V2 pour garder le système simple à lancer.

## Modèle économique

Deux paliers vendeur, pas plus (choix volontaire pour rester simple à expliquer au lancement) :

| Palier | Coût | Commission par vente | Extra |
|---|---|---|---|
| Standard (défaut) | Gratuit | 5% | Aucun |
| Pro (abonnement) | Abonnement mensuel | 3% | Badge "Pro" visible sur le profil et les annonces, mise en avant dans les résultats de recherche, statistiques de vente avancées, support litige prioritaire |

Logique : le palier gratuit élimine toute friction à l'inscription — un vendeur teste sans risque. Le palier Pro devient intéressant de lui-même une fois qu'un vendeur atteint un volume de ventes suffisant pour que l'écart de commission (5% → 3%) dépasse le coût de l'abonnement — c'est un upsell qui se déclenche naturellement avec la traction, pas un choix forcé à l'inscription.

L'abonnement Pro reste **prépayé et renouvelé manuellement**, sans débit automatique récurrent — GeniusPay n'offre pas de prélèvement récurrent natif (contrainte déjà rencontrée sur l'itération précédente du projet).

## Stratégie marketing (go-to-market)

Amorçage des deux côtés du marché **simultanément**, pas de séquence stricte acheteurs-puis-vendeurs ou l'inverse :

- **Démarchage direct** : l'équipe identifie et approche personnellement des vendeurs déjà actifs sur Instagram/TikTok/Facebook en Côte d'Ivoire (mode, électronique, cosmétique), avec un onboarding assisté (aide à la mise en ligne des produits, explication de la mécanique d'escrow). Objectif : un catalogue jamais vide dès le lancement public.
- **Contenu organique** : comptes Instagram/TikTok DJASSA — témoignages d'arnaques évitées grâce à l'escrow, explication pédagogique de la mécanique de confiance, mise en avant des vendeurs les mieux notés (le score composite fournit un contenu naturel et gratuit à publier).
- **Publicité payante ciblée** : Meta Ads et TikTok Ads, ciblage Abidjan (extension aux villes secondaires ensuite), retargeting des visiteurs de la marketplace n'ayant pas finalisé d'achat.
- **Parrainage (referral)** : vendeur → vendeur et acheteur → acheteur, avec bonus (réduction de commission ou crédit), pour accélérer la densité offre/demande sans dépendre uniquement de la publicité payante.

## Roadmap et scope V1

### Inclus en V1

- Escrow + résolution manuelle des litiges
- Vérification d'identité vendeur (gate obligatoire)
- Chat intégré acheteur/vendeur
- Avis + score de confiance composite (affichage seul, pas de levier automatique)
- Commission 5% (standard) / 3% + fonctionnalités (Pro, abonnement)
- Côte d'Ivoire uniquement, tout produit accepté

### Explicitement exclu de V1 (à ne pas ajouter sans revisiter ce document)

- Score composite influençant automatiquement les délais d'escrow (`shipBy`/`confirmBy`) — reporté en V2, la V1 garde des délais fixes et simples.
- Extension géographique hors Côte d'Ivoire — V2 ou plus tard.
- Débit automatique récurrent pour l'abonnement Pro — GeniusPay ne le permet pas nativement ; reste un renouvellement manuel prépayé.
- Logistique/livraison intégrée — DJASSA reste centré sur la transaction et la sécurisation de l'argent ; l'acheminement physique reste géré entre les parties, comme sur l'itération précédente du projet.
- Programme d'ambassadeurs/influenceurs formalisé — traité en V2, une fois la traction initiale confirmée.

## Notes de continuité avec l'itération précédente

Ce projet repart sur un repo neuf (`~/Desktop/DJASSA`, vide au démarrage), distinct de l'ancien code encore présent dans `~/Desktop/relance` (Node/Express + Mongoose, React/Vite, avec un moteur d'escrow, une vérification vendeur et un chat déjà implémentés sous le nom "Relance"/"DJASSA"). Ce document ne prescrit pas de réutiliser ce code tel quel — l'intention explicite est de repartir sur une base saine — mais les mécaniques métier validées là-bas (state machine de commande, double délai d'escrow, vérification manuelle vendeur, séparation chat marketplace / WhatsApp) constituent une référence de comportement à égaler ou améliorer, pas à redécouvrir depuis zéro.
