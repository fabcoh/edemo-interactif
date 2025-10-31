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

