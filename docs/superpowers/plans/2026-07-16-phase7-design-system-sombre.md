# Phase 7 — Design System Sombre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer au frontend réel (`frontend/`) le langage de design validé dans le skill `jassa-design` (~/.claude/skills/jassa-design/) — mode sombre partout, bleu encre + corail disciplinés, polices Bricolage Grotesque/Public Sans/Courier Prime, radii chaleureux + ombres dures, et les deux moments signature (tampon de confiance, rail de séquestre) — sans rien casser dans les pages existantes.

**Architecture:** Le frontend consomme déjà ses couleurs/radii/ombres/polices exclusivement via des custom properties CSS centralisées dans `src/styles/tokens.css`, référencées par `src/styles/components.css` et 5 fichiers CSS de page/composant. Aucun `.tsx` ne contient de couleur ou de valeur en dur (vérifié par grep sur toute `frontend/src`), à l'exception de 4 usages inline de `var(--muted)`. Ça veut dire que la quasi-totalité de la re-thématisation se fait en réécrivant `tokens.css` + `components.css` ; seuls les noms de variables qui changent doivent être répercutés dans les fichiers dépendants. Les deux seuls changements de composant réel sont `TrustBadge.tsx` (devient un tampon plutôt qu'une pastille) et le rail de séquestre dans `Commandes.tsx` (upgrade CSS pur, zéro changement de markup).

**Tech Stack:** Aucune nouvelle dépendance. Pas de Tailwind, pas de shadcn dans cette passe (voir note de fin) — uniquement CSS custom properties, déjà en place.

## Global Constraints

