# REPRENDRE ICI — état du travail (17 juillet 2026)

Doc de reprise. Quand tu reviens, lis ça en premier. Branche : `refonte-tailwind-shadcn`.

---

## 1. Ce qui est FAIT et validé

### Bug de connexion corrigé ✅
- **Symptôme** : sur la page `/connexion`, un mauvais mot de passe affichait « Aucune session à renouveler » (message incompréhensible) au lieu de « Email ou mot de passe incorrect ». L'utilisateur croyait que la connexion ne marchait pas.
- **Cause** : `frontend/src/api/client.ts` réessayait TOUTE erreur 401 en appelant `/api/auth/refresh`. Pour `/api/auth/login`, un 401 = mauvais identifiants, pas un token expiré. Le refresh échouait et son message masquait la vraie erreur.
- **Fix** : ajout d'un set `NO_REFRESH_RETRY` (`/api/auth/login`, `/register`, `/refresh`, `/logout`) qui saute le retry, et un `try/catch` qui renvoie l'erreur 401 d'origine si le refresh échoue.
- **Vérifié en navigateur** : bon mot de passe → redirige vers `/marché`. Mauvais mot de passe → « Email ou mot de passe incorrect ». C'est réglé.

---

## 2. Ce qui est DÉCIDÉ mais PAS ENCORE FAIT (à reprendre)

Tu as demandé : enlever tout l'« IA slop », marketing en **nouchi**, animations **GSAP** (PAS de three.js, décidé pour la perf mobile / connexions lentes en Côte d'Ivoire), et un design encore plus moderne.

### Décisions verrouillées
- **Voix marketing = nouchi** (argot abidjanais), avec parcimonie, sans casser les faits (72h expédition, 7 jours confirmation, 5% / 3% commission, séquestre). C'est LE meilleur anti-slop : voix locale authentique > marketing français générique.
- **Animations = GSAP uniquement.** Pas de three.js / 3D. Pousser à fond : timeline d'entrée hero, reveals au scroll (déjà en place), parallax léger, compteur de chiffres (count-up), marquee de catégories.
- **Refonte du landing complète** (hero + sections + copie).

### Vocabulaire nouchi validé (sens sûrs, à utiliser sans en abuser)
| Terme | Sens | Usage marketing |
|-------|------|-----------------|
| `y'a pas drap` | pas de souci / pas de problème | rassurer : « Tu payes, y'a pas drap » |
| `gaou` | le naïf qui se fait arnaquer | anti-arnaque : « Achète sans être gaou » |
| `c'est carré` | c'est réglé / nickel | « Paie, c'est carré » |
| `c'est gbê` / `gbêh` | c'est la vérité / pour de vrai | preuve/confiance |
| `on est ensemble` | solidarité / on te couvre | fin de section, chaleureux |
| `djai` / `djè` | argent | « ton djai reste bloqué » |
| `djassa` | le marché (= la marque) | « fais ton djassa » |
| `mogo` / `môgô` | gars / personne / vendeur | « chaque mogo est vérifié » |
| `chap-chap` | vite | « négocie chap-chap » |
| `kpata` | top / propre / beau | « les affaires kpata du moment » |

Dose : ~1-2 termes nouchi par section max, le reste en français clair. Zéro tiret cadratin (—) dans les textes visibles (ça fait IA).

### Copie à écrire (plan concret par page)

**`frontend/src/pages/Landing.tsx`** — remplacer les clichés « pub » :
- Badge hero : « Le djassa en ligne d'Abidjan »
- H1 : **« Achète sans être gaou. »** puis en vert : « Ton djai reste bloqué. »
- Sous-titre : « Sur Jassa, ton paiement reste bloqué en séquestre jusqu'à ce que tu reçois ton colis. Y'a pas drap, zéro arnaque. »
- Stats (garder les faits) : `100%` séquestré · `72h` ou remboursé · `0` frais acheteur → ajouter le **count-up GSAP**.
- Étapes « Comment ça marche » → titre « Trois étapes, zéro gaou » :
  1. « Choisis ton affaire » — parcours le djassa, vendeurs vérifiés, négocie chap-chap dans la messagerie.
  2. « Paie, c'est carré » — ton djai part chez Jassa, pas chez le vendeur. Bloqué le temps que le colis arrive.
  3. « Reçois et valide » — colis en main, tu confirmes, le vendeur est payé. Souci ? litige → remboursé. On est ensemble.
