# Audit SEO — Djassa (pré-lancement)

**Date** : 2026-07-18
**Portée** : Codebase complet (`frontend/`), le site n'est pas encore déployé publiquement — audit basé sur le code source, pas sur un crawl live.
**Méthode** : Lecture directe du code (index.html, hooks de meta, routes, schéma JSON-LD, images) — les outils de crawl live (PageSpeed Insights, Search Console, redirect checker) sont inapplicables tant qu'il n'y a pas d'URL publique.

## Limitations d'environnement

- Pas d'URL live → impossible de mesurer les Core Web Vitals réels (LCP/INP/CLS), le TTFB, ou de vérifier robots.txt/sitemap.xml tels que servis en production.
- Pas d'accès Search Console (site non indexé).
- Recommandation : relancer un audit `seo audit <url>` complet dès la mise en ligne pour valider CWV, indexation réelle, et hreflang si multi-langue un jour.

---

## Résumé exécutif

Le site a de bonnes fondations techniques (SPA React propre, méta dynamique par page déjà en place via `usePageTitle`, JSON-LD Product déjà présent, sitemap + robots.txt déjà rédigés, URLs françaises lisibles). Les vrais manques sont ciblés :

1. **La page la plus stratégique (`/marche`) n'a ni description ni titre différenciant** — c'est la page prioritaire du sitemap (priority 1.0, changefreq hourly) et elle n'a quasiment aucune méta SEO.
2. **Aucun schema `WebSite`/`SearchAction`** sur la page d'accueil (perte d'éligibilité à la sitelinks searchbox Google).
3. **Aucun `BreadcrumbList`** sur les pages produit/vendeur (fil d'Ariane absent du SERP).
4. **SPA 100% client-side, sans SSR ni prerendering** — risque structurel sur l'indexation rapide et les crawlers autres que Googlebot (réseaux sociaux, Bing dans une moindre mesure).
5. **`og:image` pointe vers le favicon SVG**, pas une image 1200×630 dédiée au partage social.

Aucun blocage critique (pas de noindex égaré, pas de robots.txt bloquant, pas de contenu dupliqué détecté, structure d'URL propre).

---

## Findings — Technique

### 🔴 Critique
| Finding | Preuve | Impact | Fix |
|---|---|---|---|
| SPA pure côté client, aucun SSR/prerendering | `vite.config.ts` : seulement `react()` + `tailwindcss()`, aucun plugin sitemap/SSG/prerender ; `package.json` sans `vite-plugin-prerender`/`vite-ssg` | Élevé — le HTML initial est vide, l'indexation dépend entièrement du rendu JS différé de Googlebot (délai, budget crawl), et les autres bots (partage social, certains crawlers IA) ne voient rien | Ne pas re-architecturer maintenant (risque trop élevé en fin de sprint). À moyen terme : envisager un prerendering statique des pages publiques à fort trafic (`/`, `/marche`, `/produit/:id`, pages statiques) via `vite-plugin-prerender` ou une migration ciblée vers Next.js/Remix pour ces routes uniquement. |

### ⚠️ Avertissement
| Finding | Preuve | Impact | Fix |
|---|---|---|---|
| `/marche` sans meta description ni titre différenciant | `Marche.tsx:34` — `usePageTitle("Marché")` sans options | Moyen-élevé — c'est la page priority 1.0 du sitemap, actuellement la moins optimisée on-page | **Corrigé dans cette session** (voir Action Plan) |
| Pas de schema `WebSite` + `SearchAction` | absent de `index.html` | Moyen — perte d'éligibilité à la sitelinks searchbox | **Corrigé dans cette session** |
| Pas de `BreadcrumbList` sur `/produit/:id` | absent de `ProductDetail.tsx` | Moyen — pas de fil d'Ariane enrichi dans les résultats Google | **Corrigé dans cette session** |
| `og:image` = favicon SVG | `index.html:21` `<meta property="og:image" content="/favicon.svg" />` | Moyen — rendu de partage social dégradé (Facebook/LinkedIn attendent un raster ~1200×630) | Nécessite un vrai visuel de marque — je ne peux pas fabriquer une image produit/marque crédible ; à fournir par l'équipe design. |
| Sitemap/robots.txt avec domaines placeholder | ~~`robots.txt`, `sitemap.xml`, `sitemap-products.xml` référençaient `www.jassa.ci`~~ | — | **Corrigé** — tout utilise maintenant `djassa.net`, le domaine confirmé. |
| CWV non mesurables pré-lancement | pas d'URL live | — | Lancer PageSpeed Insights + Search Console dès le déploiement. Signaux favorables déjà en place : code-splitting des routes protégées, compression gzip backend, `loading="lazy"` sur les images produit, preconnect fonts. |

### ✅ Conforme
- `robots.txt` : pas de blocage accidentel des pages publiques, disallow cohérent sur les pages privées (`/connexion`, `/messagerie`, `/commandes`, `/catalogue`, `/verification`, `/abonnement`, `/admin`), référence au sitemap.
- `sitemap.xml` statique + `sitemap-products.xml` dynamique (produits + profils vendeurs vérifiés, généré côté API) — ajouté cette session.
- URLs lisibles, en français, minuscules, sans paramètres inutiles (`/comment-ca-marche`, `/politique-de-confidentialite`, `/produit/:id`…).
- `<html lang="fr">` présent (`index.html:2`).
- Canonical dynamique posé sur chaque page (`usePageTitle` → `upsertCanonical`).
- HTTPS/HSTS géré par Vercel (frontend) et `helmet()` côté API (backend) — aucune action requise.
- Hreflang non applicable (site mono-langue fr-CI) — correctement absent, pas à ajouter.

---

## Findings — On-page

| Finding | Preuve | Impact | Statut |
|---|---|---|---|
| Titre `/marche` non différenciant ("Marché \| Djassa") | `Marche.tsx:34` | Moyen | **Corrigé** — titre et description enrichis |
| 34/34 pages appellent `usePageTitle` (title + canonical systématiques) | audit exhaustif des pages | — | ✅ Bon socle |
| H1 unique par page rendue (les doublons apparents sur `ForgotPassword`, `ResetPassword`, `Panier` sont des branches conditionnelles mutuellement exclusives, jamais deux H1 simultanés) | ex. `ForgotPassword.tsx:44` / `:58` | — | ✅ Pas un vrai problème |
| Alt text manquant sur la galerie miniatures de `ProductDetail.tsx` (page publique indexable) | `ProductDetail.tsx:233` `alt=""` | Faible-moyen (SEO images + accessibilité sur une page publique) | **Corrigé** |
| Alt text vide sur images en pages privées (catalogue vendeur, checkout, messagerie, admin, formulaire produit) | `ProductForm.tsx:352`, `Catalogue.tsx:103`, `Checkout.tsx:107`, `Messagerie.tsx:49`, `admin/AdminDisputes.tsx:61`, `vendeur/VendeurDashboard.tsx:217` | Faible — pages non indexables (`Disallow` dans robots.txt) | Accessibilité à améliorer un jour, hors périmètre SEO prioritaire |
| Pas de meta description dynamique par catégorie/recherche sur `/marche?q=...` | `Marche.tsx` | Faible | Non prioritaire — ces vues ne sont pas destinées à être indexées séparément (même URL de base) |

---

## Findings — Contenu / E-E-A-T

- Signaux de confiance déjà forts dans le copy produit : séquestre, vendeurs vérifiés par pièce d'identité, protection acheteur — bons signaux E-E-A-T/trustworthiness pour un marketplace.
- Pas de contenu éditorial (blog, guides) pour capter du trafic longue traîne ("comment vendre en ligne en Côte d'Ivoire", "acheter en toute sécurité en ligne CI"...) — recommandation stratégique à moyen terme, hors scope d'une intervention technique immédiate.
- `FAQ.tsx` existe mais **ne doit pas** recevoir de schema `FAQPage` : ce type est restreint aux sites gouvernementaux/santé depuis août 2023. Ne pas l'ajouter malgré la tentation.

---

## Score indicatif

| Catégorie | Poids | Note | Commentaire |
|---|---|---|---|
| Technique | 25% | 70/100 | Bonnes fondations, plombé surtout par l'absence de SSR/prerendering |
| Contenu | 20% | 60/100 | Bon copy de confiance, pas de contenu longue traîne |
| On-page | 15% | 75/100 | Corrigé cette session, socle déjà solide (canonical/title systématiques) |
| Schema | 15% | 55/100 → 80/100 après fix | Product + Organization déjà là, WebSite/Breadcrumb ajoutés |
| Performance (CWV) | 10% | N/A | Non mesurable pré-lancement |
| Images | 10% | 70/100 | Alt text correct sur les pages publiques après fix |
| GEO (recherche IA) | 5% | 50/100 | Pas de `llms.txt`, pas de contenu structuré pensé pour les réponses IA — hors scope immédiat |

**Note globale estimée : "Needs Improvement" → "Good" après les correctifs appliqués cette session**, avec le SSR/prerendering comme principal chantier structurel restant.