- Mode sombre = seul mode livré dans cette passe (pas de toggle clair/sombre — l'app n'en a pas aujourd'hui, en ajouter un serait du YAGNI). Les valeurs "mode clair" existent dans le skill `jassa-design` pour plus tard.
- Zéro renommage de classe React (`className`) — uniquement les noms des custom properties CSS et leurs valeurs. Zéro risque de casser un composant qui référence une classe.
- Zéro nouvelle dépendance npm dans cette passe (pas d'icônes — le tampon et le rail se font en CSS pur, voir Tâches 2 et 4).
- Avant de dire "c'est fait" sur une tâche : `cd frontend && npm run build` doit passer (tsc -b && vite build). C'est le seul filet de sécurité disponible — il n'y a pas de suite de tests sur le frontend.
- Jamais de `--danger`/`--ink`/`--muted`/`--line`/`--surface-alt`/`--radius-sm`/`--radius-md`/`--radius-lg`/`--shadow-sm`/`--shadow-md` restant après la Tâche 3 — ce sont les anciens noms, ils doivent tous être remplacés (pas d'alias de compatibilité, cf. convention du projet : pas de shims).
- `--fun` (corail) est défini dans `tokens.css` (Tâche 1) mais n'est consommé par aucun sélecteur dans ce plan — l'app n'a pas encore de concept réel "populaire/nouveau" côté données. Ne pas l'utiliser artificiellement quelque part juste pour "s'en servir" ; voir la note de fin sur le blob frame.

---

## File Structure

```
frontend/
  index.html                                   # polices Google Fonts
  src/
    styles/
      tokens.css                               # réécrit entièrement (mode sombre canonique)
      components.css                           # réécrit entièrement (boutons/inputs/cartes/pills/rail + tampon)
    components/
      Layout.css                               # renommage de variables uniquement
      ProductCard.css                          # renommage de variables uniquement
      ConversationThread.css                   # renommage de variables uniquement
      TrustBadge.tsx                           # devient un tampon (nouveau markup)
    pages/
      Messagerie.css                           # renommage de variables uniquement
      admin/AdminVerifications.css             # renommage de variables uniquement
      Login.tsx                                # var(--muted) → var(--text2), ligne 32
      Register.tsx                             # var(--muted) → var(--text2), ligne 33
      Verification.tsx                         # var(--muted) → var(--text2), ligne 51
      Abonnement.tsx                           # var(--muted) → var(--text2), ligne 33
```

---

### Task 1: Polices + tokens.css (fondation)

**Files:**
- Modify: `frontend/index.html:7-12`
- Modify: `frontend/src/styles/tokens.css` (réécriture complète)

**Interfaces:**
- Produces : toutes les custom properties consommées par `components.css` (Tâche 2) et les 5 fichiers CSS dépendants (Tâche 3) : `--background`, `--bg`, `--surface1`, `--surface2`, `--surface3`, `--border`, `--border-visible`, `--text1`, `--text2`, `--text3`, `--text4`, `--accent`, `--accent-hover`, `--accent-ink`, `--accent-subtle`, `--fun`, `--fun-subtle`, `--success`, `--success-bg`, `--warning`, `--warning-bg`, `--error`, `--error-bg`, `--font-display`, `--font-body`, `--font-mono`, `--radius-element`, `--radius-control`, `--radius-component`, `--radius-container`, `--radius-pill`, `--shadow-1`, `--shadow-2`, `--shadow-3`.

- [ ] **Step 1: Remplacer les polices Google Fonts**

Dans `frontend/index.html`, remplacer les lignes 7-12 :

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 2: Réécrire tokens.css**

Remplacer tout le contenu de `frontend/src/styles/tokens.css` par :

```css
:root {
  /* Colors — mode sombre (le seul mode livré) */
  --background: #110d08;
  --bg: var(--background);
  --surface1: #1c170f;
  --surface2: #2c2519;
  --surface3: #423827;
  --border: #423827;
  --border-visible: #7c6b4c;
  --text1: #faf5ea;
  --text2: #a8916a;
  --text3: #7c6b4c;
  --text4: #5c4e37;

  --accent: #7c8cc1;
  --accent-hover: #a9b5d9;
  --accent-ink: #110d08;
  --accent-subtle: #232a44;

  --fun: #e08960;
  --fun-subtle: #2e1e14;

  --success: #6fae73;
  --success-bg: #1d3b22;
  --warning: #d0a857;
  --warning-bg: #563a11;
  --error: #e08078;
  --error-bg: #5c1d18;

  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-body: "Public Sans", system-ui, sans-serif;
  --font-mono: "Courier Prime", ui-monospace, monospace;

  --radius-element: 4px;
  --radius-control: 10px;
  --radius-component: 14px;
  --radius-container: 16px;
  --radius-pill: 999px;

  --shadow-1: 2px 2px 0 rgba(0, 0, 0, 0.45);
  --shadow-2: 3px 3px 0 rgba(0, 0, 0, 0.5), 6px 6px 0 rgba(0, 0, 0, 0.25);
  --shadow-3: 4px 4px 0 rgba(0, 0, 0, 0.55), 8px 8px 0 rgba(0, 0, 0, 0.28);

  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--background);
  color: var(--text1);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

h1,
h2,
h3 {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text1);
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}

h1 {
  font-size: 2rem;
}

h2 {
  font-size: 1.375rem;
}

h3 {
  font-size: 1.125rem;
}

p {
  margin: 0 0 0.5rem;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: var(--font-body);
}
```

> Note : `--success`/`--warning`/`--error` ci-dessus sont volontairement plus clairs que les valeurs "500" documentées dans `~/.claude/skills/jassa-design/references/tokens.md` — ces dernières ont été calibrées pour un badge sur fond clair et manquent de contraste directement sur le fond quasi-noir de l'app réelle. Si tu retouches le skill plus tard, reporte ce même ajustement dans `design-model.yaml` (`tokens.colors.dark`) pour que le skill et l'app réelle ne divergent pas.

- [ ] **Step 3: Vérifier**

```bash
cd frontend && npm run build
```

Attendu : build qui passe (aucune erreur TypeScript — ce fichier ne touche pas de `.tsx`). Lancer `npm run dev` et ouvrir `/connexion` : fond quasi-noir, texte clair, police Bricolage Grotesque sur "DJASSA" (le reste de l'UI sera cassé jusqu'à la Tâche 2 — c'est attendu, `components.css` référence encore les anciens noms de variables).

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/src/styles/tokens.css
git commit -m "feat(frontend): tokens de design sombres (Bricolage Grotesque, Public Sans, Courier Prime)"
```

---

### Task 2: Réécrire components.css (boutons, inputs, cartes, pills, rail)

**Files:**
- Modify: `frontend/src/styles/components.css` (réécriture complète)

**Interfaces:**
- Consumes : tous les tokens produits en Tâche 1.
- Produces : mêmes sélecteurs qu'avant (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.btn-link`, `.field`, `.input`, `.form-row`, `.error-text`, `.card`, `.card-list`, `.pill*`, `.mono`, `.code-chip`, `.price`, `.empty-state`, `.auth-*`, `.rail*`) — aucun `.tsx` ne doit changer pour cette tâche.

- [ ] **Step 1: Réécrire components.css**

Remplacer tout le contenu de `frontend/src/styles/components.css` par :

```css
/* Layout */
.container {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.page {
  flex: 1;
  padding: 2.5rem 0 4rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header p {
  color: var(--text2);
}

.section {
  margin-bottom: 2.5rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9375rem;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-control);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-ink);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--surface1);
  color: var(--text1);
  border-color: var(--border);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--border-visible);
}

.btn-danger {
  background: var(--surface1);
  color: var(--error);
  border-color: var(--error-bg);
}

.btn-danger:hover:not(:disabled) {
  background: var(--error-bg);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8125rem;
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

/* Forms */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.field label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text2);
}

.input,
textarea.input,
select.input {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--surface1);
  color: var(--text1);
  width: 100%;
}

.input:focus,
textarea.input:focus,
select.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(124, 140, 193, 0.3);
}

textarea.input {
  min-height: 5rem;
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.form-row .field {
  flex: 1;
  min-width: 10rem;
  margin-bottom: 0;
}

.error-text {
  color: var(--error);
  font-size: 0.875rem;
  margin: 0 0 0.75rem;
}

/* Card */
.card {
  background: var(--surface1);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-component);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-1);
}

.card + .card {
  margin-top: 0.75rem;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Badges / status pills */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  line-height: 1;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.pill-neutral {
  background: var(--surface2);
  color: var(--text2);
}

.pill-success {
  background: var(--success-bg);
  color: var(--success);
}

.pill-warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.pill-danger {
  background: var(--error-bg);
  color: var(--error);
}

/* Mono data (prices, codes) */
.mono {
  font-family: var(--font-mono);
  font-weight: 500;
}

.code-chip {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text2);
  background: var(--surface2);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-control);
}

.price {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text1);
}

/* Empty / loading state */
.empty-state {
  color: var(--text2);
  padding: 2rem 0;
  text-align: center;
}

/* Auth pages */
.auth-shell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface1);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-container);
  padding: 2rem;
  box-shadow: var(--shadow-2);
}

.auth-card h1 {
  font-size: 1.5rem;
}

.auth-card .btn {
  width: 100%;
  margin-top: 0.25rem;
}

.auth-switch {
  margin-top: 1.25rem;
  font-size: 0.875rem;
  color: var(--text2);
  text-align: center;
}

/* Escrow rail (signature element) — chaque étape est un mini-tampon,
   pas un point de stepper générique. Coche en CSS pur (::after), pas
   d'icône, pas de changement de markup dans Commandes.tsx. */
.rail {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0.75rem 0 1rem;
}

.rail-step {
  display: flex;
  align-items: center;
  flex: 1;
}

.rail-dot {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-pill);
  border: 1.5px dashed var(--border-visible);
  background: transparent;
  flex-shrink: 0;
  position: relative;
}

.rail-dot.is-done {
  border: 2px solid var(--accent);
  background: var(--accent-subtle);
}

.rail-dot.is-done::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 6px;
  width: 8px;
  height: 4px;
  border-left: 1.5px solid var(--accent);
  border-bottom: 1.5px solid var(--accent);
  transform: rotate(-45deg);
}

.rail-dot.is-current {
  border: 2px dashed var(--accent);
  animation: railPulse 1.6s ease-in-out infinite;
}

.rail-dot.is-danger {
  border: 2px solid var(--error);
  background: var(--error-bg);
}

@keyframes railPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--accent-subtle);
  }
  50% {
    box-shadow: 0 0 0 4px var(--accent-subtle);
  }
}

.rail-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 0.35rem;
}

.rail-line.is-done {
  background: var(--accent);
}
```

- [ ] **Step 2: Vérifier**

```bash
cd frontend && npm run build
```

Attendu : build qui passe. Lancer `npm run dev`, ouvrir `/connexion`, `/inscription`, `/marche` : boutons/cartes/inputs cohérents en sombre, radii chaleureux (10-14-16px), ombres dures visibles (pas de flou). Ouvrir `/commandes` (connecté) : les points du rail doivent apparaître comme des anneaux pointillés/pleins plutôt que des points pleins colorés — c'est le nouveau rail-cachet.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/components.css
git commit -m "feat(frontend): reskin boutons/cartes/inputs/rail sur les nouveaux tokens sombres"
```

---

### Task 3: Renommer les variables dans les fichiers dépendants

**Files:**
- Modify: `frontend/src/components/Layout.css`
- Modify: `frontend/src/components/ProductCard.css`
- Modify: `frontend/src/components/ConversationThread.css`
- Modify: `frontend/src/pages/Messagerie.css`
- Modify: `frontend/src/pages/admin/AdminVerifications.css`
- Modify: `frontend/src/pages/Login.tsx:32`
- Modify: `frontend/src/pages/Register.tsx:33`
- Modify: `frontend/src/pages/Verification.tsx:51`
- Modify: `frontend/src/pages/Abonnement.tsx:33`

**Interfaces:**
- Consumes : tokens de la Tâche 1. Aucune classe React ne change de nom — uniquement les noms de custom properties CSS référencées.

- [ ] **Step 1: `Layout.css`**

Remplacer :
```css
.nav {
  border-bottom: 1px solid var(--line);
  background: var(--surface);
```
par :
```css
.nav {
  border-bottom: 1px solid var(--border);
  background: var(--surface1);
```

Remplacer :
```css
.nav-logo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--ink);
```
par :
```css
.nav-logo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--text1);
```

Remplacer les deux occurrences de `color: var(--muted);` (`.nav-links a` et `.nav-user`) par `color: var(--text2);`.

- [ ] **Step 2: `ProductCard.css`**

Remplacer :
```css
.product-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  background: var(--surface-alt);
}
```
par :
```css
.product-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  background: var(--surface2);
}
```

- [ ] **Step 3: `ConversationThread.css`**

Remplacer :
```css
.thread-bubble {
  max-width: 70%;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-md);
  background: var(--surface-alt);
  font-size: 0.9rem;
}
```
par :
```css
.thread-bubble {
  max-width: 70%;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-component);
  background: var(--surface2);
  font-size: 0.9rem;
}
```

(`var(--accent)`, `var(--accent-ink)`, `var(--font-mono)` restent inchangés — mêmes noms dans les nouveaux tokens.)

- [ ] **Step 4: `Messagerie.css`**

Remplacer :
```css
.conversation-item {
  width: 100%;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
}

