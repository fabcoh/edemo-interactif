# TODO - Edemo Live

## Fonctionnalités en cours d'implémentation

### Visionneuse PDF et synchronisation
- [ ] Créer une visionneuse PDF intégrée (côté présentateur et spectateur)
- [ ] Clic sur un document PDF dans le chat → Affichage synchronisé sur les 2 écrans
- [ ] Ajouter un contrôle de blocage pour le présentateur (bloquer les clics spectateurs)

## Fonctionnalités complétées

### Chat bidirectionnel simplifié
- [x] Simplifier ChatPanel : 1 ligne (📎 trombone | zone de texte | 📤 bouton envoyer)
- [x] Supprimer les vignettes et le preview PDF
- [x] Ajouter bouton [X] "Tout supprimer" dans l'en-tête du chat
- [x] Messages occupent 3/4 de la hauteur, input 1/4
- [x] Upload fichier via trombone → Envoi automatique dans le chat
- [x] Support images, vidéos, PDF
- [x] Bouton cliquable sur les documents pour les afficher

### Statut de session cliquable
- [x] Ajouter une procédure tRPC `presentation.toggleSessionActive`
- [x] Rendre le statut "🟢 Active / 🔴 Inactive" cliquable
- [x] Ajouter un effet hover
- [x] Permettre de réactiver une session inactive

### Migration du chat
- [x] Mettre à jour la table chatMessages (senderType, senderName, message)
- [x] Ajouter les fonctions de chat dans server/db.ts
- [x] Mettre à jour le router chat dans server/routers.ts
- [x] Installer react-pdf
- [x] Supprimer ChatViewer.tsx et FileAttachmentViewer.tsx
- [x] Intégrer ChatPanel dans Viewer.tsx et PresenterControl.tsx
- [x] Mettre à jour ChatNotification.tsx

### Système d'instances de session
- [x] Système d'instances avec codes uniques
- [x] Support compatibilité codes session/instance
- [x] Historique des présentations
- [x] Multi-présentateurs simultanés

### Autres fonctionnalités
- [x] Upload de documents (PDF, images, vidéos)
- [x] Zoom et pan synchronisés
- [x] Curseur visible
- [x] Système de liens commerciaux
- [x] Partage WhatsApp

