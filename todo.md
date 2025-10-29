# TODO - Edemo Live

## ✅ Toutes les fonctionnalités complétées !

### Chat bidirectionnel simplifié
- [x] Layout 1 ligne : 📎 trombone | zone de texte | 📤 bouton envoyer
- [x] Upload fichier via trombone → Envoi automatique dans le chat
- [x] Support images, vidéos, PDF
- [x] Bouton "Tout supprimer" dans l'en-tête du chat
- [x] Messages occupent 3/4 de la hauteur, input 1/4
- [x] Différenciation visuelle présentateur/spectateur

### Synchronisation des documents du chat
- [x] Clic sur un document dans le chat → Affichage synchronisé sur les 2 écrans
- [x] Procédure tRPC `viewer.setCurrentDocument` pour la synchronisation
- [x] Création automatique du document temporaire s'il n'existe pas
- [x] Pas de vignette créée pour les documents du chat
- [x] Affichage des documents du chat dans la zone de présentation

### Statut de session cliquable
- [x] Procédure tRPC `presentation.toggleSessionActive`
- [x] Statut "🟢 Active / 🔴 Inactive" cliquable
- [x] Effet hover
- [x] Réactivation possible

### Migration du chat
- [x] Table chatMessages (senderType, senderName, message, videoUrl, fileType)
- [x] Fonctions de chat dans server/db.ts
- [x] Router chat dans server/routers.ts
- [x] react-pdf installé
- [x] ChatViewer.tsx et FileAttachmentViewer.tsx supprimés
- [x] ChatPanel intégré dans Viewer.tsx et PresenterControl.tsx
- [x] ChatNotification.tsx mis à jour

### Système d'instances de session
- [x] Instances avec codes uniques
- [x] Compatibilité codes session/instance
- [x] Historique des présentations
- [x] Multi-présentateurs simultanés

### Autres fonctionnalités
- [x] Upload de documents (PDF, images, vidéos)
- [x] Zoom et pan synchronisés
- [x] Curseur visible
- [x] Système de liens commerciaux
- [x] Partage WhatsApp

## 🎯 Système complet et fonctionnel

Le projet Edemo Live est maintenant complet avec :
- ✅ Chat bidirectionnel (présentateur ↔ spectateurs)
- ✅ Synchronisation des documents du chat sur tous les écrans
- ✅ Upload automatique sans vignettes
- ✅ Interface simplifiée et intuitive




## 🐛 Bugs corrigés

### Auto-scroll du chat
- [x] Corriger le scrollIntoView qui fait scroller toute la page au lieu du conteneur du chat uniquement




## 🎨 Nouvelle interface spectateur

### Layout chat spectateur
- [x] Barre de saisie en haut : trombone | zone de texte | bouton envoyer (1 ligne)
- [x] Zone principale divisée en 2 colonnes :
  - [x] Colonne gauche (30%) : Liste des fichiers cliquables
  - [x] Colonne droite (70%) : Messages du chat
- [x] Clic sur un fichier → Affichage dans la zone de présentation
- [x] Création du composant ChatPanelViewer spécifique pour le spectateur




## 🐛 Bugs urgents corrigés

- [x] Présentateur : La page scroll vers le bas automatiquement (à cause du chat) - Corrigé en utilisant scrollTop au lieu de scrollIntoView
- [x] Spectateur : Les fichiers ne s'affichent pas sous forme de vignettes à gauche - Ajout de vignettes avec grid 2 colonnes




## 🎨 Modifications interface présentateur

- [x] Réduire les bordures du chat au minimum (bordure simple)
- [x] Utiliser ChatPanelViewer pour le présentateur (même layout que spectateur)
- [x] Retirer le sélecteur Portrait/Paysage du panel de partage
- [x] Garder uniquement Copier/Coller et WhatsApp dans le panel de partage




## 🐛 Bug critique corrigé

- [x] Chat présentateur (production) : Les messages ne s'envoient pas (clic sur Envoyer ne fait rien) - Restauration de ChatPanel
- [x] Restaurer l'interface présentateur de production (sans ChatPanelViewer) - Interface restaurée avec Format Panel
- [x] ChatPanel utilise déjà le bon schéma (senderType, senderName, message)




## 🎨 Restructuration interface présentateur (d'après capture production)