.conversation-item.is-active {
  border-color: var(--accent);
  color: var(--ink);
  background: var(--surface-alt);
}
```
par :
```css
.conversation-item {
  width: 100%;
  text-align: left;
  background: var(--surface1);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-control);
  padding: 0.6rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text2);
  cursor: pointer;
}

.conversation-item.is-active {
  border-color: var(--accent);
  color: var(--text1);
  background: var(--surface2);
}
```

- [ ] **Step 5: `AdminVerifications.css`**

Remplacer :
```css
.verif-row img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
}
```
par :
```css
.verif-row img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius-control);
  border: 1.5px solid var(--border);
}
```

- [ ] **Step 6: 4 usages inline de `var(--muted)`**

Dans `frontend/src/pages/Login.tsx:32`, `frontend/src/pages/Register.tsx:33`, `frontend/src/pages/Verification.tsx:51`, `frontend/src/pages/Abonnement.tsx:33` : remplacer chaque `"var(--muted)"` par `"var(--text2)"` (une seule occurrence par fichier, dans un `style={{ color: "var(--muted)" }}` ou équivalent).

- [ ] **Step 7: Vérifier qu'aucun ancien nom ne subsiste**

```bash
cd frontend && grep -rn "var(--muted)\|var(--ink)\|var(--line)\|var(--surface-alt)\|var(--surface)\|var(--danger)\|var(--radius-sm)\|var(--radius-md)\|var(--radius-lg)\|var(--shadow-sm)\|var(--shadow-md)" src
```

Attendu : aucune sortie (grep ne trouve rien — `var(--surface)` sans suffixe ne matche jamais `var(--surface1)`/`var(--surface2)`/`var(--surface3)`, la parenthèse fermante s'y oppose).

```bash
npm run build
```

Attendu : build qui passe.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/Layout.css frontend/src/components/ProductCard.css frontend/src/components/ConversationThread.css frontend/src/pages/Messagerie.css frontend/src/pages/admin/AdminVerifications.css frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx frontend/src/pages/Verification.tsx frontend/src/pages/Abonnement.tsx
git commit -m "refactor(frontend): migrer les fichiers dépendants vers les nouveaux noms de tokens"
```

