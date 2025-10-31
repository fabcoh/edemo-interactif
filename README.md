# Edemo Live - Plateforme de présentation interactive

**Edemo Live** est une plateforme web de présentation interactive en temps réel permettant à un présentateur de partager des documents (images, PDFs, vidéos) avec des spectateurs tout en offrant des fonctionnalités avancées de zoom, navigation et chat bidirectionnel.

## 🎯 Fonctionnalités principales

### Présentation interactive
- **Upload de documents** : Images, PDFs multi-pages, vidéos
- **Barre de contrôle universelle** : Navigation pages (← page/total →), zoom (50-200%), reset, upload
- **Zoom et pan synchronisés** : Le présentateur contrôle le zoom et le déplacement, synchronisés en temps réel avec tous les spectateurs
- **Pointeur visuel** : Main avec doigt pointé (👆) visible par tous les spectateurs pour guider l'attention
- **Sélection rectangulaire** : Ctrl+Clic pour créer une zone de focus visible par tous

### Chat bidirectionnel
- **Messages texte** : Communication présentateur ↔ spectateurs
- **Partage de documents** : Upload de fichiers directement dans le chat avec affichage automatique
- **Différenciation visuelle** : Messages présentateur (vert) vs spectateurs (bleu)
- **Vignettes cliquables** : Clic sur un document du chat pour l'afficher en grand

### Système de sessions
- **Codes de session uniques** : Chaque présentation a un code unique (ex: 2WVZGZV2)
- **Instances multiples** : Plusieurs présentateurs peuvent avoir des sessions simultanées
- **Historique** : Conservation des présentations passées
- **Statut cliquable** : Toggle 🟢 Active / 🔴 Inactive

### Aperçu flottant
- **Vue spectateur** : Fenêtre flottante montrant ce que voient les spectateurs en temps réel
- **Iframe scrollable** : Navigation complète dans l'aperçu
- **Redimensionnable** : Ajustement de la taille de la fenêtre

### Partage et liens commerciaux
- **Copier le lien** : Lien direct vers la session spectateur
- **Partage WhatsApp** : Message pré-rempli "Santéo présentation : [lien]"
- **Liens commerciaux** : Système de liens personnalisés pour chaque présentation

## 🛠️ Stack technique

### Frontend
- **React 19** avec TypeScript
- **Tailwind CSS 4** pour le styling
- **shadcn/ui** pour les composants UI
- **Wouter** pour le routing
- **TanStack Query** pour la gestion des données
- **tRPC** pour la communication client-serveur
- **react-pdf** pour l'affichage des PDFs

### Backend
- **Node.js** avec Express 4
- **tRPC 11** pour l'API type-safe
- **Drizzle ORM** pour la base de données
- **MySQL/TiDB** comme base de données
- **JWT** pour l'authentification
- **S3** pour le stockage des fichiers

### Infrastructure
- **Vite** pour le build et le dev server
- **pnpm** comme gestionnaire de paquets
- **Railway** pour le déploiement
- **Manus OAuth** pour l'authentification

## 📦 Installation

```bash
# Installer les dépendances
pnpm install

# Configurer la base de données
pnpm db:push

# Lancer le serveur de développement
pnpm dev
```

## 🚀 Déploiement

Le projet est configuré pour un déploiement automatique sur Railway via Git push.

```bash
# Commit des changements
git add .
git commit -m "Description des modifications"

# Push vers Railway (déploiement automatique)
git push railway main
```

## 📝 Structure du projet

```
edemo-interactif/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── Home.tsx
│   │   │   ├── Presenter.tsx
│   │   │   ├── PresenterControl.tsx
│   │   │   └── Viewer.tsx
│   │   ├── components/    # Composants réutilisables
│   │   ├── contexts/      # Contextes React
│   │   └── lib/           # Utilitaires
│   └── public/            # Assets statiques
├── server/                # Backend Node.js
│   ├── routers.ts         # Routes tRPC
│   ├── db.ts              # Fonctions base de données
│   └── _core/             # Configuration serveur
├── drizzle/               # Schéma base de données
│   └── schema.ts
└── shared/                # Types partagés
```

## 🔑 Variables d'environnement

Les variables suivantes sont automatiquement injectées par la plateforme Manus :

- `DATABASE_URL` : Connexion MySQL/TiDB
- `JWT_SECRET` : Secret pour les sessions
- `VITE_APP_ID` : ID de l'application OAuth
- `OAUTH_SERVER_URL` : URL du serveur OAuth
- `BUILT_IN_FORGE_API_URL` : API Manus (LLM, storage, notifications)
- `BUILT_IN_FORGE_API_KEY` : Token d'authentification API

## 📚 Documentation

- **Guide utilisateur** : Voir `userGuide.md`
- **Template README** : Voir le README du template pour les détails techniques

## 🤝 Contribution

Ce projet utilise le template **Web App Template (tRPC + Manus Auth + Database)** de Manus.

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Développé avec** [Manus AI](https://manus.im)