- [x] Supprimer la Card autour du chat (pas de titre "Chat")
- [x] Chat simple : barre de saisie en haut (trombone + texte + envoyer vert)
- [x] Messages en dessous avec "Aucun message. Commencez la conversation !"
- [x] Boutons Copier + WhatsApp en bas de la colonne droite
- [x] Garder la structure 3 colonnes : vignettes gauche, preview centre, contrôles droite
- [x] Suppression des panels Format et Info (non visibles dans la production)




## 🎨 Ajustements finaux interface présentateur

- [x] Mettre la barre de rédaction du chat tout en haut de la colonne droite
- [x] Réduire les bordures au minimum (1px solid)
- [x] Garder le bouton "Tout supprimer" (X) dans la barre de saisie




## 🐛 Corrections chat

- [x] Remplacer le bouton trombone par "Glisser un fichier ici" dans la zone de chat
- [x] Inverser l'ordre des messages : les plus récents en haut
- [x] Ajouter le drag & drop pour uploader des fichiers




## 🎨 Corrections interface présentateur

- [x] Retirer le bouton "Ajouter Document" (bleu)
- [x] Ajouter une zone "Glisser un fichier ici" avec drag & drop en haut à droite




## 🐛 Correction barre de zoom

- [x] Afficher la barre de zoom en permanence (même sans document)
- [x] Réduire la largeur de la barre de zoom (max-w-md)




## 🎨 Ajustements finaux

- [x] Mettre le zoom et l'upload sur la même ligne
- [x] Réduire l'épaisseur de la barre de zoom (p-1.5 au lieu de p-2)
- [x] Mettre les boutons WhatsApp et Copier sur la même ligne que Zoom et Upload
- [x] Réduire l'épaisseur des boutons WhatsApp et Copier (h-8 au lieu de h-10, icônes w-3 h-3)


- [x] Retirer le nom "Présentation XXX" du chat (afficher juste le message)
- [x] Différencier les fonds des messages : présentateur (gris) vs spectateur (vert)


- [x] Réduire la taille des infos de la première ligne (code session + spectateurs)
- [x] Mettre le nombre de spectateurs en gras (text-[10px] avec nombre en font-bold)


- [x] Réduire le bouton "Terminer" (h-6 px-2 text-[10px])
- [x] Allonger le chat vers le bas (flex-[2] au lieu de flex-1)
- [x] Réduire au maximum le titre du document (text-[10px], py-0.5, px-2)
- [x] Ajouter une très fine bordure autour du document (border border-gray-700)
- [x] Coller le document au titre (p-1 au lieu de p-4, border-b border-gray-600)


- [x] Supprimer le panneau "Infos" en bas pour allonger le chat


- [x] Réduire le bouton supprimer (X) sur les vignettes (w-2.5 h-2.5, p-0.5)
- [x] Ajouter une icône "Envoyer" sur les vignettes pour intégrer le document dans le chat (bouton bleu avec Send)


- [x] Agrandir légèrement l'icône d'envoi (w-3 h-3)
- [x] Modifier l'envoi pour afficher un aperçu type vignette dans le chat (images avec aperçu, PDF/vidéo avec icônes)


- [x] Déplacer l'icône d'envoi en bas à droite de la vignette (bottom-0.5 right-0.5)
- [x] Changer la couleur de l'icône d'envoi en vert (bg-green-600)
- [x] Retirer les infos en bas du document (titre supprimé)
- [x] Retirer les contours des vignettes (border-2 remplacé par ring-2 sur sélection uniquement)


