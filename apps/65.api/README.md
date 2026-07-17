# 65.API - Application NestJS

Cette application NestJS utilise SQLite avec TypeORM et inclut Swagger pour la documentation de l'API.

## Structure du projet

```
src/
├── controllers/     # Contrôleurs de l'API
├── services/        # Logique métier
├── repository/      # Couche d'accès aux données
├── entities/        # Entités TypeORM
├── users/           # Module des utilisateurs
├── app.module.ts    # Module principal
├── app.controller.ts # Contrôleur principal
├── app.service.ts   # Service principal
└── main.ts          # Point d'entrée
```

## Installation

```bash
# Installer les dépendances
pnpm install

# Construire l'application
pnpm run build

# Démarrer en mode développement
pnpm run start:dev

# Démarrer en mode production
pnpm run start:prod
```

## Configuration

L'application utilise SQLite avec TypeORM et Better Auth. En développement, la base par défaut est `database.db` à la racine de l'application.

Copiez `.env.example` vers `.env`, puis définissez notamment `BETTER_AUTH_SECRET`. La synchronisation TypeORM reste désactivée ; `pnpm auth:migrate` applique uniquement le schéma Better Auth et le renommage du lien d'identité existant.

## Endpoints disponibles

### Endpoints principaux

- `GET /` - Message de bienvenue
- `GET /health` - Vérification de la santé de l'API

### Authentification et utilisateur courant

- `ALL /api/auth/*` - Endpoints Better Auth
- `GET /users` - Récupérer l'utilisateur courant

## Documentation Swagger

La documentation Swagger est disponible à l'adresse : `http://localhost:3001/api`

## Migration et provisioning des comptes

Le script est idempotent et conserve les données métier :

```bash
pnpm auth:migrate

AUTH_USER_EMAIL=utilisateur@exemple.fr \
AUTH_USER_PASSWORD='mot-de-passe-temporaire' \
AUTH_USER_NAME='Prénom Nom' \
pnpm auth:user:create
```

La création d'identifiants est limitée aux adresses déjà présentes dans la table métier `User`. L'inscription publique Better Auth est désactivée par défaut.

## Développement

- `pnpm run start:dev` - Démarrer avec rechargement automatique
- `pnpm run build` - Construire l'application
- `pnpm run test` - Exécuter les tests
- `pnpm run lint` - Vérifier le code avec ESLint
- `pnpm run format` - Formater le code avec Prettier
