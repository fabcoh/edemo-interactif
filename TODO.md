# 📋 TODO - EDEMO LIVE

**Date de création** : 31 octobre 2025  
**Dernière mise à jour** : 31 octobre 2025

---

## 🔴 PRIORITÉ HAUTE

### **Bases de données séparées dev/prod**
- [ ] Créer une base de données dédiée pour la production
- [ ] Configurer Railway avec la nouvelle DATABASE_URL
- [ ] Migrer les données de test vers la base de prod
- [ ] Séparer les données de développement et de production
- [ ] Documenter la nouvelle configuration dans MEMORY.md

**Raison** : Actuellement dev et prod partagent la même base de données, ce qui peut causer des problèmes de données mixtes et de sécurité.

**Impact** : Moyen - Nécessite configuration Railway + migration de données

---

## 🟡 PRIORITÉ MOYENNE

### **Système de redirection automatique de ports**
- [x] Documenter le problème dans VIGILANCE.md
- [x] Créer une page HTML de redirection (`port-redirect.html`)
- [ ] Tester la page de redirection
- [ ] Intégrer la redirection dans le workflow
- [ ] Documenter l'utilisation dans README.md

**Raison** : Le port Manus change aléatoirement (3000/3001/3002), causant des URLs invalides.

**Impact** : Faible - Améliore l'expérience utilisateur mais pas critique

---

## 🟢 AMÉLIORATIONS FUTURES

### **Interface présentateur**
- [x] Header compact (textes réduits)
- [x] Suppression du panneau debug
- [ ] Améliorer la réactivité mobile
- [ ] Ajouter des raccourcis clavier

### **Chat**
- [x] Style bulles WhatsApp
- [x] Désactivation autocorrection
- [ ] Notifications push pour nouveaux messages
- [ ] Historique des conversations

### **Documents**
- [x] Upload PDF, images, vidéos
- [x] Vignettes avec dégradés de couleurs
- [ ] Prévisualisation en plein écran
- [ ] Support de plus de formats (PowerPoint, etc.)

### **Sécurité**
- [ ] Authentification renforcée
- [ ] Limitation du nombre de spectateurs
- [ ] Logs d'activité
- [ ] Expiration automatique des sessions

---

## ✅ TERMINÉ

- [x] Système d'instances de session (multi-présentateurs)
- [x] Chat en temps réel (style WhatsApp)
- [x] Upload de documents (PDF, images, vidéos)
- [x] Zoom et pan synchronisés
- [x] Curseur visible en temps réel
- [x] Liens d'accès commerciaux
- [x] Partage WhatsApp
- [x] Interface présentateur optimisée (header compact)
- [x] Panneau debug supprimé
- [x] Système de mémoire persistante (MEMORY, VIGILANCE, WORKFLOW)
- [x] Documentation complète de l'architecture
- [x] Configuration GitHub + Railway automatique

---

## 📝 NOTES

### **Prochaines étapes recommandées**
1. Séparer les bases de données dev/prod (priorité haute)
2. Tester la page de redirection automatique
3. Améliorer la réactivité mobile

### **Bugs connus**
- Voir `VIGILANCE.md` pour la liste complète

---

**⚠️ IMPORTANT** : Ce fichier doit être mis à jour à chaque nouvelle tâche ou complétion !



### **Navigation de pages PDF**
- [x] Côté lecteur : Supprimer l'icône de changement de page
- [x] Côté présentateur : Affiner l'icône de changement de page
- [x] Côté présentateur : Ajouter champ numérique pour accès direct à une page
- [x] Tester la navigation avec PDFs multi-pages

**Raison** : Simplifier l'interface lecteur et améliorer la navigation présentateur

**Impact** : Faible - Amélioration UX



### **Amélioration champ de saisie de page**
- [x] Retirer les flèches du champ numérique (input type="number")
- [x] Effacer automatiquement le contenu au survol de la souris (onMouseEnter)

**Raison** : Améliorer l'expérience utilisateur pour la saisie rapide de numéro de page

**Impact** : Très faible - Amélioration UX mineure



