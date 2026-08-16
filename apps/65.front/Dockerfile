# Stage 1: Build
FROM node:20-alpine AS builder

# libc6-compat pour les dépendances sur Alpine (musl).
# python3/make/g++ requis pour compiler better-sqlite3 (dépendance de better-auth).
RUN apk add --no-cache libc6-compat python3 make g++

# Installer pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copier les fichiers de configuration du monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# Copier le package.json du front
COPY apps/65.front/package.json ./apps/65.front/

# Installer uniquement les dépendances du front
RUN pnpm install --frozen-lockfile --filter 65.front...

# Copier le code source du front
COPY apps/65.front/ ./apps/65.front/

# Variables publiques inlinées par Next.js au moment du build.
# Dans Coolify, définir ces variables d'environnement :
# elles sont automatiquement passées en build args.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_IMAGE_URL=$NEXT_PUBLIC_IMAGE_URL

# Build l'application (output standalone)
RUN pnpm --filter 65.front build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copier la sortie standalone (serveur Node minimal + dépendances tracées)
COPY --from=builder --chown=nextjs:nodejs /app/apps/65.front/.next/standalone ./

# Copier les assets statiques et les fichiers publics
COPY --from=builder --chown=nextjs:nodejs /app/apps/65.front/.next/static ./apps/65.front/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/65.front/public ./apps/65.front/public

USER nextjs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "apps/65.front/server.js"]
