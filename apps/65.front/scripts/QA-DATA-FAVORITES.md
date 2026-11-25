# Régression favoris et profil — loopback uniquement

Depuis la racine, les tests de l’API utilisent SQLite en mémoire et des comptes fictifs :

```sh
NODE_ENV=test DATABASE_PATH=:memory: DOTENV_CONFIG_QUIET=true pnpm --filter 65.api exec jest --runInBand
```

Pour Chromium, lancer le front dans un premier terminal (depuis `apps/65.front`) :

```sh
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_API_URL=http://127.0.0.1:46263
export NEXT_PUBLIC_IMAGE_URL=http://127.0.0.1:46263/images
export NEXT_PUBLIC_APP_URL=http://localhost:46264
export NEXT_PUBLIC_AUTH_URL=http://localhost:46264/api/auth
pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 46264
```

Dans un second terminal, avec Playwright et Chromium déjà installés :

```sh
node scripts/qa-data-favorites.mjs --playwright /chemin/vers/node_modules/playwright
```

`--playwright` accepte aussi `playwright-core` ; `--chromium /chemin/vers/chromium` sélectionne un binaire local. Le script démarre et arrête sa propre fixture HTTP sur `127.0.0.1:46263`, sans base ni données réelles, et bloque les requêtes navigateur hors de l’origine du front. Utiliser `localhost` pour le front afin que les redirections de Next restent sur la même origine.

Le scénario ouvre catégorie et massif avec un cache froid, puis réchauffe la liste, le cœur et le rôle de A. Après déconnexion et connexion de B dans le même document, les trois réponses privées de B sont bloquées puis libérées pour vérifier l’absence de flash des valeurs de A. Il vérifie aussi l’ajout par B, le rafraîchissement de sa liste et le refus d’accès à `/admin`.
