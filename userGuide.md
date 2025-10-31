# Guide utilisateur - Edemo Live

## À propos d'Edemo Live

**Edemo Live** est une plateforme de présentation interactive en temps réel qui permet à un présentateur de partager des documents (images, PDFs, vidéos) avec des spectateurs tout en offrant des fonctionnalités avancées de zoom, navigation et communication bidirectionnelle.

**URL de l'application** : Déployée sur Railway (accessible via le lien de session)

**Accès** : Public pour les spectateurs, authentification requise pour les présentateurs

## Technologies utilisées

**Edemo Live** est propulsé par une stack technologique moderne et performante développée avec **Manus AI** :

- **Frontend** : React 19 avec TypeScript, Tailwind CSS 4, shadcn/ui pour une interface utilisateur moderne et réactive
- **Backend** : Node.js avec Express 4, tRPC 11 pour une API type-safe, Drizzle ORM pour la gestion de la base de données
- **Base de données** : MySQL/TiDB pour un stockage fiable et scalable
- **Stockage** : Amazon S3 pour l'hébergement des fichiers (images, PDFs, vidéos)
- **Authentification** : Manus OAuth avec JWT pour une sécurité optimale
- **Déploiement** : Infrastructure auto-scaling avec CDN global pour des performances optimales partout dans le monde

## Utiliser Edemo Live

### Pour les présentateurs

#### Créer une nouvelle présentation

1. Connectez-vous à l'application avec votre compte Manus
2. Cliquez sur **"Nouvelle présentation"** depuis la page d'accueil
3. Une session unique est créée avec un code de session (ex: **2WVZGZV2**)
4. Partagez ce code ou le lien direct avec vos spectateurs

#### Partager des documents

Vous disposez de **trois méthodes** pour partager des documents :

**Méthode 1 : Vignettes (colonne gauche)**
- Cliquez sur la zone **"Glisser un fichier ici"** en haut à gauche
- Sélectionnez un fichier (image, PDF, vidéo)
- Le document apparaît comme vignette dans la colonne gauche
- Cliquez sur une vignette pour l'afficher en grand à tous les spectateurs

**Méthode 2 : Barre de contrôle universelle**
- Utilisez la zone **"Glisser un fichier ici"** dans la barre centrée en haut du viewer
- Le document s'affiche immédiatement pour tous

**Méthode 3 : Chat**
- Cliquez sur l'icône trombone (📎) dans le chat
- Sélectionnez un fichier
- Le document est envoyé dans le chat et visible par tous
- Cliquez sur le document dans le chat pour l'afficher en grand

#### Contrôler la présentation

**Barre de contrôle universelle** (centrée en haut du viewer) :
- **← →** : Naviguer entre les pages d'un PDF
- **Page/Total** : Affiche la page actuelle (ex: 1/14), cliquez pour saisir un numéro de page
- **Slider de zoom** : Ajustez le zoom de 50% à 200%
- **R** : Réinitialiser le zoom et le déplacement à 100%
- **Glisser un fichier ici** : Upload rapide de documents

**Zoom et déplacement** :
- Utilisez le slider de zoom ou la molette de la souris pour zoomer
- À partir de **100% de zoom**, un pointeur rouge (👆) apparaît pour guider l'attention des spectateurs
- Cliquez et glissez pour déplacer le document zoomé
- Le zoom et le déplacement sont **synchronisés en temps réel** avec tous les spectateurs

**Sélection rectangulaire** :
- Maintenez **Ctrl** et cliquez-glissez sur le document pour créer une zone de focus
- La zone apparaît en bleu avec un bouton de fermeture (X)
- Tous les spectateurs voient la zone sélectionnée

#### Communiquer avec les spectateurs

**Chat bidirectionnel** :
- Tapez votre message dans la zone de texte en haut du chat
- Cliquez sur le bouton vert **"Envoyer"** ou appuyez sur Entrée
- Vos messages apparaissent avec un fond **vert**
- Les messages des spectateurs apparaissent avec un fond **bleu**
- Cliquez sur le bouton **"X"** rouge pour supprimer tous les messages

**Aperçu spectateur** :
- Cliquez sur l'icône **"Monitor"** dans l'en-tête pour ouvrir une fenêtre flottante
- Cette fenêtre affiche exactement ce que voient les spectateurs en temps réel
- Vous pouvez redimensionner et déplacer cette fenêtre

#### Partager la session

**Copier le lien** :
- Cliquez sur le bouton **"Copier"** en haut à droite
- Le lien de la session spectateur est copié dans le presse-papiers
- Partagez ce lien par email, SMS ou tout autre moyen

**Partage WhatsApp** :
- Cliquez sur le bouton **"WhatsApp"** (icône verte)
- Un message pré-rempli s'ouvre : **"Santéo présentation : [lien]"**
- Sélectionnez vos contacts et envoyez

