FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers package
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers
COPY . .

# Variable d'environnement pour le build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build de l'application
RUN npm run build

# Image de production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copie des fichiers nécessaires
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