- Featured : « Les affaires kpata du moment » (remplace « Ça bouge sur le marché »).
- Explainer séquestre H2 : « Ton djai bouge pas tant que tu n'as pas reçu ».
- Features : « Séquestre automatique », « Vendeurs vérifiés » (chaque mogo passe une vérif d'identité), « Négo intégrée ».
- Bandeau vendeur : « Tu veux vendre sur Jassa ? » — commission 5% / 3% Pro, djai garanti dès validation.
- CTA finale : « Prêt à faire ton djassa ? » — « Rejoins les mogos qui achètent et vendent sans se faire avoir. On est ensemble. » Boutons : « Je crée mon compte » / « Je vois le djassa ».

**`frontend/src/pages/LandingVendeur.tsx`** — même traitement nouchi côté vendeur :
- H1 : « Vends, encaisse, sans te faire avoir. »
- « Paiement garanti » : l'acheteur paie avant expédition, le djai est bloqué chez Jassa, impossible qu'il disparaisse sans payer.
- Garder les faits commission (5% / 3% Pro · 7 000 FCFA/mois) et étapes (vérif 24-72h, 72h expédition, versement à confirmation ou après 7 jours).

### Fix composant : `frontend/src/components/TrustBadge.tsx`
- Problème : affiche un « 100 » nu sur chaque carte (tous les vendeurs seed sont à 100 sans avis) → ça fait faux/slop.
- À faire : afficher un libellé qui a du sens au lieu du chiffre brut. Ex : pastille « Vérifié » (icône bouclier) quand le vendeur est vérifié ; n'afficher le score chiffré que s'il y a des avis réels ; « Nouveau » sinon. Garder le titre au survol `Indice de confiance X/100`.

### Améliorer les animations : `frontend/src/hooks/useLandingMotion.ts`
Le hook fait déjà : reveals `[data-reveal]` au scroll + tilt 3D pointeur sur la carte hero. À ajouter (GSAP, respecter `prefers-reduced-motion` et `pointer: coarse`) :
- **Timeline d'entrée hero** au chargement (stagger titre/sous-titre/boutons/carte).
- **Count-up** sur les éléments `[data-count]` (les stats hero).
- **Parallax léger** scroll-linked sur `[data-parallax]`.
- (Optionnel) marquee de catégories sous le hero via la keyframe CSS `animate-marquee` déjà définie dans `index.css`.

### Note sur les images produits (hors périmètre frontend pur)
Tu as signalé que les images des produits ne collent pas aux titres (ex : un bateau pour « Sac à main cuir »). Ces images viennent du **seed backend** (`backend/prisma/seed.ts`), pas du frontend. Pour vraiment corriger : rééditer le seed avec des images cohérentes par catégorie, puis `npm run prisma:seed`. À décider quand tu reviens (ça touche le backend / la data, pas juste l'UI).

---

## 3. Comment relancer le projet

```bash
# Backend (port 4000)
cd backend
npm install
npm run dev

# Frontend (port 5173), autre terminal
cd frontend
npm install
npm run dev
```

Comptes de test (seed) : `boutique.aicha@jassa.dev`, `techmarket.dakar@jassa.dev`, `maison.saveurs@jassa.dev` — mot de passe : `Password123!`

Build de contrôle avant de committer :
```bash
cd frontend && npm run build && npm run lint
```

---

## 4. ⚠️ Sécurité — À LIRE

- **`backend/.env` n'est PAS commité** (il est dans `.gitignore`). Je l'ai laissé volontairement hors de Git : il contient des **clés de paiement GeniusPay LIVE qui ont déjà fuité** (voir mémoire projet). Mettre des secrets live dans l'historique Git — même repo privé — est quasi irréversible et dangereux.
- Les fichiers `.env.example` (racine, `backend/`, `frontend/`) SONT commités : ils documentent toutes les variables sans valeurs sensibles. Rien n'est « caché » côté structure.
- **À faire dès que possible** : régénérer / faire tourner les clés GeniusPay qui ont fuité, et ne garder en `.env` que des clés sandbox tant que le contrat d'API n'est pas vérifié.
- Si tu veux VRAIMENT versionner ton `.env` réel malgré le risque : `git add -f backend/.env` puis commit. Je ne l'ai pas fait à ta place exprès.

---

## 5. Résumé express
1. Connexion : **corrigée** ✅ (`client.ts`).
2. Refonte nouchi + GSAP + de-slop : **plan prêt ci-dessus, pas encore codée**. Commence par `Landing.tsx` (copie), puis `TrustBadge.tsx`, puis `useLandingMotion.ts` (count-up + parallax), puis `LandingVendeur.tsx`.
3. Tout est commité et poussé sur `origin/refonte-tailwind-shadcn` (sauf `node_modules` et le `.env` réel).
