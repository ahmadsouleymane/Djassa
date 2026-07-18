# Plan d'action SEO — Djassa

## 1. Correctifs appliqués dans cette session

- [x] `Marche.tsx` : titre et meta description enrichis (page la plus prioritaire du sitemap).
- [x] `index.html` : ajout du schema `WebSite` + `SearchAction` (éligibilité sitelinks searchbox).
- [x] `ProductDetail.tsx` : ajout du schema `BreadcrumbList` (Accueil > Marché > Catégorie > Produit).
- [x] `ProductDetail.tsx` : alt text descriptif sur la galerie de miniatures (page publique indexable).

## 2. À faire avant la mise en prod (bloquant pour un bon référencement)

- [x] **Domaine mis à jour** : tous les placeholders utilisent maintenant `https://djassa.net` (le nom de domaine confirmé par l'utilisateur), dans `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, `frontend/public/llms.txt`, `index.html` (schema WebSite/Organization) et les emails de contact (`support@djassa.net`).
- [ ] Si l'API tourne sur un sous-domaine différent de `api.djassa.net`, mettre à jour `FRONTEND_URL` côté backend et la seconde ligne `Sitemap:` de `robots.txt` en conséquence.
- [ ] **Soumettre le site à Google Search Console** et Bing Webmaster Tools dès le déploiement ; soumettre `sitemap.xml` et `sitemap-products.xml`.
- [ ] **Fournir une vraie image `og:image`** (1200×630, JPG/PNG) — le favicon SVG actuel ne s'affiche pas correctement sur Facebook/LinkedIn. Nécessite un asset de marque, hors de ce que je peux fabriquer moi-même de façon crédible.
- [ ] **Lancer un audit PageSpeed Insights** sur l'URL de prod réelle pour mesurer LCP/INP/CLS et confirmer que le code-splitting déjà fait cette session suffit.

## 3. Recommandations stratégiques (moyen terme, hors urgence)

- [ ] **Prerendering ou SSR ciblé** sur les pages publiques à fort trafic (`/`, `/marche`, `/produit/:id`, pages statiques) pour lever le principal risque structurel identifié (SPA 100% client-side). Ne pas migrer tout le site — cibler seulement les routes publiques/indexables.
- [ ] **Contenu éditorial longue traîne** : un espace guides/blog ("comment vendre en ligne en Côte d'Ivoire", "acheter en toute sécurité en ligne") pour capter du trafic informationnel et renforcer l'E-E-A-T.
- [ ] **Titre/description dynamiques par catégorie** sur `/marche?category=...` si un jour ces vues doivent devenir indexables individuellement (nécessiterait des URLs dédiées par catégorie, pas juste un paramètre de requête).

## 4. Explicitement à ne PAS faire

- ❌ Schema `FAQPage` sur `FAQ.tsx` — restreint aux sites gouvernementaux/santé depuis août 2023, Google l'ignorera et ça n'apporte rien.
- ❌ Schema `HowTo` — rich results supprimés depuis septembre 2023, aucun intérêt.
- ❌ Migration SSR complète en urgence — trop risqué pour un gain marginal à court terme ; le prerendering ciblé est le bon compromis.

## 5. Artefacts générés

- `FULL-AUDIT-REPORT.md` (racine du repo) — rapport détaillé.
- `ACTION-PLAN.md` (ce fichier).
