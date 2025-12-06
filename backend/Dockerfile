FROM php:8.2-cli

# Installation des dépendances système et PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Installation des extensions PHP (MySQL + PostgreSQL)
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# Configuration du répertoire de travail
WORKDIR /var/www/html

# Copie des fichiers de l'application
COPY . .

# Permissions pour les uploads
RUN mkdir -p public/uploads public/images \
    && chmod -R 777 public/uploads public/images

# Render utilise la variable PORT (default 10000)
EXPOSE 10000

# Démarrage du serveur PHP intégré
CMD php -S 0.0.0.0:${PORT:-10000} -t public
