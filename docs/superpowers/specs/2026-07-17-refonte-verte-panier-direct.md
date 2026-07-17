# Refonte identité verte + achat direct sans négociation (design v2)

## Contexte

Le design "moderne électrique" (orange + volt) livré précédemment est jugé pas assez différenciant face à Jumia (qui utilise l'orange comme couleur de marque) et pas assez "pro" au niveau visuel comparé aux meilleurs du marché (Amazon, Jumia, et au-delà). Décision : rebrand complet sur le vert comme couleur unique de marque, plus un nouveau parcours d'achat direct (panier → paiement) qui ne passe pas par la négociation en chat, en complément du parcours existant (offre → acceptation → commande).

Travail découpé en 3 chantiers séquentiels, chacun validé avant de passer au suivant.

## Chantier 1 — Design system vert

### Palette

- `--brand: #00c266` (émeraude vif, saturé mais < 80%) — CTA primaires, liens, accents actifs
- `--brand-hover: #00a855`
- `--brand-ink: #ffffff` — texte sur fond brand
- `--brand-tint: #e3faee` — fonds légers (badges, sections mises en avant)
- `--ink: #0b120e` — texte principal (encre noire à peine teintée vert, jamais de noir pur `#000`)
- Suppression totale de `--volt` (lime) et de l'orange : un seul accent de marque, conformément à la charte "max 1 accent" (`ui-ux-pro-max`, `frontend-dev`).
- `--success` s'aligne sur la famille du brand (le vert EST le signal de confiance/argent protégé dans le discours produit — badge "Vendeur vérifié", statuts d'escrow, etc. réutilisent le vert plutôt qu'une couleur "succès" déconnectée de la marque).
- `--warning` (ambre) et `--error` (rouge) inchangés : déjà distincts et fonctionnels.

### Typographie

Conservée : Clash Display (titres) / General Sans (corps) / IBM Plex Mono (chiffres, codes de confirmation). Déjà moderne et distinctive — pas de raison de la changer, le rebrand est une question de couleur/texture, pas de police.

### Langage visuel (formes, ombres, élévation)

- L'ombre dure neo-brutaliste (`--shadow-pop: 6px 6px 0 var(--brand)`) est conservée mais restreinte à un usage signature ponctuel (hero, CTA principal de la landing) plutôt qu'appliquée partout — trop "flyer promo" en usage généralisé.
- Nouvelle échelle d'élévation douce et teintée vert (`--shadow-1/2/3`) pour cartes/listes/modales — ombre ambiante avec une pointe de vert plutôt qu'un gris neutre, pour un rendu "pro" cohérent avec la marque sans être criard.
- Rayons de bordure (`--radius-*`) inchangés — déjà cohérents.
- Icônes : SVG uniquement, jamais d'emoji comme icône fonctionnelle (audit à faire pendant l'implémentation si des emoji résiduels existent).

### Portée

Réapplication du nouveau système de tokens sur l'intégralité des pages existantes (Landing, Marché, ProductDetail, Messagerie, Commandes, Catalogue, Verification, Abonnement, Login/Register, pages légales/support, VendeurProfil, NotFound, Layout/Footer). Pas de changement de structure de page dans ce chantier — uniquement le langage visuel (couleur, ombre, texture). Les changements structurels (nouvelles sections, nouveaux composants) sont hors scope de ce chantier.

## Chantier 2 — Panier & achat direct

### Problème

Le modèle actuel n'autorise une `Order` que via une offre de chat acceptée (`Order.chatMessageId` non-null, unique, `OrderService.createFromOffer`). Le besoin exprimé : un acheteur doit pouvoir ajouter un produit à un panier et payer directement, sans discuter le prix avec le vendeur (achat au prix affiché). Le parcours de négociation par chat reste disponible en parallèle pour qui préfère négocier — ce n'est pas un remplacement, c'est un second parcours.

### Panier

