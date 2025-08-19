# 65 Passion Montagne 🏔️

65 Passion Montagne est une application web dédiée à la découverte et au partage d'activités de montagne dans les Hautes-Pyrénées (département 65). L'application permet de répertorier, consulter et gérer différents types d'activités de montagne avec des informations détaillées, des photos et des tracés GPS.

## 🎯 À propos du projet

Cette plateforme digitale a été conçue pour les passionnés de montagne souhaitant explorer les richesses des Hautes-Pyrénées. Elle propose un catalogage complet des activités de montagne organisées par catégories (randonnées, refuges, circuits, etc.) et par massifs géographiques.

### 🏃‍♂️ Fonctionnalités principales

- **📍 Géolocalisation des activités** : Chaque activité est géoréférencée avec des informations précises sur sa localisation
- **🗺️ Tracés GPS** : Fichiers GPX téléchargeables pour suivre les itinéraires avec précision
- **📸 Galeries photos** : Images haute qualité pour découvrir les paysages et points d'intérêt
- **📊 Informations détaillées** :
  - Distance et dénivelé
  - Durée estimée
  - Niveau de difficulté (Promeneur, Marcheur, Randonneur, Expérimenté)
  - Indications et conseils pratiques
- **🏔️ Organisation par massifs** : Navigation intuitive par zones géographiques
- **⭐ Système de favoris** : Sauvegarde des activités préférées
- **🔍 Recherche avancée** : Filtrage par catégorie, difficulté, massif
- **👤 Gestion des utilisateurs** : Authentification sécurisée avec Clerk

### 🎾 Types d'activités

L'application répertorie différentes catégories d'activités de montagne :

- **Randonnées pédestres** : Sentiers de tous niveaux
- **Refuges de montagne** : Hébergements en altitude
- **Circuits thématiques** : Parcours découverte
- **Points d'intérêt** : Sites remarquables et panoramas
- **Activités spécialisées** : Selon les spécificités locales

## 🌐 Accès à l'application

L'application est accessible à l'adresse : **[65PassionMontagne.simondesdevises.com](https://65PassionMontagne.simondesdevises.com)**

> ⚠️ **Accès restreint** : L'application nécessite un compte utilisateur pour accéder au contenu.
>
> Pour tester l'application, veuillez envoyer un email à : **[simondesdevises@gmail.com](mailto:simondesdevises@gmail.com)**

## 🛠️ Technologies utilisées

Cette application est construite avec un stack technologique moderne et performant.

### Frontend (65.front)

- **[Next.js 15](https://nextjs.org/)** - Framework React avec App Router
- **[React 19](https://reactjs.org/)** - Bibliothèque UI avec les dernières fonctionnalités
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique pour plus de fiabilité
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utilitaire
- **[Clerk](https://clerk.dev/)** - Authentification et gestion des utilisateurs
- **[TanStack Query](https://tanstack.com/query)** - Gestion d'état et cache pour les données serveur
- **[React Hook Form](https://react-hook-form.com/)** - Gestion des formulaires performante
- **[Zod](https://zod.dev/)** - Validation de schémas TypeScript
- **[Leaflet](https://leafletjs.com/)** & **[React Leaflet](https://react-leaflet.js.org/)** - Cartes interactives
- **[Zustand](https://github.com/pmndrs/zustand)** - Gestion d'état client légère
- **[Radix UI](https://www.radix-ui.com/)** - Composants UI accessibles
- **[Lucide React](https://lucide.dev/)** - Icônes modernes
- **[Sonner](https://sonner.emilkowal.ski/)** - Notifications toast

### Backend (65.api)

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressif et modulaire
- **[TypeORM](https://typeorm.io/)** - ORM TypeScript pour la base de données
- **[SQLite](https://www.sqlite.org/)** - Base de données relationnelle légère
- **[Swagger](https://swagger.io/)** - Documentation automatique de l'API
- **[Multer](https://github.com/expressjs/multer)** - Gestion des uploads de fichiers
- **[Sharp](https://sharp.pixelplumbing.com/)** - Traitement d'images optimisé
- **[UUID](https://github.com/uuidjs/uuid)** - Génération d'identifiants uniques

### Outils de développement

- **[Turborepo](https://turbo.build/repo)** - Système de build monorepo haute performance
- **[pnpm](https://pnpm.io/)** - Gestionnaire de paquets efficace
- **[ESLint](https://eslint.org/)** - Linting du code
- **[Prettier](https://prettier.io/)** - Formatage automatique du code

## 📁 Architecture du projet

```
65.Monorepo/
├── apps/
│   ├── 65.api/          # API NestJS
│   │   ├── src/
│   │   │   ├── controllers/  # Contrôleurs REST
│   │   │   ├── services/     # Logique métier
│   │   │   ├── repository/   # Accès aux données
│   │   │   ├── entities/     # Modèles de données TypeORM
│   │   │   └── middleware/   # Middlewares (Auth, etc.)
│   │   └── database.db       # Base de données SQLite
│   └── 65.front/        # Application Next.js
│       ├── app/         # App Router (Pages)
│       ├── components/  # Composants React réutilisables
│       ├── lib/         # Utilitaires et helpers
│       ├── queries/     # Requêtes TanStack Query
│       └── model/       # Types TypeScript
├── packages/
│   ├── ui/              # Composants UI partagés
│   ├── eslint-config/   # Configuration ESLint
│   └── typescript-config/ # Configuration TypeScript
└── data/                # Données statiques
```

## 🚀 Installation et développement

### Prérequis

- Node.js 18+
- pnpm

### Installation

```bash
# Cloner le repository
git clone [url-du-repo]
cd 65.Monorepo

# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm dev
```

### Scripts disponibles

```bash
# Développement (tous les apps)
pnpm dev

# Build de production
pnpm build

# Linter
pnpm lint

# Développement frontend uniquement
pnpm dev --filter=65.front

# Développement API uniquement
pnpm dev --filter=65.api
```

## 📊 Base de données

L'application utilise SQLite avec TypeORM et comprend les entités principales :

- **Users** : Gestion des utilisateurs et rôles
- **Categories** : Types d'activités de montagne
- **States** : Massifs et zones géographiques
- **Hikes** : Activités avec toutes leurs informations
- **Images** : Galeries photos associées aux activités
- **HikeGPX** : Fichiers GPS pour les tracés
- **Difficulties** : Niveaux de difficulté
- **Favorites** : Activités favorites des utilisateurs

## 🗺️ Fonctionnalités cartographiques

- **Cartes interactives** avec Leaflet
- **Affichage des tracés GPX** sur la carte
- **Markers géolocalisés** pour chaque activité
- **Export des fichiers GPX** pour utilisation sur appareils GPS
- **Analyse des profils d'élévation**

## 👥 Contribution

Ce projet est maintenu par Simon Desdevises. Pour toute question ou suggestion d'amélioration, n'hésitez pas à prendre contact.

## 📧 Contact

**Développeur** : Simon Desdevises  
**Email** : [simondesdevises@gmail.com](mailto:simondesdevises@gmail.com)  
**Site web** : [65PassionMontagne.simondesdevises.com](https://65PassionMontagne.simondesdevises.com)

---

_Explorez les Hautes-Pyrénées comme jamais auparavant avec 65 Passion Montagne !_ 🏔️✨