### **Barre de navigation PDF - Affinage final**
- [x] Affiner encore plus la barre (padding, hauteur)
- [x] Allonger la barre (plus large)
- [x] Déplacer la barre au-dessus du fichier (pas à l'intérieur)

**Raison** : Améliorer la visibilité et l'ergonomie de la navigation PDF

**Impact** : Faible - Amélioration visuelle



### **Corrections barre PDF**
- [x] Supprimer la bande noire au-dessus de la barre
- [x] Rendre les flèches visibles (fond blanc ou couleur)
- [x] Agrandir les boutons pour faciliter le clic
- [x] Allonger la barre (augmenter gap et padding)

**Raison** : Améliorer la visibilité et l'accessibilité de la barre de navigation

**Impact** : Moyen - Amélioration UX critique



### **Mini barre de zoom PDF**
- [x] Créer une mini barre de zoom à côté de la barre de pages
- [x] Boutons - et + pour zoom
- [x] Indicateur de zoom (ex: 100%)
- [x] Même style compact que la barre de pages
- [x] Tester le fonctionnement

**Raison** : Faciliter le zoom sans utiliser la grande barre en bas

**Impact** : Moyen - Amélioration UX




### **✅ CORRIGÉ: Synchronisation pageNumber PDF cassée**
- [x] Le présentateur change de page PDF
- [x] Le spectateur ne voit PAS le changement de page
- [x] Vérifier comment pageNumber est envoyé aux spectateurs
- [x] Vérifier comment le spectateur reçoit pageNumber
- [x] Corriger la synchronisation complète

**Solution appliquée** :
1. Ajout du champ `pageNumber` dans la table `presenter_cursors`
2. Ajout de `pageNumber` dans la procédure `updateZoomAndCursor`
3. Appel de `updatePresenterState({ pageNumber })` quand on change de page
4. Récupération de `pageNumber` dans `getCursorAndZoom`
5. Synchronisation automatique côté spectateur toutes les 500ms

**Fichiers modifiés** :
- drizzle/schema.ts : Ajout champ pageNumber
- server/db.ts : Ajout pageNumber dans updatePresenterCursor
- server/routers.ts : Ajout pageNumber dans updateZoomAndCursor et getCursorAndZoom
- client/src/pages/PresenterControl.tsx : Appel updatePresenterState avec pageNumber
- client/src/pages/Viewer.tsx : Synchronisation pageNumber depuis cursorQuery

**Impact** : CRITIQUE - Fonctionnalité principale restaurée




### **✅ Cloner boutons Copier et WhatsApp sur la ligne du haut**
- [x] Localiser les boutons "Copier le lien" et "Partager sur WhatsApp"
- [x] Localiser le bouton "✕ Terminer" pour connaître sa taille
- [x] Cloner les 2 boutons sur la ligne du haut à côté de "✕ Terminer"
- [x] Respecter la même taille que le bouton "✕ Terminer" (h-7)
- [x] Tester le fonctionnement

**Solution appliquée** :
- Bouton Copier ajouté dans le header (gris, h-7 px-2)
- Bouton WhatsApp ajouté dans le header (vert, h-7 px-2)
- Placés entre le compteur de spectateurs et le bouton Terminer
- Icônes w-3.5 h-3.5 pour bonne visibilité

**Fichiers modifiés** :
- client/src/pages/PresenterControl.tsx : Ajout des 2 boutons dans le header

**Raison** : Faciliter l'accès aux boutons de partage depuis le haut de l'écran

**Impact** : Faible - Amélioration UX




### **✅ Réduire la taille du titre de la présentation**
- [x] Changer la taille du titre de `text-xs` à `text-[9px]`
- [x] Conserver l'écriture blanche et le font-bold
- [x] Vérifier que le titre et le code ont la même taille

**Solution appliquée** :
- Titre changé de `text-xs` à `text-[9px]`
- Ajout explicite de `text-white` pour garantir la couleur blanche
- Titre et code ont maintenant la même taille

**Fichiers modifiés** :
- client/src/pages/PresenterControl.tsx : Modification de la classe du h1

**Raison** : Harmoniser la taille du texte dans le header

**Impact** : Très faible - Amélioration visuelle mineure

