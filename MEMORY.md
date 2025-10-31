# 🧠 MÉMOIRE DU SYSTÈME - EDEMO LIVE

**Date de création** : 31 octobre 2025  
**Dernière mise à jour** : 31 octobre 2025

---

## 📡 CONNEXIONS EXTERNES

### **GitHub**
- **Dépôt** : `fabcoh/edemo-interactif`
- **URL** : `https://github.com/fabcoh/edemo-interactif`
- **Branche principale** : `main`
- **Propriétaire** : `fabcoh`
- **Statut** : ✅ Configuré avec token
- **Push automatique** : ✅ OUI (Manus peut pusher directement)
- **Note** : Les commits peuvent être pushés automatiquement via `git push github main`

### **Railway (Production)**
- **Service** : Hébergement du site en production
- **URL de production** : **https://edemo-interactif-production.up.railway.app**
- **Connexion GitHub** : ✅ Configuré sur `fabcoh/edemo-interactif`
- **Déploiement auto** : ✅ Oui (détecte les push sur GitHub)
- **Temps de déploiement** : ~2-5 minutes après push
- **Dernier déploiement** : ✅ Réussi (31 octobre 2025)
- **Note** : Railway surveille le dépôt GitHub et redéploie automatiquement

### **Base de données**
- **Type** : MySQL/TiDB Cloud
- **Hébergement** : TiDB Cloud (fourni par Manus)
- **Connexion** : Via `DATABASE_URL` (env variable)
- **Statut** : ✅ Opérationnelle
- **Partage dev/prod** : ✅ OUI (même base de données pour les deux environnements)
- **Host** : `gateway02.us-east-1.prod.aws.tidbcloud.com:4000`
- **Tables principales** :
  - `users` - Utilisateurs et commerciaux
  - `presentation_sessions` - Sessions de présentation
  - `session_documents` - Documents uploadés
  - `session_instances` - Instances de présentation
  - `presentation_messages` - Messages du chat
  - `presenter_cursors` - Position curseur présentateur
  - `viewer_cursors` - Position curseurs spectateurs
  - `commercial_access_links` - Liens d'accès commerciaux

### **Stockage S3**
- **Service** : Manus S3 (Built-in)
- **Utilisation** : Upload de documents (PDF, images, vidéos)
- **Accès** : Via `storagePut()` dans `server/storage.ts`
- **Note** : Les fichiers sont stockés avec URLs publiques

---

## 🚀 ARCHITECTURE DE DÉPLOIEMENT

### **Environnements**

1. **Développement (Manus)**
   - URL : `https://3000-ih44u8onzba9v1o4wiete-6d7b15e5.manusvm.computer`
   - Port : 3000 ou 3001 (dynamique)
   - Hot reload : ✅ Activé
   - Utilisation : Tests et développement

2. **Production (Railway)**
   - URL : **https://edemo-interactif-production.up.railway.app**
   - Déploiement : Automatique depuis GitHub
   - Status : 🟢 ACTIVE
   - Base de données : ✅ Partagée avec dev (même DATABASE_URL)

### **Workflow de déploiement**

```
┌─────────────────────────────────────────────────────────┐
│                    MANUS (Développement)                │
│  - Serveur de dev (port 3000/3001)                     │
│  - Hot reload activé                                    │
│  - URL: https://3000-xxx.manusvm.computer              │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ git commit + git push github main
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    GITHUB (Dépôt)                       │
│  - Dépôt: fabcoh/edemo-interactif                      │
│  - Stocke le code source                               │
│  - Historique des commits                              │
│  - URL: https://github.com/fabcoh/edemo-interactif    │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Railway surveille le dépôt
                 │ Détecte automatiquement les push
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  RAILWAY (Production)                   │
│  - Détecte le push sur GitHub                          │
│  - Clone le code depuis GitHub                         │
│  - Build automatique (pnpm run build)                  │
│  - Déploie en production                               │
│  - URL: https://edemo-interactif-production.up...     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              TiDB Cloud (Base de données)               │
│  - Host: gateway02.us-east-1.prod.aws.tidbcloud.com   │
│  - Fournie par Manus                                   │
│  - Partagée entre dev et prod                          │
└────────────┬────────────────────────────────┬───────────┘
             │                                │
             │ DATABASE_URL                   │ DATABASE_URL
             │                                │
             ▼                                ▼
    ┌─────────────────┐            ┌─────────────────┐
    │  MANUS (Dev)    │            │  RAILWAY (Prod) │
    └─────────────────┘            └─────────────────┘
```

---

## ⚠️ PROBLÈME CONNU : CHECKPOINTS MANUS

**Statut** : ❌ Plus de checkpoints disponibles sur le plan actuel

**Impact** :
- Impossible de déployer via le bouton "Publish" de Manus
- Nécessité d'utiliser GitHub + Railway pour le déploiement

**Solution adoptée** :
- ✅ Utiliser Git pour les sauvegardes
- ✅ Pousser sur GitHub depuis la machine locale
- ✅ Railway redéploie automatiquement

**Alternative future** :
- Upgrader le plan Manus pour plus de checkpoints
- Ou continuer avec GitHub + Railway (gratuit)

---

## 🔐 VARIABLES D'ENVIRONNEMENT

**Injectées automatiquement par Manus** :
- `DATABASE_URL` - Connexion MySQL
- `JWT_SECRET` - Signature des sessions
- `VITE_APP_ID` - ID de l'application
- `OAUTH_SERVER_URL` - Serveur OAuth Manus
- `BUILT_IN_FORGE_API_KEY` - Clé API Manus
- `BUILT_IN_FORGE_API_URL` - URL API Manus
- `OWNER_OPEN_ID` - ID du propriétaire
- `OWNER_NAME` - Nom du propriétaire

**Note** : Ces variables sont automatiquement disponibles en dev et doivent être configurées manuellement sur Railway

---

## 📝 HISTORIQUE DES MODIFICATIONS IMPORTANTES

### **31 octobre 2025**
- ✅ Interface présentateur optimisée (header compact)
- ✅ Panneau debug supprimé
- ✅ Espace viewer agrandi de 40-50%
- 📝 Commit : `c6ad23b` - "Interface présentateur optimisée - Header compact + Debug supprimé"

### **Fonctionnalités principales implémentées**
- ✅ Système d'instances de session (multi-présentateurs)
- ✅ Chat en temps réel (style WhatsApp)
- ✅ Upload de documents (PDF, images, vidéos)
- ✅ Zoom et pan synchronisés
- ✅ Curseur visible en temps réel
- ✅ Liens d'accès commerciaux
- ✅ Partage WhatsApp

---

## 🔄 DERNIÈRE SYNCHRONISATION

- **Dernier commit local** : `923e344`
- **Dernier push GitHub** : ✅ `923e344` (31 octobre 2025)
- **Dernier déploiement Railway** : ✅ Réussi (31 octobre 2025)
- **URL de production** : https://edemo-interactif-production.up.railway.app
- **Commits récents** :
  - `923e344` - Mise à jour MEMORY + WORKFLOW avec vraies infos GitHub
  - `cd90a57` - Ajout système de mémoire persistante (MEMORY, VIGILANCE, WORKFLOW)
  - `c6ad23b` - Interface présentateur optimisée - Header compact + Debug supprimé

---

**⚠️ IMPORTANT** : Ce fichier doit être mis à jour à chaque modification importante du système !

