# Audit UI — fixture locale

Depuis `apps/65.front`, dans deux terminaux :

```sh
node scripts/qa-ui-fixture.mjs
```

```sh
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_API_URL=http://127.0.0.1:46253
export NEXT_PUBLIC_IMAGE_URL=http://127.0.0.1:46253/images
export NEXT_PUBLIC_APP_URL=http://127.0.0.1:46254
pnpm build && pnpm start --hostname 127.0.0.1 --port 46254
```

Avec un Playwright et un Chromium déjà installés :

```sh
node scripts/qa-ui-smoke.mjs \
  --playwright /chemin/vers/node_modules/playwright \
  --output /tmp/65-qa-ui
```

`--chromium /chemin/vers/chromium` permet de sélectionner un binaire Chromium local. Le script bloque les requêtes hors loopback (notamment les tuiles et polices) et peut capturer des preuves PNG. La fixture ne lit ni base, ni variables d’accès, ni compte réel. Pour les essais manuels, donner au site loopback le cookie `qa-ui=normal` (accueil), `qa-ui=empty` ou `qa-ui=error` (états des catégories) ; sans cookie, `/auth/signIn` affiche la connexion. Parcours fictifs : `/categories/ski/states/south/hike/{wide,single,empty,error,long-no-media}`.

Le même smoke couvre le parcours membre à 390 × 844 et 1280 × 850 : suggestions au clavier, collection et liens de massif, favoris présents/vides/en erreur, fiche ouverte dans un onglet neuf, accès carte/photos et retour de focus après fermeture de la galerie. Les captures `member-*` sont enregistrées dans `--output`. La fiche `wide` réutilise deux photos publiques du dépôt avec un cadrage de couverture à 23 % ; les images du catalogue de test restent synthétiques. Le fond de carte externe est volontairement bloqué. La suite `qa-data-favorites.mjs` reste dédiée à la mutation des favoris et à l’isolation des comptes.

La fiche est aussi vérifiée à 320, 390, 820 et 1440 px : accès immédiat au titre et aux actions, pas de débordement ni d’ombre visible, carte avant galerie, largeur et cadrage de la couverture, et absence d’actions ou de requêtes média sur `long-no-media`. Les captures correspondantes sont `hike-editorial-*` et `hike-long-no-media-*`.

Pour le rapport `qa-ui`, indiquer les routes, dimensions/DPR, ordre de tabulation et focus après Échap, marge/zoom/point GPX, visibilité de `0 m`, et URL/statut/octets des images desktop ainsi que l’absence de requêtes mobiles pour ces images. Joindre captures et/ou relevé Réseau, avec localisation précise des écarts.

### Catalogue et menu des catégories

```sh
node scripts/qa-catalog.mjs --playwright "$PW" --chromium "$CH" --output /tmp/65-catalog
```

Sur `/categories/ski` avec `qa-ui=catalog`, la fixture sert 24 cartes dont une photo en 404 et une photo NULL. Le scénario vérifie les fallbacks, le focus et l’absence de déplacement au survol, les états du menu au clavier et le chargement initial des images, à 390, 820 et 1440 px (ce dernier à DPR 1 et 2). `--baseline` relève les mêmes métriques froides sans imposer les nouvelles assertions. Les octets sont ceux observés pour `/api/images` sur la fixture ; le SVG synthétique n’est pas redimensionné par la fixture, donc ces octets ne permettent pas d’estimer le gain des photos réelles.
