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




## 🔧 Réimplémentation aperçu flottant

- [x] Ajouter l'import Monitor dans PresenterControl.tsx
- [x] Ajouter l'état showViewerPreview
- [x] Ajouter le bouton avec icône Monitor dans le header
- [x] Créer la fenêtre flottante avec iframe scrollable




## 🎯 Restauration du pointeur (main avec doigt)

- [x] Restaurer le pointeur 👆 côté présentateur (cursor: none au zoom ≥ 100%)
- [x] Restaurer le pointeur 👆 côté spectateur (affichage de la position du présentateur)




## 🎨 Afficher mini barre pour tous les PDFs

- [x] Modifier la condition pour afficher la mini barre même pour les PDFs multi-pages




## 🎨 Utiliser barre PDF pour tous les documents

- [x] Supprimer la barre PDF dupliquée (celle dans la condition PDF)
- [x] Garder uniquement la mini barre universelle (fonctionne pour tous les documents)
- [x] Mini barre affiche : ← page/total → | Zoom slider 100% | R | Glisser fichier



- [x] Supprimer la barre PDF dupliquée (celle dans la condition type === "pdf")




## 📊 Détection d'appareil et enrichissement spectateur

### Détection automatique
- [x] Détecter type d'appareil (Desktop, Tablet, Mobile)
- [x] Détecter navigateur (Chrome, Firefox, Safari, Edge + version)
- [x] Détecter OS (Windows, macOS, iOS, Android, Linux + version)
- [x] Détecter langue du navigateur
- [x] Détecter fuseau horaire
- [x] Détecter résolution d'écran
- [x] Utilitaire deviceDetection.ts créé

### Saisie manuelle (barre violette Vue Lecteur)
- [ ] Formulaire de saisie : Email + Téléphone
- [ ] Bouton "Enrichir" pour lancer la recherche d'infos

### Enrichissement automatique (via APIs)
- [ ] Nom complet
- [ ] Poste / Profession
- [ ] Entreprise
- [ ] Âge
- [ ] Photo de profil
- [ ] Profil LinkedIn
- [ ] Ville / Pays
- [ ] Formation
- [ ] Taille de l'entreprise
- [ ] Secteur d'activité

### Métriques de session
- [ ] Temps de connexion
- [ ] Pages vues
- [ ] Activité (actif/inactif)
- [ ] Nombre de reconnexions

### Affichage
- [ ] Afficher toutes les infos dans la barre violette de la Vue Lecteur
- [ ] Mise à jour du schéma DB (ajout colonnes)
- [ ] Pousser les migrations DB




## 📤 Upload fichier de prospection et enrichissement

### Phase 1 : Parser Excel
- [ ] Lire le fichier Excel exemple (Resultat_recherche(6).xlsx)
- [ ] Créer le parser pour extraire : Nom, Prénom, Age, Adresse, Téléphone, Mail
- [ ] Installer la librairie xlsx (si nécessaire)

### Phase 2 : Bouton Upload
- [ ] Ajouter bouton "📤 Upload prospection" dans la barre violette
- [ ] Ajouter bouton "🔍 Enrichir" à côté
- [ ] Gérer l'upload et le parsing du fichier

### Phase 3 : Popup de navigation
- [ ] Créer le popup avec navigation << FICHE >>
- [ ] Afficher les champs : Nom, Prénom, Age, Adresse, Téléphone, Mail
- [ ] Navigation entre les fiches (précédent/suivant)
- [ ] Compteur de fiches (ex: FICHE 1/25)

### Phase 4 : API d'enrichissement
- [ ] Intégrer l'API d'enrichissement (Clearbit, Hunter.io, etc.)
- [ ] Recherche basée sur Email et/ou Téléphone
- [ ] Récupérer : Poste, Entreprise, LinkedIn, Photo, Formation, Secteur

### Phase 5 : Affichage
- [ ] Afficher les infos enrichies dans le popup
- [ ] Afficher les infos de détection automatique
- [ ] Bouton "🗑️ Supprimer la fiche"




## 📋 Suivi des fiches et rappels automatiques

### Phase 1 : Schéma DB
- [x] Créer table `saved_prospects` (id, user_id, contact_data, status, rappel_date, notes, created_at)
- [x] Pousser les migrations DB

### Phase 2 : Upload et popup
- [x] Bouton "Upload prospection" dans le Right Panel
- [x] Parser Excel intégré
- [x] Popup ProspectPopup créé et intégré
- [x] Navigation << FICHE >> fonctionnelle
- [x] Bouton "⭐ Marquer comme intéressante" dans le popup
- [x] Champ "Date de rappel" avec sélecteur de date/heure
- [ ] Champ "Notes" pour commentaires
- [ ] Statut : Nouveau, En cours, Relancé, Converti, Perdu
- [ ] Sauvegarder la fiche en DB