Panier **côté client uniquement** (React Context + `localStorage`), pas de table `Cart` en base : au lancement d'une fonctionnalité panier, la persistance serveur (cross-device, cross-session longue) n'est pas un besoin exprimé, et ça évite une table + synchronisation pour un gain marginal (YAGNI). Le panier peut contenir des produits de plusieurs vendeurs différents.

### Modèle de données (migration Prisma)

```prisma
model Order {
  ...
  chatMessageId String?      @unique   // désormais optionnel — nul pour un achat direct
  chatMessage   ChatMessage? @relation(fields: [chatMessageId], references: [id])
  checkoutRef   String                  // groupe les Orders payées ensemble (voir ci-dessous)
  ...
  @@index([checkoutRef])
}
```

`checkoutRef` est systématiquement renseigné, y compris pour le parcours chat existant (dans ce cas `checkoutRef = paymentReference` de cette unique Order) — ça unifie la logique de paiement/webhook sur un seul mécanisme au lieu d'en maintenir deux en parallèle.

### Création de commande directe

Nouvelle méthode `OrderService.createDirectBatch(buyerId, items: { productId }[])` :

1. Pour chaque `productId`, vérifie que le produit existe et que son vendeur a `sellerVerificationStatus === "approuvee"` (même garde que le parcours chat — pas de vente possible pour un vendeur non vérifié, quel que soit le parcours).
2. Calcule la commission par vendeur (`computeCommission` sur le prix affiché du produit, palier du vendeur au moment de l'achat) — identique à la logique existante, juste appliquée au prix catalogue plutôt qu'au prix négocié.
3. Génère un `checkoutRef` unique (un seul, partagé par toutes les Orders créées dans cet appel) et crée une Order par produit avec ce `checkoutRef`, chacune avec son propre `paymentReference` et `confirmationCode`.
4. Retourne la liste des Orders créées + une URL de paiement GeniusPay simulée basée sur le `checkoutRef` (même simulateur mock que l'existant `checkout.geniuspay.mock/...`).

### Paiement & webhook

Le webhook GeniusPay (`billing.controller.ts::webhook`) est étendu : en plus de chercher un `Payment` par référence puis une `Order` unique par `paymentReference`, il cherche désormais toutes les `Order` partageant un `checkoutRef` égal à la référence reçue, et les marque payées en lot (`OrderService.markPaidBatch`). Le comportement existant pour un paiement d'abonnement (`Payment`) ou une commande unique issue du chat n'est pas modifié en pratique puisque son `checkoutRef` vaut son propre `paymentReference`.

### Frontend

- Bouton "Ajouter au panier" sur `ProductDetail` (à côté du bouton de chat/offre existant, pas à sa place).
- Icône panier dans le header (`Layout`) avec compteur d'articles.
- Nouvelle page `/panier` : liste des articles, groupés visuellement par vendeur, total, bouton "Payer".
- Nouvelle page `/checkout` : récapitulatif final + déclenchement du paiement simulé GeniusPay + redirection vers `/commandes` une fois "payé" (simulateur actuel ne fait pas de vrai round-trip webhook en local, comme le flux chat existant aujourd'hui — cohérence conservée).

## Chantier 3 — Pages restantes & cohérence finale

- `/panier` et `/checkout` (livrées au chantier 2, listées ici pour la vue d'ensemble du parcours).
- Audit visuel post-rebrand : `Messagerie`, `Commandes`, `ProductDetail`, `Login`/`Register` — vérifier qu'aucun résidu du thème orange/volt ne subsiste (couleurs codées en dur, captures d'écran de style, etc.).
- Tout trou restant dans le parcours utilisateur identifié pendant cet audit est comblé dans ce chantier plutôt que silencieusement ignoré.

## Hors scope (explicitement exclu, comme le doc de design v1)

- Persistance serveur du panier (cross-device) — reporté, pas de besoin exprimé.
- Vraie intégration GeniusPay (compte marchand réel, round-trip webhook réel) — le mock existant est conservé, cohérent avec le reste du produit qui est en environnement de développement.
- Modification du parcours de négociation par chat existant — il continue d'exister tel quel, en parallèle du nouveau parcours direct.