---

### Task 4: TrustBadge devient un tampon

**Files:**
- Modify: `frontend/src/components/TrustBadge.tsx` (réécriture complète, 16 lignes)
- Modify: `frontend/src/styles/components.css` (ajout, ne touche pas au contenu de la Tâche 2)

**Interfaces:**
- Consumes: `reviewsApi.trustScore` (`../api/reviews`, inchangé), tokens `--accent`, `--warning`, `--error`, `--accent-subtle`, `--font-display`, `--radius-pill`.
- Produces: `TrustBadge({ vendorId: string })` — signature inchangée, toujours consommé tel quel par `frontend/src/components/ProductCard.tsx:21` (aucun changement requis côté `ProductCard.tsx`).

- [ ] **Step 1: Réécrire TrustBadge.tsx**

Remplacer tout le contenu de `frontend/src/components/TrustBadge.tsx` par :

```tsx
import { useEffect, useState } from "react";
import { reviewsApi, type TrustScore } from "../api/reviews";

export function TrustBadge({ vendorId }: { vendorId: string }) {
  const [trust, setTrust] = useState<TrustScore | null>(null);

  useEffect(() => {
    reviewsApi.trustScore(vendorId).then(setTrust);
  }, [vendorId]);

  if (!trust) return null;

  const tone = trust.score >= 70 ? "stamp-accent" : trust.score >= 40 ? "stamp-warning" : "stamp-danger";

  return (
    <span className={`stamp-sm ${tone}`} title={`Confiance ${trust.score}/100`}>
      {trust.score}
    </span>
  );
}
```