### Phase 3 : Liste des fiches sauvegardées
- [ ] Page/section "Mes prospects"
- [ ] Affichage en tableau : Nom, Téléphone, Email, Statut, Rappel, Actions
- [ ] Filtres : Statut, Date de rappel
- [ ] Recherche par nom/email/téléphone

### Phase 4 : Système de rappels
- [ ] Cron job pour vérifier les rappels (toutes les 5 minutes)
- [ ] Email automatique si non connecté : "Rappel : Contacter Jean Dupont"
- [ ] Popup automatique si connecté : Affiche la fiche complète
- [ ] Bouton "Reporter" pour reprogrammer le rappel
- [ ] Recherche automatique des nouvelles infos à l'ouverture du rappel

### Phase 5 : Enrichissement à la volée
- [ ] Re-enrichir les infos quand le rappel s'ouvre
- [ ] Comparer avec les anciennes infos
- [ ] Afficher les changements (nouveau poste, nouvelle entreprise, etc.)




## 📋 Icône Fiches et fenêtre flottante

- [ ] Ajouter l'icône "📋 Fiches" à côté de l'icône "Vue Lecteur"
- [ ] Transformer le popup Dialog en fenêtre flottante (style Vue Lecteur)
- [ ] Conserver les fiches en mémoire jusqu'au prochain import
- [ ] Ouvrir la fenêtre flottante au clic sur l'icône




## 🔄 Refonte popup prospection

- [x] Créer 2 pages : Résumé (page 1) + Détails (page 2)
- [x] Page 1 : Nom, Prénom, Âge, Téléphone, Email, Adresse + Icône recherche
- [x] Page 2 : Infos enrichies + Détection + Formulaire de suivi
- [x] Recherche automatique dès l'ouverture de la fiche
- [x] Animation spirale sur l'icône 🔍 pendant la recherche
- [x] Clignotement de l'icône si infos trouvées
- [x] Supprimer le bouton "Enrichir"
- [x] Fenêtre flottante avec fond violet (contour violet)




## 🎨 Corrections couleurs popup

- [x] Contour violet → bleu
- [x] Header violet → bleu
- [x] Icône 📋 violette → bleue
- [x] Fond blanc → bleu clair
- [x] Icône recherche grise → bleue et bien visible (w-12 h-12 avec bordure)
- [x] Bouton "Voir les détails" visible sur page 1




## 🔧 Activer recherche automatique et 2ème page

- [x] Créer la fonction handleEnrich dans PresenterControl (simulation 2s + données fictives)
- [x] Créer la fonction handleSave dans PresenterControl (alert de confirmation)
- [x] Passer les fonctions au composant ProspectPopup
- [x] Recherche automatique au chargement de la fiche
- [x] Bouton "Voir les détails" et 2ème page fonctionnels




## 🎨 Optimiser layout page 2

- [ ] Rendre le bouton "Retour au résumé" visible (texte noir ou bleu foncé)
- [ ] Repositionner la photo en haut à gauche (80x80px au lieu de centré)
- [ ] Placer les infos enrichies à côté de la photo (layout horizontal)
- [ ] Réduire l'espacement vertical pour libérer de l'espace
- [ ] Formulaire de suivi compact en dessous


## 🔧 Cohérence des données enrichies

- [ ] Adapter les formations selon l'âge (< 30: BTS/Licence, 30-45: Master, > 45: MBA)
- [ ] Aligner poste + formation + âge pour cohérence
- [ ] Tester avec plusieurs profils différents
- [ ] Vérifier qu'un jeune n'a pas de MBA et qu'un senior n'a pas de BTS


## 📅 Ajouter date de naissance

- [ ] Calculer la date de naissance à partir de l'âge (année actuelle - âge)
- [ ] Ajouter le champ birthDate dans les données enrichies retournées par onEnrich
- [ ] Afficher la date de naissance dans ProspectPopup (Page 2) après le nom complet
- [ ] Format : "Né(e) le : JJ/MM/AAAA (XX ans)"


## 📍 Afficher la provenance de la fiche

- [ ] Afficher le champ "Infos" de l'Excel dans la Page 2
- [ ] Label : "Provenance" ou "Source"
- [ ] Positionner après la date de naissance ou en bas des infos enrichies


## 🎨 Améliorer visibilité des icônes

- [ ] Identifier les icônes peu visibles (recherche, fiches, etc.)
- [ ] Agrandir les icônes (passer de 12x12px à 20x20px ou plus)
- [ ] Améliorer les couleurs pour plus de contraste
- [ ] Tester la visibilité sur différents écrans


## 🔄 Boutons de navigation dans la popup

