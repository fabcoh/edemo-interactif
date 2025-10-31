# ⚠️ POINTS DE VIGILANCE - EDEMO LIVE

**Date de création** : 31 octobre 2025  
**Dernière mise à jour** : 31 octobre 2025

---

## 🚨 BUGS CONNUS ET SOLUTIONS

### **1. Vignettes de documents ne s'affichent pas**

**Problème** :
- Les vignettes des documents uploadés n'affichent pas l'aperçu de l'image
- Restrictions CORS du serveur Forge empêchent le chargement

**Solution appliquée** :
- ✅ Utiliser des dégradés de couleurs basés sur l'ID du document
- ✅ Afficher le titre du document sur la vignette
- ✅ Ajouter une icône selon le type (🖼️ image, 📄 PDF, 🎬 vidéo)

**Code de référence** : `client/src/pages/PresenterControl.tsx` (lignes 485-550)

**⚠️ NE PAS RÉESSAYER** de charger les images directement depuis l'URL Forge sans proxy !

---

### **2. Erreur NotFoundError (removeChild)**

**Problème** :
- Erreur DOM lors de la navigation entre pages
- Causé par les composants React qui tentent de manipuler le DOM pendant le démontage

**Solutions testées** :
- ❌ Navigation React (setLocation) → Erreur persiste
- ❌ Composant Select → Erreur au changement d'orientation
- ✅ Navigation native (`window.location.href`) → Fonctionne
- ✅ Boutons simples au lieu de Select → Fonctionne

**Code de référence** :
- `client/src/pages/PresenterControl.tsx` - Bouton "Retour" (ligne 330)
- Format portrait/paysage avec boutons (ligne 342)

**⚠️ RÈGLE** : Utiliser `window.location.href` pour la navigation entre pages principales

---

### **3. Ports dynamiques (3000/3001) - PROBLÈME CRITIQUE**

**Problème** :
- Le serveur Manus change de port aléatoirement (3000 → 3001 → 3002)
- L'URL devient invalide et affiche une page blanche
- L'utilisateur doit manuellement changer le port dans l'URL

**Cause** :
- Manus gère les ports de manière dynamique
- Pas de contrôle possible sur le port fixe
- Le port change au redémarrage ou après inactivité

**Solution actuelle (manuelle)** :
1. Vérifier le statut du serveur : `webdev_check_status`
2. Utiliser l'URL avec le bon port
3. Redémarrer le serveur si nécessaire : `webdev_restart_server`

**Solution à implémenter** :
- [ ] Créer une page de redirection automatique
- [ ] Détecter le port actif (3000, 3001, 3002)
- [ ] Rediriger automatiquement vers le bon port
- [ ] Afficher un message si aucun port n'est actif

**⚠️ RÈGLE CRITIQUE** : TOUJOURS vérifier le port actuel avant de donner une URL à l'utilisateur

**Code de référence** : À créer dans `client/public/index.html` ou page de redirection

---

### **4. Autocorrection du navigateur**

**Problème** :
- Les champs de saisie du chat modifient automatiquement le texte
- Exemple : "ok" devient "d'accord"

**Solution appliquée** :
```tsx
<input
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  ...
/>
```

**Code de référence** :
- `client/src/components/ChatPanel.tsx`
- `client/src/components/ChatViewer.tsx`

---

### **5. Curseur présentateur mal positionné**

**Problème** :
- Le curseur rouge du présentateur ne s'affiche pas au bon endroit côté spectateur
- Causé par des coordonnées en pixels (dépendantes de la résolution)

**Solution appliquée** :
- ✅ Utiliser des coordonnées en **pourcentage** (0-100%)
- ✅ Calculer par rapport à l'image elle-même (pas au conteneur)
- ✅ Utiliser `useRef` pour obtenir les dimensions réelles de l'image

**Code de référence** :
- `client/src/pages/PresenterControl.tsx` - `handleMouseMove` (ligne 200)
- `drizzle/schema.ts` - `presenterCursors` table (cursorX/cursorY en float)

**⚠️ RÈGLE** : Toujours utiliser des pourcentages pour les positions relatives à l'image

---

## 🔒 RESTRICTIONS ET LIMITATIONS

### **Accès spectateur**

**Règle** : Les spectateurs doivent accéder SANS authentification

