# 🔄 WORKFLOW AUTOMATISÉ - EDEMO LIVE

**Date de création** : 31 octobre 2025  
**Dernière mise à jour** : 31 octobre 2025

---

## 🎯 WORKFLOW STANDARD DE DÉVELOPPEMENT

### **Étape 1 : Préparation**

1. **Lire la documentation** :
   - [ ] `MEMORY.md` - Comprendre l'architecture
   - [ ] `VIGILANCE.md` - Éviter les pièges connus
   - [ ] `WORKFLOW.md` - Ce fichier

2. **Vérifier l'environnement** :
   ```bash
   webdev_check_status
   ```
   - Vérifier que le serveur est démarré
   - Noter le port actuel (3000 ou 3001)
   - Vérifier qu'il n'y a pas d'erreurs TypeScript

3. **Si le serveur est arrêté** :
   ```bash
   webdev_restart_server
   ```

---

### **Étape 2 : Développement**

1. **Modifier le code** :
   - Utiliser les outils `file` pour éditer les fichiers
   - Respecter les règles de `VIGILANCE.md`
   - Commenter les modifications importantes

2. **Tester en temps réel** :
   - Le serveur Manus a le hot reload activé
   - Les modifications sont visibles immédiatement
   - Tester sur mobile ET desktop si nécessaire

3. **Vérifier la compilation** :
   ```bash
   cd /home/ubuntu/edemo-interactif && pnpm run build
   ```
   - Vérifier qu'il n'y a pas d'erreurs
   - Corriger les erreurs TypeScript si nécessaire

---

### **Étape 3 : Validation**

1. **Checklist de validation** :
   - [ ] Le code compile sans erreurs
   - [ ] La fonctionnalité fonctionne comme attendu
   - [ ] Pas de régression sur les fonctionnalités existantes
   - [ ] Testé sur mobile ET desktop (si applicable)
   - [ ] Pas d'erreurs dans la console du navigateur

2. **Mettre à jour la documentation** :
   - [ ] `MEMORY.md` si modification de l'architecture
   - [ ] `VIGILANCE.md` si nouveau bug découvert
   - [ ] `WORKFLOW.md` si nouveau processus

---

### **Étape 4 : Commit et Push**

1. **Commit local** :
   ```bash
   cd /home/ubuntu/edemo-interactif
   git add -A
   git commit -m "Description claire de la modification"
   ```

2. **Push vers GitHub** :
   ```bash
   git push github main
   ```

3. **Note importante** :
   - ✅ Manus peut pusher directement sur GitHub (token configuré)
   - ✅ Le push déclenche automatiquement le déploiement Railway
   - ✅ Pas besoin de passer par la machine locale

---

### **Étape 5 : Déploiement automatique**

**Railway détecte automatiquement le push** :
- Railway surveille le dépôt `fabcoh/edemo-interactif`
- Dès qu'un push est détecté sur `main` :
  - Rebuild automatique
  - Redéploiement automatique
  - Production mise à jour en ~2-5 minutes

**Aucune action supplémentaire requise !**

#### **Option alternative : Manus Checkpoint**

1. **Créer un checkpoint** :
   ```bash
   webdev_save_checkpoint
   ```

2. **Publier via l'interface Manus** :
   - Cliquer sur le bouton "Publish" dans l'interface
   - ⚠️ Nécessite des checkpoints disponibles sur le plan
   - ⚠️ Actuellement : Plus de checkpoints disponibles

---

## 🔄 WORKFLOW AUTOMATISÉ COMPLET

