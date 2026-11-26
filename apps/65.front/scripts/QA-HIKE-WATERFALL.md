# Fiche membre — waterfall local, carte `45432166-a0d/fix`

**Candidat.** Référence `1035dc03d36b8dde93dbd662b76bac7d6b6b6749` ; candidat non committé. Fixture `qa-ui` uniquement, Chrome headless, trois contextes neufs par trajet. Titre mesuré du début de navigation/de l’action de clic au premier rendu visible de `h1#hike-title`. Sur le clic, la collection est déjà affichée et le prefetch Next habituel est conservé. Délai injecté : 300 ms avant départ des requêtes navigateur concernées (navigation détail, POST, GET secondaires) et 300 ms par lecture fixture (détail, favori, GPX, images). Les 650 ms préexistantes de la fixture `/categories` sont inchangées.

| Trajet | Avant, ms | Après, ms | Médiane avant → après | POST navigateur sur l’URL fiche |
|---|---:|---:|---:|---:|
| URL directe | 2334 / 2297 / 2294 | 670 / 637 / 683 | 2297 → 670 (−71 %) | 5 → 2 |
| Clic collection → fiche | 1374 / 1369 / 1380 | 746 / 752 / 754 | 1374 → 752 (−45 %) | 3 → 0 |

**Waterfall**, essai 2, temps relatifs au départ (ms), navigateur et trace fixture recoupés :

- Direct avant : document fini à 330, POST layout catégories à 395 puis profil à 1358 ; POST détail 1671→2279 (GET amont 1975→2276), titre 2297. Puis POST favori 2285→2898 et GPX 2898→3509. Image hero demandée à 2284.
- Direct après : GET amont du détail 312→613 dans le document (fini à 620), image hero demandée à 620, titre 637. Les deux POST restants concernent les catégories et le profil du layout commun, hors périmètre ; le titre apparaît avant leur fin. GET favori et GPX partent ensemble à 1657.
- Clic avant : GET RSC effectif 121→428 ; POST détail 736→1350, titre 1369 ; POST favori et GPX successifs. Clic après : GET RSC 120→731 (GET amont du détail 425→726), titre 752 ; image hero à 744 puis GET favori et GPX à 747. Les lectures secondaires ne bloquent ni le titre ni le lancement de l’image hero.

La fiche membre hydrate une **projection d’affichage** avec un client React Query éphémère côté serveur et le provider existant par compte côté client, sans queryFn réseau pour le détail. Lecture avec cookie de la requête et `no-store`. L’absence (404, corps vide ou `null`) est distincte de l’erreur ; le bouton relance la lecture serveur par `router.refresh()`. Le GET GPX réutilise le proxy existant ; le nouveau GET favori est privé et délègue l’authentification à l’API, sans lookup supplémentaire. L’édition et les lectures admin sont inchangées. Le benchmark vérifie retour collection/fiche, retry 503, 404 et 200 vide, HTML serveur avec hero, titre avec tous les POST retenus, deux sessions fictives et GET favori sans cookie refusé.

**Limites :** benchmark local non extrapolable aux 275–663 ms observées en production ; il n’attribue pas la capture de production aux photos ni à SQLite. Il mesure l’apparition du titre, pas le LCP. Les tuiles externes sont bloquées. Le nombre brut de POST sur l’URL fiche inclut les actions de layout ; ce ne sont pas des lectures du détail.

## Reproduction loopback

Lancer depuis `apps/65.front`, dans un terminal :

```sh
node scripts/qa-ui-fixture.mjs --hike-delay 300 --hike-trace > /tmp/fixture-hike.jsonl
```

Pour compiler et servir le candidat, puis la référence dans un autre terminal, sans changer de branche ni écraser les modifications (commandes depuis la racine) :

```sh
root="$PWD"
base="$root/.turbo/qa-hike-baseline"
mkdir -p "$base"
git archive 1035dc03 apps/65.front | tar -x -C "$base"
ln -s "$root/apps/65.front/node_modules" "$base/apps/65.front/node_modules"

serve_hike() (
  cd "$1" || exit
  export NEXT_TELEMETRY_DISABLED=1
  export NEXT_PUBLIC_API_URL=http://127.0.0.1:46253
  export NEXT_PUBLIC_IMAGE_URL=http://127.0.0.1:46253/images
  export NEXT_PUBLIC_APP_URL="http://127.0.0.1:$2"
  pnpm exec next build && pnpm exec next start --hostname 127.0.0.1 --port "$2"
)
serve_hike "$base/apps/65.front" 46255 &
serve_hike "$root/apps/65.front" 46254
```

Quand les deux répondent, depuis `apps/65.front`, avec Playwright et Chromium déjà installés :

```sh
# Renseigner PW avec le chemin absolu du module Playwright et CH avec celui du binaire Chromium.
node scripts/qa-hike-waterfall.mjs --origin http://127.0.0.1:46255 \
  --playwright "$PW" --chromium "$CH" > /tmp/hike-before.jsonl
node scripts/qa-hike-waterfall.mjs --verify \
  --playwright "$PW" --chromium "$CH" > /tmp/hike-after.jsonl
# Pour le smoke, redémarrer la fixture sans --hike-delay ni --hike-trace.
node scripts/qa-ui-smoke.mjs --playwright "$PW" --chromium "$CH" --output /tmp/hike-smoke
```

Traces de cette exécution : `/tmp/65-hike-45432166/{before,after,fixture-final}.jsonl`. Les lignes navigateur horodatent le départ, la réception des en-têtes et la fin. `pnpm build`, `pnpm check-types`, ESLint ciblé, `git diff --check`, le benchmark `--verify` et le smoke Chromium mobile/desktop sont passés. Le smoke relance le navigateur entre les séries pour éviter les fermetures de Chrome observées en enchaînant tous les contextes. Captures dans `/tmp/65-hike-45432166/smoke`, journal `smoke-verified.log`.