**Code de référence** : `client/src/main.tsx`
```tsx
const isViewerPage = window.location.pathname.startsWith('/view') || 
                     window.location.pathname === '/viewer';
if (isViewerPage) return; // Ne pas rediriger vers login
```

**⚠️ NE JAMAIS** ajouter de vérification d'authentification sur les routes `/view/*`

---

### **Upload de fichiers depuis mobile**

**Problème** :
- Les Data URLs contiennent le préfixe `data:image/jpeg;base64,`
- Le backend doit extraire uniquement la partie base64

**Solution appliquée** :
```typescript
const base64Data = input.fileData.includes('base64,') 
  ? input.fileData.split('base64,')[1] 
  : input.fileData;
```

**Code de référence** : `server/routers.ts` - `uploadDocument` mutation

---

### **Panneau de debug**

**Statut** : ✅ Supprimé (31 octobre 2025)

**Raison** : Libérer de l'espace pour le viewer

**⚠️ NE PAS RÉINTRODUIRE** le composant `DebugPanel` sans demander confirmation

---

## 📋 CHECKLIST AVANT MODIFICATION

### **Avant de modifier l'interface présentateur**

- [ ] Lire `MEMORY.md` pour comprendre l'architecture
- [ ] Lire `VIGILANCE.md` (ce fichier) pour éviter les pièges
- [ ] Vérifier que le serveur est démarré (`webdev_check_status`)
- [ ] Tester sur mobile ET desktop
- [ ] Vérifier que les vignettes s'affichent (dégradés de couleurs)
- [ ] Vérifier que la navigation fonctionne (pas d'erreur NotFoundError)

### **Avant de modifier le système de curseur**

- [ ] Utiliser des coordonnées en pourcentage (0-100%)
- [ ] Calculer par rapport à l'image (pas au conteneur)
- [ ] Tester avec différentes résolutions d'écran
- [ ] Vérifier la synchronisation présentateur → spectateur

### **Avant de modifier le chat**

- [ ] Désactiver l'autocorrection (`autoCorrect="off"`)
- [ ] Tester l'envoi de messages texte
- [ ] Tester l'envoi de fichiers
- [ ] Vérifier la notification popup côté spectateur
- [ ] Vérifier que les messages s'affichent dans le bon ordre (récent en haut)

### **Avant de commit**

- [ ] Compiler le projet (`pnpm run build`)
- [ ] Vérifier qu'il n'y a pas d'erreurs TypeScript
- [ ] Tester la fonctionnalité modifiée
- [ ] Mettre à jour `MEMORY.md` si nécessaire
- [ ] Mettre à jour `VIGILANCE.md` si nouveau bug découvert

---

## 🎯 INSTRUCTIONS DE DÉMARRAGE

### **Démarrage rapide**

1. Vérifier le statut : `webdev_check_status`
2. Si le serveur est arrêté : `webdev_restart_server`
3. Utiliser l'URL avec le bon port (3000 ou 3001)
4. Tester l'accès présentateur : `/presenter`
5. Tester l'accès spectateur : `/view/CODE`

### **En cas de problème**

1. Lire `MEMORY.md` pour comprendre l'architecture
2. Lire `VIGILANCE.md` (ce fichier) pour les bugs connus
3. Vérifier les logs du serveur
4. Redémarrer le serveur si nécessaire
5. Vérifier la base de données si les données ne s'affichent pas

---

## 📚 DOCUMENTS DE RÉFÉRENCE

### **Fichiers importants à consulter**

- `MEMORY.md` - Mémoire du système (connexions, architecture)
- `VIGILANCE.md` - Ce fichier (bugs, vigilance)
- `WORKFLOW.md` - Workflow de développement (à créer)
- `TASKS.md` - Liste des tâches (si existe)
- `PROMPT_DEMARRAGE_PROJET.md` - Instructions de démarrage

### **Code critique**

- `client/src/pages/PresenterControl.tsx` - Interface présentateur
- `client/src/pages/Viewer.tsx` - Interface spectateur
- `client/src/components/ChatPanel.tsx` - Chat présentateur
- `client/src/components/ChatViewer.tsx` - Chat spectateur
- `server/routers.ts` - Routes tRPC backend
- `drizzle/schema.ts` - Schéma de base de données

---

**⚠️ IMPORTANT** : Ce fichier doit être mis à jour à chaque bug découvert ou solution trouvée !

**Dernière révision** : 31 octobre 2025 - Interface présentateur optimisée

