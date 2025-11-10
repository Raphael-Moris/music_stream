# Utiliser Node.js 18 sur Alpine Linux (image légère)
FROM node:18-alpine

# Installer les outils de build nécessaires pour bcrypt
RUN apk add --no-cache python3 make g++

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier tout le code source
COPY . .

# Exposer le port de l'application
EXPOSE 3500

# Vérification de santé du conteneur
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3500/api/songs', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]
