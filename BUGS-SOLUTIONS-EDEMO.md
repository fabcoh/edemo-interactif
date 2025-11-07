# 🐛 BUGS & SOLUTIONS - EDEMO LIVE (ZEUS)

**Fichier de référence pour éviter de répéter les mêmes erreurs**

---

## 📌 RÈGLE D'OR

**Avant de modifier du code, TOUJOURS lire ce fichier pour vérifier si le problème a déjà été résolu !**

---

## 🎯 BUGS RÉSOLUS

### 1. Vignettes de documents ne s'affichent pas

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

### 2. Curseur présentateur sur les PDFs (côté spectateur)

**Problème** :
- Le curseur du présentateur ne s'affiche pas sur les PDFs côté spectateur
- Fonctionne sur les images mais pas sur les PDFs

**❌ Solutions tentées (qui ne fonctionnent PAS)** :

#### Tentative 1 : Curseur en dehors du conteneur transformé
```tsx
{/* ❌ NE FONCTIONNE PAS */}
<Document>
  <div style={{ transform: `scale(${zoom / 100})...` }}>
    <Page />
  </div>
</Document>
{/* Curseur ici - reste figé car en dehors du transform */}
<div style={{ left: `${mousePos.x}px` }}>👆</div>
```

**Pourquoi ça ne marche pas :**
- Le PDF est transformé (scale + translate)
- Le curseur est positionné en dehors du conteneur transformé
- Le curseur ne suit pas les transformations du PDF

#### Tentative 2 : Curseur à l'intérieur du conteneur transformé
```tsx
{/* ❌ NE FONCTIONNE PAS NON PLUS */}
<Document>
  <div style={{ transform: `scale(${zoom / 100})...` }}>
    <Page />
    {/* Curseur ici - suit le transform mais coordonnées incorrectes */}
    <div style={{ left: `${mousePos.x}px` }}>👆</div>
  </div>
</Document>
```

**Pourquoi ça ne marche pas :**
- Les coordonnées mousePos sont relatives à la fenêtre
- Elles ne sont pas converties pour le conteneur transformé
- Le curseur apparaît au mauvais endroit

---

### ✅ Solution finale qui fonctionne

**Fichiers modifiés :**
- `client/src/pages/PresenterControl.tsx` (côté présentateur) - **DÉJÀ FAIT**
- `client/src/pages/Viewer.tsx` (côté spectateur) - **À IMPLÉMENTER**

#### Étape 1 : Créer les refs nécessaires

**Côté présentateur (PresenterControl.tsx) :**
```typescript
const pdfContainerRef = useRef<HTMLDivElement>(null);
```

**Côté spectateur (Viewer.tsx) :**
```typescript
const pdfContainerRef = useRef<HTMLDivElement>(null);
const documentContainerRef = useRef<HTMLDivElement>(null);
```

#### Étape 2 : Attacher les refs aux conteneurs

**Côté présentateur :**
```tsx
<div ref={pdfContainerRef} className="w-full h-full flex flex-col items-center justify-center">
  <Document>
    <div style={{ transform: `scale(${zoom / 100})...` }}>
      <Page />
    </div>
  </Document>
</div>
```

**Côté spectateur :**
```tsx
{/* Conteneur parent */}
<div ref={documentContainerRef} className="w-full h-full flex items-center justify-center overflow-auto cursor-pointer">
  {/* Conteneur PDF */}
  <div ref={pdfContainerRef} className="w-full h-full overflow-auto bg-gray-900 relative">
    <Document>...</Document>
  </div>
</div>
```

#### Étape 3 : Modifier handleMouseMove pour gérer les PDFs (côté présentateur)

**⚠️ DÉJÀ IMPLÉMENTÉ dans PresenterControl.tsx**