- [ ] Ajouter flèche ← (fiche précédente) en haut à gauche
- [ ] Ajouter flèche → (fiche suivante) en haut à droite
- [ ] Ajouter bouton ✕ (fermer) en haut à droite
- [ ] Ajouter indicateur "Fiche X / Y" au centre
- [ ] Désactiver les flèches si première/dernière fiche


## 🐛 Corriger ReferenceError dans Page 2

- [ ] Remplacer contact.provenance par currentContact.provenance
- [ ] Vérifier toutes les références à contact dans la Page 2
- [ ] Remplacer par currentContact partout où nécessaire
- [ ] Tester la Page 2 pour s'assurer qu'elle s'affiche correctement


## 🎨 Corriger visibilité des boutons de navigation

- [ ] Ajouter fond blanc aux boutons ← → ✕
- [ ] Ajouter bordure visible (border-2 border-gray-300)
- [ ] Augmenter taille des icônes (h-4 w-4 → h-5 w-5)
- [ ] Tester sur fond bleu de la popup


## 📞 Icônes téléphone et WhatsApp

- [ ] Formater le numéro de téléphone par groupes de 2 chiffres en gras (06 12 34 56 78)
- [ ] Ajouter icône ☎️ à côté du téléphone
- [ ] Ajouter bouton WhatsApp avec icône 💬
- [ ] Générer message WhatsApp : "Bonjour Mr [Nom Prénom] Suite à votre demande de devis pour la mutuelle santé, je voulais confirmer votre date de naissance, c'est bien le [date] ?"
- [ ] Créer lien WhatsApp : whatsapp://send?phone=[numéro]&text=[message]
- [ ] Afficher en haut des pages 1 et 2


## 🔤 Détection Mr/Mme pour message WhatsApp

- [ ] Ajouter colonne "Genre" dans l'Excel (Homme/Femme ou H/F)
- [ ] Extraire le genre dans le parser Excel
- [ ] Adapter le message WhatsApp : Mr pour Homme, Mme pour Femme
- [ ] Logique : < 30 ans = prénom seul, ≥ 30 ans = Mr/Mme + Nom Prénom


## ⏰ Adapter message selon l'heure

- [x] Détecter l'heure actuelle (fuseau Paris)
- [x] Avant 18h : "Bonjour..."
- [x] Après 18h : "Bonsoir..."
- [ ] Attendre instructions utilisateur pour détection Mr/Mme


## ✅ Logique message WhatsApp simplifiée

- [ ] < 30 ans : "[Bonjour/Bonsoir] [Prénom]"
- [ ] ≥ 30 ans : "[Bonjour/Bonsoir] [Prénom] [Nom]" (sans Mr/Mme)
- [ ] Évite les erreurs de genre en n'utilisant pas de titre


## 📝 Rendre le téléphone modifiable

- [ ] Ajouter state editablePhone pour stocker le numéro modifié
- [ ] Remplacer le champ lecture seule par Input éditable
- [ ] Formater automatiquement pendant la saisie (groupes de 2)
- [ ] Mettre à jour les liens ☎️ et WhatsApp avec le numéro modifié
- [ ] Appliquer dans Pages 1 et 2


## 🐛 Corriger erreur initialisation editablePhone

- [ ] Déplacer la définition de currentContact avant les useState
- [ ] Initialiser editablePhone avec contacts[currentIndex].telephone
- [ ] Tester l'import Excel pour vérifier que l'erreur est corrigée


## 🌍 Convertir numéro au format international WhatsApp

- [ ] Supprimer les espaces du numéro
- [ ] Si commence par 0 : supprimer le 0 et ajouter 33
- [ ] Format final : 33622197336 (au lieu de 06 22 19 73 36)
- [ ] Tester avec numéro français


## 🎨 Refonte popup sur une seule page

- [ ] Supprimer le système Page 1/Page 2
- [ ] Fusionner toutes les infos sur une seule page scrollable
- [ ] Section Contact : Nom/Prénom/Âge + Téléphone + Email/Adresse
- [ ] Section Enrichie : Infos en 2 colonnes compactes
- [ ] Section Suivi : Notes + Statut + Date rappel
- [ ] Réduire tailles : text-sm, py-1, gap-2
- [ ] Mini vignette photo cliquable (modal agrandissement)
- [ ] Layout optimisé et compact


## 🔧 Corrections popup compacte

- [ ] Centrer la navigation "← FICHE X/Y →"
- [ ] Retirer le bouton ✕ (fermeture)
- [ ] Restaurer date de naissance dans section enrichie
- [ ] Restaurer lien LinkedIn cliquable
- [ ] Vérifier que toutes les infos enrichies sont présentes
- [ ] Vérifier l'aperçu LinkedIn (page 1)

