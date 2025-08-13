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

L'application utilise SQLite avec TypeORM. La base de données sera créée automatiquement dans le fichier `database.sqlite` à la racine du projet.

**Note importante** : Les migrations et la synchronisation automatique sont désactivées comme demandé. Vous devrez créer manuellement vos tables SQL.

## Endpoints disponibles

### Endpoints principaux

- `GET /` - Message de bienvenue
- `GET /health` - Vérification de la santé de l'API

### Gestion des utilisateurs

- `GET /users` - Récupérer tous les utilisateurs
- `GET /users/:id` - Récupérer un utilisateur par ID
- `POST /users` - Créer un nouvel utilisateur
- `PUT /users/:id` - Mettre à jour un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur

## Documentation Swagger

La documentation Swagger est disponible à l'adresse : `http://localhost:3000/api`

## Création de la base de données

Comme les migrations sont désactivées, vous devrez créer manuellement vos tables. Voici un exemple de script SQL pour créer la table `users` :

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Développement

- `pnpm run start:dev` - Démarrer avec rechargement automatique
- `pnpm run build` - Construire l'application
- `pnpm run test` - Exécuter les tests
- `pnpm run lint` - Vérifier le code avec ESLint
- `pnpm run format` - Formater le code avec Prettier
