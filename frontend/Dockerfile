FROM node:20-alpine

# Installation de pnpm (plus rapide que npm)
RUN npm install -g pnpm

# Répertoire de travail
WORKDIR /app

# Copie des fichiers package
COPY package*.json ./

# Installation des dépendances
RUN pnpm install

# Copie du reste des fichiers
COPY . .

# Exposition du port
EXPOSE 3000

# Démarrage de l'application
CMD ["pnpm", "dev"]