```
┌─────────────────────────────────────────────────────────┐
│                  DÉVELOPPEMENT MANUS                    │
│  1. Lire MEMORY.md + VIGILANCE.md                       │
│  2. Vérifier webdev_check_status                        │
│  3. Modifier le code                                    │
│  4. Tester en temps réel (hot reload)                   │
│  5. Compiler (pnpm run build)                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   VALIDATION                            │
│  1. Vérifier la checklist                               │
│  2. Tester mobile + desktop                             │
│  3. Mettre à jour la documentation                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  COMMIT LOCAL                           │
│  git add -A                                             │
│  git commit -m "Description"                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│            PUSH GITHUB (Machine locale)                 │
│  git pull origin main                                   │
│  git push origin main                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│          DÉPLOIEMENT AUTOMATIQUE RAILWAY                │
│  1. Railway détecte le push                             │
│  2. Rebuild automatique                                 │
│  3. Redéploiement automatique                           │
│  4. Production live (~2-5 min)                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 COMMANDES RAPIDES

### **Vérifier l'état**
```bash
webdev_check_status
```

### **Redémarrer le serveur**
```bash
webdev_restart_server
```

### **Compiler le projet**
```bash
cd /home/ubuntu/edemo-interactif && pnpm run build
```

### **Commit local**
```bash
cd /home/ubuntu/edemo-interactif
git add -A
git commit -m "Description de la modification"
```

### **Voir l'historique des commits**
```bash
cd /home/ubuntu/edemo-interactif && git log --oneline -10
```

### **Voir les fichiers modifiés**
```bash
cd /home/ubuntu/edemo-interactif && git status
```

---

## 📋 CHECKLIST AVANT CHAQUE MODIFICATION

### **Avant de commencer**
- [ ] Lire `MEMORY.md` pour comprendre l'architecture
- [ ] Lire `VIGILANCE.md` pour éviter les pièges
- [ ] Vérifier que le serveur est démarré
- [ ] Noter le port actuel (3000 ou 3001)

### **Pendant le développement**
- [ ] Tester en temps réel avec hot reload
- [ ] Vérifier la console du navigateur (pas d'erreurs)
- [ ] Compiler le projet (`pnpm run build`)
- [ ] Corriger les erreurs TypeScript

### **Avant de commit**
- [ ] La fonctionnalité fonctionne comme attendu
- [ ] Pas de régression sur les fonctionnalités existantes
- [ ] Testé sur mobile ET desktop (si applicable)
- [ ] Documentation mise à jour si nécessaire

### **Après le commit**
- [ ] Commit local créé avec un message clair
- [ ] Push vers GitHub depuis la machine locale
- [ ] Vérifier le déploiement Railway (si applicable)
- [ ] Tester la production après déploiement

---

## ⚠️ POINTS DE VIGILANCE AUTOMATISÉS

### **À vérifier AVANT chaque modification**

1. **Vignettes de documents** :
   - ❌ Ne pas essayer de charger les images directement depuis Forge
   - ✅ Utiliser les dégradés de couleurs + icônes

2. **Navigation entre pages** :
   - ❌ Ne pas utiliser `setLocation` pour les pages principales
   - ✅ Utiliser `window.location.href` pour éviter NotFoundError

3. **Curseur présentateur** :
   - ❌ Ne pas utiliser des coordonnées en pixels
   - ✅ Utiliser des pourcentages (0-100%)

4. **Accès spectateur** :
   - ❌ Ne pas ajouter d'authentification sur `/view/*`
   - ✅ Les spectateurs doivent accéder sans login

5. **Champs de saisie** :
   - ❌ Ne pas oublier de désactiver l'autocorrection
   - ✅ Ajouter `autoCorrect="off"` etc.

---

## 📚 DOCUMENTATION À MAINTENIR

### **Fichiers à mettre à jour**

- **`MEMORY.md`** : Après modification de l'architecture
- **`VIGILANCE.md`** : Après découverte d'un bug ou solution
- **`WORKFLOW.md`** : Après ajout d'un nouveau processus
- **`TASKS.md`** : Après ajout/complétion d'une tâche

### **Fréquence de mise à jour**

- 🔴 **Critique** : Après chaque modification majeure
- 🟡 **Important** : Après chaque bug découvert
- 🟢 **Optionnel** : Après chaque petite modification

---

## 🎯 OBJECTIF DE CE WORKFLOW

**Éviter de perdre du temps** en :
- ✅ Documentant les bugs connus et leurs solutions
- ✅ Automatisant les processus répétitifs
- ✅ Créant une mémoire persistante du système
- ✅ Évitant de refaire les mêmes erreurs

**Résultat attendu** :
- 🚀 Développement plus rapide
- 🎯 Moins d'erreurs
- 📚 Documentation à jour
- 🔄 Processus reproductible

---

**⚠️ IMPORTANT** : Ce fichier doit être suivi à chaque modification !

**Dernière révision** : 31 octobre 2025 - Création du workflow automatisé

