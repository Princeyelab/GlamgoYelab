/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Variables d'environnement
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  },

  // Configuration des images optimisées
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Optimisations de compilation
  compiler: {
    // Supprime console.log en production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimisations expérimentales
  experimental: {
    // Optimise les fonts et les imports de packages
    optimizePackageImports: ['react-leaflet', 'leaflet'],
    // Cache webpack optimisé (pour les builds de production uniquement)
    webpackBuildWorker: true,
    // Active le cache du serveur pour des réponses plus rapides
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimisation du staleTimes - augmenté pour dev
    staleTimes: {
      dynamic: 30, // 30 secondes pour les pages dynamiques
      static: 300, // 5 minutes pour les pages statiques
    },
    // Optimise le cache client en développement
    optimisticClientCache: true,
  },

  // Configuration Turbopack pour HMR optimisé
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
    // Optimisations additionnelles pour dev
    rules: {
      // Exclure les fichiers de test du HMR
      '*.test.{js,jsx,ts,tsx}': {
        loaders: [],
      },
    },
  },

  // Optimiser le dev server
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Production source maps désactivés pour accélérer le build
  productionBrowserSourceMaps: false,

  // Optimisation des imports
  modularizeImports: {
    'react-leaflet': {
      transform: 'react-leaflet/{{member}}',
    },
  },

  // Compression
  compress: true,

  // Mode standalone désactivé pour réduire le temps de build
  // output: 'standalone',
}

module.exports = nextConfig