```typescript
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (displayedDocumentId && currentSession) {
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    // For images
    if (imageRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect();
      const imageX = e.clientX - imageRect.left;
      const imageY = e.clientY - imageRect.top;
      const cursorX = imageRect.left - containerRect.left + imageX;
      const cursorY = imageRect.top - containerRect.top + imageY;
      setMousePos({ x: cursorX, y: cursorY });
      
      const xPercent = (imageX / imageRect.width) * 100;
      const yPercent = (imageY / imageRect.height) * 100;
      
      updatePresenterState({
        cursorX: xPercent,
        cursorY: yPercent,
        cursorVisible: showMouseCursor && zoom >= 100,
      });
    }
    // For PDFs - EXACTEMENT la même logique que pour les images
    else if (pdfContainerRef.current) {
      const pdfRect = pdfContainerRef.current.getBoundingClientRect();
      const pdfX = e.clientX - pdfRect.left;
      const pdfY = e.clientY - pdfRect.top;
      const cursorX = pdfRect.left - containerRect.left + pdfX;
      const cursorY = pdfRect.top - containerRect.top + pdfY;
      setMousePos({ x: cursorX, y: cursorY });
      
      const xPercent = (pdfX / pdfRect.width) * 100;
      const yPercent = (pdfY / pdfRect.height) * 100;
      
      updatePresenterState({
        cursorX: xPercent,
        cursorY: yPercent,
        cursorVisible: showMouseCursor && zoom >= 100,
      });
    }
  }
};
```

#### Étape 4 : Afficher le curseur pour les PDFs (côté spectateur)

**⚠️ SOLUTION CRITIQUE : Le curseur doit être positionné par rapport au conteneur PARENT, pas au pdfContainerRef !**

```tsx
{!documentError && displayDocument.type === "pdf" && (
  <>
    <div ref={pdfContainerRef} className="w-full h-full overflow-auto bg-gray-900 relative">
      <Document>...</Document>
    </div>
    {/* Cursor Indicator - EXACTEMENT comme pour les images */}
    {presenterCursorVisible && presenterZoom >= 100 && (() => {
      if (!pdfContainerRef.current || !documentContainerRef.current) return null;
      
      // 🔑 CLÉS DE LA SOLUTION :
      // 1. Obtenir les dimensions du conteneur PARENT
      const parentRect = documentContainerRef.current.getBoundingClientRect();
      
      // 2. Obtenir les dimensions du conteneur PDF
      const pdfRect = pdfContainerRef.current.getBoundingClientRect();
      
      // 3. Convertir les pourcentages en pixels par rapport au PDF
      const pdfX = (presenterCursorX / 100) * pdfRect.width;
      const pdfY = (presenterCursorY / 100) * pdfRect.height;
      
      // 4. Calculer la position finale par rapport au PARENT
      const cursorX = pdfRect.left - parentRect.left + pdfX;
      const cursorY = pdfRect.top - parentRect.top + pdfY;
      
      return (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${cursorX}px`,
            top: `${cursorY}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 0, 0, 0.8))' }}>
            👆
          </div>
        </div>
      );
    })()}
  </>
)}
```

---

### 📝 Points clés de la solution

1. **Utiliser getBoundingClientRect()** sur le conteneur PDF ET le conteneur parent
2. **Calculer les coordonnées relatives** au conteneur parent, pas au PDF
3. **Utiliser EXACTEMENT la même logique** que pour les images
4. **Le curseur doit être en position absolute** par rapport au conteneur parent
5. **Vérifier que les refs existent** avant de faire getBoundingClientRect()

---

### ⚠️ ERREURS À ÉVITER

❌ **NE PAS** calculer la position uniquement par rapport au pdfContainerRef :
```typescript
// ❌ MAUVAIS
const cursorX = (presenterCursorX / 100) * containerRect.width;
const cursorY = (presenterCursorY / 100) * containerRect.height;
```

✅ **TOUJOURS** calculer par rapport au conteneur parent :
```typescript
// ✅ BON
const cursorX = pdfRect.left - parentRect.left + pdfX;
const cursorY = pdfRect.top - parentRect.top + pdfY;
```

---

### 🔧 Commits de référence

- **Commit ca1c353** : Fix côté présentateur (PresenterControl.tsx)
- **Commit [À CRÉER]** : Fix côté spectateur (Viewer.tsx)

---

## 📚 DOCUMENTATION ASSOCIÉE

- `MEMORY.md` : Architecture du système
- `VIGILANCE.md` : Pièges à éviter
- `WORKFLOW.md` : Workflow de déploiement
- `todo.md` : Tâches et bugs en cours

---

**⚠️ IMPORTANT** : Ce fichier doit être mis à jour à chaque bug résolu pour éviter de répéter les mêmes erreurs !