- [ ] **Step 2: Ajouter le style du tampon dans components.css**

Ajouter à la fin de `frontend/src/styles/components.css` :

```css
/* Tampon de confiance (TrustBadge) — seul cercle parfait du système */
.stamp-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-pill);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
  position: relative;
  transform: rotate(-6deg);
  animation: stampIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.stamp-sm::before {
  content: "";
  position: absolute;
  inset: 3px;
  border-radius: var(--radius-pill);
  border: 1px solid currentColor;
  opacity: 0.6;
}

.stamp-sm.stamp-accent {
  border: 2px solid var(--accent);
  background: var(--accent-subtle);
  color: var(--accent);
}

.stamp-sm.stamp-warning {
  border: 2px solid var(--warning);
  background: var(--warning-bg);
  color: var(--warning);
}

.stamp-sm.stamp-danger {
  border: 2px solid var(--error);
  background: var(--error-bg);
  color: var(--error);
}

@keyframes stampIn {
  0% {
    transform: scale(1.3) rotate(-18deg);
    opacity: 0;
  }
  60% {
    transform: scale(0.92) rotate(-4deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(-6deg);
  }
}
```

- [ ] **Step 3: Vérifier**

```bash
cd frontend && npm run build
```

Attendu : build qui passe. Lancer `npm run dev`, ouvrir `/marche` : chaque carte produit affiche un petit tampon rond (score de confiance) à la place de l'ancienne pastille rectangulaire, avec un léger rebond à l'apparition.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/TrustBadge.tsx frontend/src/styles/components.css
git commit -m "feat(frontend): TrustBadge devient un tampon de confiance"
```

---

### Task 5: QA finale

**Files:** aucun changement de fichier attendu — uniquement vérification et correctifs ponctuels si un écart est trouvé.

- [ ] **Step 1: Grep de sécurité sur tout le repo frontend**

```bash
cd frontend && grep -rn "var(--muted)\|var(--ink)\|var(--line)\|var(--surface-alt)\|var(--surface)\|var(--danger)\|var(--radius-sm)\|var(--radius-md)\|var(--radius-lg)\|var(--shadow-sm)\|var(--shadow-md)" src
```

Attendu : aucune sortie. Si quelque chose remonte, c'est qu'un fichier a été manqué dans les Tâches 1-4 — corrige-le avant de continuer.

- [ ] **Step 2: Build + typecheck**

```bash
npm run build
```

Attendu : succès complet, zéro erreur TypeScript, zéro warning de build.

- [ ] **Step 3: Parcours visuel complet**

Lancer `npm run dev` et ouvrir, dans l'ordre : `/connexion`, `/inscription`, `/marche` (avec et sans produits), `/tableau-de-bord`, `/catalogue` (compte vendeur), `/commandes` (au moins une commande dans chaque statut si possible), `/messagerie`, `/verification`, `/abonnement`, `/admin/verifications` (compte admin). Checklist par écran : fond sombre cohérent, aucun texte illisible (contraste), boutons primary en bleu encre uniquement sur les actions qui engagent (payer, confirmer, publier — jamais sur une action de découverte), radii chaleureux visibles sans ombre floue nulle part.

- [ ] **Step 4: Commit final (si des correctifs ont été nécessaires à l'étape 1 ou 3)**

```bash
git add -A
git commit -m "fix(frontend): correctifs QA suite au reskin sombre"
```

---

## Notes pour plus tard (hors scope de ce plan)

- **Tailwind + shadcn/ui** : documenté dans `~/.claude/skills/jassa-design/SKILL.md` §4 et `references/platform-mapping.md` §3, mais volontairement hors scope ici — l'app n'a aujourd'hui aucun Dialog/Dropdown/Tabs/Popover qui justifierait cette dépendance. À faire dans un plan dédié le jour où un composant de ce type est réellement nécessaire.
- **Blob frame** (cadre organique pour photo produit "mise en avant") : nécessite un vrai concept de produit "populaire/mis en avant" côté API — n'existe pas encore dans `Product` (`frontend/src/api/products.ts`). Ne pas l'inventer côté frontend seul ; à planifier avec le backend si ce besoin apparaît.
- **Toggle clair/sombre** : les valeurs "mode clair" existent déjà dans `~/.claude/skills/jassa-design/references/tokens.md` — les ajouter à `tokens.css` sous `[data-theme="light"]` le jour où un vrai bouton de bascule est demandé.