#### Terminer la présentation

- Cliquez sur le bouton rouge **"Terminer"** en haut à droite
- Le statut passe de **🟢 Active** à **🔴 Inactive**
- Les spectateurs ne peuvent plus rejoindre la session
- Vous pouvez réactiver la session en cliquant à nouveau sur le statut

### Pour les spectateurs

#### Rejoindre une présentation

1. Recevez le lien de session du présentateur
2. Cliquez sur le lien ou entrez le code de session sur la page d'accueil
3. Vous êtes automatiquement connecté à la présentation en cours

#### Suivre la présentation

- Le document affiché par le présentateur apparaît automatiquement sur votre écran
- Le zoom et le déplacement sont **synchronisés** : vous voyez exactement ce que le présentateur montre
- Le pointeur rouge (👆) indique où le présentateur pointe
- Les zones de sélection rectangulaire apparaissent automatiquement

#### Participer au chat

- Tapez votre message dans la zone de texte en haut du chat
- Cliquez sur le bouton bleu **"Envoyer"** ou appuyez sur Entrée
- Vos messages apparaissent avec un fond **bleu**
- Les messages du présentateur apparaissent avec un fond **vert**

#### Partager des documents

**Upload de documents** :
- Cliquez sur la zone **"Glisser un fichier ici"** dans la colonne de gauche
- Sélectionnez un fichier (image, PDF, vidéo)
- Le document apparaît comme vignette dans votre colonne de gauche
- Cliquez sur une vignette pour l'afficher en grand pour **tous les participants** (présentateur inclus)

**Supprimer vos documents** :
- Survolez une vignette que vous avez uploadée
- Cliquez sur le bouton **"×"** rouge en haut à droite
- Le document est supprimé de votre liste

**Télécharger un document** :
- Cliquez sur l'icône **"Télécharger"** (flèche bleue) en bas à gauche d'une vignette
- Le fichier est téléchargé sur votre appareil

**Partager sur WhatsApp** :
- Cliquez sur l'icône **"WhatsApp"** (verte) en haut à gauche d'une vignette
- Un message pré-rempli s'ouvre avec le lien du document

## Gérer votre application

### Panneau de gestion

Accédez au **Management UI** (panneau droit) pour gérer votre application :

**Preview** : Aperçu en direct du serveur de développement avec états de connexion persistants

**Code** : Arborescence des fichiers avec option de téléchargement de tous les fichiers

**Dashboard** : Moniteur de statut, contrôles de visibilité, analytics (UV/PV) pour les sites publiés

**Database** : Interface CRUD complète avec informations de connexion en bas à gauche (activez SSL)

**Settings** : Plusieurs sous-panneaux accessibles via la navigation latérale
- **General** : Nom et logo du site (VITE_APP_TITLE/VITE_APP_LOGO), paramètres de visibilité
- **Domains** : Modifier le préfixe de domaine auto-généré (xxx.manus.space) ou lier des domaines personnalisés
- **Notifications** : Paramètres de notification pour l'API de notification intégrée
- **Secrets** : Voir/modifier/supprimer les variables d'environnement existantes en toute sécurité

**Bouton Publish** : Dans l'en-tête (en haut à droite), activé après la création d'un checkpoint

### Base de données

**Accès à la base de données** :
1. Ouvrez le panneau **Database** dans le Management UI
2. Consultez les informations de connexion en bas à gauche
3. **Activez SSL** pour une connexion sécurisée
4. Utilisez l'interface CRUD pour gérer vos données

**Tables principales** :
- `users` : Utilisateurs authentifiés
- `presentations` : Sessions de présentation
- `documents` : Fichiers uploadés
- `chatMessages` : Messages du chat
- `commercialLinks` : Liens commerciaux personnalisés

### Déploiement

**Publication** :
1. Créez un checkpoint via le bouton **"Save Checkpoint"** dans le Management UI
2. Cliquez sur le bouton **"Publish"** dans l'en-tête
3. Votre application est déployée automatiquement sur l'infrastructure Manus

**Rollback** :
- Accédez à l'historique des checkpoints dans le Management UI
- Cliquez sur **"Rollback"** pour revenir à une version précédente

## Prochaines étapes

**Parlez à Manus AI à tout moment** pour demander des modifications ou ajouter des fonctionnalités. Quelques suggestions :

- Ajouter un système de sondages en temps réel pendant les présentations
- Intégrer des annotations collaboratives sur les documents
- Créer des rapports d'analytics détaillés pour chaque session
- Ajouter la possibilité d'enregistrer les présentations en vidéo
- Implémenter un système de questions-réponses avec votes

**Manus AI** est là pour vous accompagner dans l'évolution de votre plateforme ! 🚀

---

**Développé avec** [Manus AI](https://manus.im)