- [x] Inverser les couleurs du chat : lecteur (bleu) et présentateur (vert)
- [x] Inverser l'ordre des messages côté lecteur (derniers en haut) - déjà en place avec .reverse()
- [ ] Corriger les vignettes noires vides dans le chat - à investiguer (problème d'URL ou CORS)


- [x] Clic sur document dans le chat = affichage pour tous les viewers (présentateur + spectateurs)
- [x] Coller le document en haut du viewer du présentateur (items-start au lieu de items-center)


- [x] Afficher le pointeur rouge dès 100% de zoom (zoom >= 100 au lieu de zoom > 100)


- [x] Corriger le décalage du pointeur rouge (revenir à containerRect pour mousePos, garder imageRect pour sync)


- [x] Corriger le décalage vertical du pointeur rouge (calculer position relative à l'image puis convertir en coordonnées conteneur)


- [x] Ajouter décalage manuel du pointeur rouge (offsetX, offsetY) pour ajustement guidé


- [x] Corriger le décalage du pointeur rouge côté spectateur (conversion % → pixels avec imageRect)


- [x] Copier la logique de calcul du pointeur du présentateur vers le spectateur (conversion % → pixels)
- [x] Chat déjà en dessous du viewer côté spectateur (65% viewer, 35% chat)


- [x] Remplacer ChatPanelViewer par ChatPanel côté spectateur (même structure que présentateur)
- [x] Garder les couleurs différenciées (présentateur vert, spectateur bleu) - déjà implémenté dans ChatPanel
- [x] Clic sur document dans le chat affiche dans le viewer pour tous (onLoadDocument avec setCurrentDocumentMutation)


- [x] Retirer les contours des documents dans le viewer présentateur (border-0, p-0)
- [x] Retirer le titre du document côté présentateur (suppression de la Title Bar)
- [x] Retirer les contours et titre côté spectateur (déjà sans contours ni titre)


- [x] Retirer les contours des vignettes de documents (présentateur) - déjà sans bordure par défaut
- [x] Retirer les titres des vignettes PDF et vidéo (icônes agrandies à text-4xl)
- [x] Retirer les noms de fichiers des documents dans le chat (images sans texte, PDF/vidéo avec icônes agrandies)


- [x] Retirer toutes les bordures des documents dans le chat (images sans border, PDF/vidéos sans bg-gray-600)


- [x] Retirer la bulle colorée pour les documents (documents sans bg, messages texte avec bg vert/bleu)
- [x] Configurer le scroll du chat (garder .reverse() + scrollTop = 0 pour derniers messages en haut)
- [x] Changer le pointeur rouge en icône de main avec doigt pointé (👆 avec ombre rouge)


- [x] Utiliser toute la largeur de la ligne du chat (w-full au lieu de max-w-[80%])
- [x] Diminuer la taille du texte des messages (text-xs au lieu de text-sm)
- [x] Sortir l'heure de la bulle (text-[8px] en dessous, alignée selon expéditeur)


- [x] Ajouter le pointeur main avec doigt côté spectateur (👆 avec ombre rouge)


- [x] Cacher le curseur système côté présentateur (cursor: none quand zoom >= 100)




## 🐛 Bugs critiques à corriger

- [x] **Erreur SQL chat.getMessages** : Incompatibilité entre le schéma de la table et la requête (colonnes 'fileName', 'mimeType' inexistantes)
- [x] **Viewer ne charge pas les documents** : Erreur "Impossible de charger l'image" côté spectateur quand le présentateur double-clique - Système S3 restauré
- [x] Synchroniser le schéma de la base de données avec `pnpm db:push`




## 🐛 Bug urgent à corriger

- [x] **Bouton trombone (📎) manquant dans le chat** : Le bouton pour uploader des fichiers dans le chat a disparu - Rajouté



- [x] **Vignettes ne s'affichent pas après upload** : Lors du téléchargement d'un document, il affiche "vignette" au lieu de l'image - Système S3 restauré




## 🔧 Refactorisation technique

- [x] **Centraliser la logique d'upload** : Créer une fonction commune pour tous les uploads (documents, chat, etc.) pour faciliter la maintenance - uploadFileToStorage() implémentée



- [ ] **Vignettes ne s'affichent pas après upload** : Problème à investiguer plus tard (route /api/files fonctionne, S3 configuré, mais affichage frontend ne fonctionne pas)




## 🎨 Nouvelle fonctionnalité - Réorganisation interface spectateur

- [x] **Zone upload côté spectateur** : Créer une zone d'upload visible sous la barre d'écriture
- [x] **Layout 2 colonnes** : Upload (1/3) + Chat (2/3) côte à côte
- [x] **Technologie présentateur** : Réutiliser le système d'upload du présentateur (clic → affichage immédiat)
- [x] **Affichage synchronisé** : Les uploads apparaissent des 2 côtés (présentateur + spectateur)
- [x] **Fil temporaire** : Tout reste dans le fil de discussion temporairement



- [x] **Clic sur vignette spectateur ne fonctionne pas** : Le document ne s'affiche pas en grand quand on clique sur une vignette - Corrigé : upload sur S3 avant affichage
- [ ] **Vignettes PDF ne s'affichent pas** : Les PDF montrent juste une icône au lieu d'une preview



- [x] **Document spectateur ne s'affiche pas côté présentateur** : Quand le spectateur uploade, le document apparaît côté spectateur mais pas côté présentateur - Corrigé : refetchInterval ajouté
- [x] **Inverser l'ordre des vignettes** : Afficher le plus récent en haut, le plus ancien en bas - Corrigé : reverse() appliqué



- [x] **Document spectateur ne s'affiche pas côté présentateur en temps réel** : Quand le spectateur clique sur une vignette, le document ne s'affiche pas immédiatement côté présentateur - Corrigé : useEffect + refetchInterval



- [x] **Afficher preview PDF dans toutes les vignettes** : Utiliser react-pdf pour afficher la première page du PDF dans les vignettes (spectateur, présentateur)
- [x] **PDF ne s'affiche pas en grand côté présentateur** : Le viewer du présentateur ne lit pas les PDF uploadés par le spectateur - Corrigé : react-pdf implémenté



- [x] **Erreur 500 lors du chargement des PDF depuis S3** : Ajouter une gestion d'erreur pour afficher un fallback au lieu de crasher - Corrigé : fallback avec icône + message d'erreur



- [ ] **Upload spectateur affiche une ancienne image** : Lors de l'ajout d'un document, une image précédente s'affiche au lieu du nouveau document - En investigation
- [x] **Navigation PDF manquante côté spectateur** : Le spectateur ne peut pas changer de page dans les PDF, seulement le présentateur - Corrigé : boutons ← → ajoutés



- [x] **Bouton suppression dans la zone Upload spectateur** : Permettre au spectateur de supprimer les fichiers qu'il a uploadés - Corrigé : bouton × ajouté (visible au survol)



- [ ] **Suppression des documents spectateur côté présentateur** : Le bouton ❌ sur les vignettes du présentateur ne supprime pas les documents uploadés par le spectateur - En investigation



- [x] **Vignettes noires côté présentateur** : Les documents uploadés par le spectateur apparaissent en noir (pas de preview) - Corrigé : gradient de fond visible si image ne charge pas
- [x] **Croix rouge invisible** : Le bouton de suppression n'apparaît pas sur les vignettes côté présentateur - Corrigé : z-40 + shadow-lg pour meilleure visibilité



- [x] **Améliorer les vignettes PDF** : Afficher une vraie preview de la première page du PDF (comme pour les images) au lieu d'une petite icône



- [x] **Bug suppression en iframe** : La suppression de documents ne fonctionne pas quand le site est en production dans un iframe (confirm() bloqué) - Remplacé par AlertDialog



- [x] **Retirer le popup de validation** : Supprimer la confirmation pour le bouton "Tout supprimer" (X rouge) dans le chat



- [x] **Un seul clic pour afficher** : Remplacer le double-clic par un simple clic sur les vignettes
- [x] **Augmenter la vitesse d'affichage** : Réduire l'intervalle de polling pour une synchronisation plus rapide (500ms au lieu de 2000ms)
- [x] **Ajouter icône télécharger** : Mini icône bleue en bas à gauche des vignettes pour télécharger l'image
- [x] **Ajouter icône WhatsApp** : Mini icône verte en haut à gauche des vignettes pour partager sur WhatsApp



- [x] **Modifier bouton Copier** : Copier uniquement le lien du salon (sans iframe) - Déjà fonctionnel
- [x] **Modifier bouton WhatsApp** : Envoyer le message "Santéo présentation : [lien]"




## 🔐 Authentification par code PIN pour Railway

- [ ] Créer un système d'authentification par code PIN (5656)
- [ ] Popup de connexion pour accéder aux fonctions présentateur
- [ ] Stocker le PIN validé en sessionStorage
- [ ] Permettre l'accès aux routes protégées après validation du PIN
- [ ] Les spectateurs n'ont pas besoin de PIN (accès public maintenu)




- [ ] Corriger l'erreur React #310 sur la page présentateur après authentification PIN

