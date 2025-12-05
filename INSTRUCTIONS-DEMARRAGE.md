# 🎯 Instructions de Démarrage - Nouveau Emplacement

## ✅ Migration Réussie !

Votre projet a été **déplacé avec succès** de OneDrive vers un dossier local :

- **Ancien emplacement** (LENT) : `C:\Users\mbi\OneDrive\Bureau\YelabGo` ❌
- **Nouvel emplacement** (RAPIDE) : `C:\Dev\YelabGo` ✅

---

## 🚀 Comment démarrer le projet

### Frontend Next.js

```bash
cd C:\Dev\YelabGo\frontend
npm run dev
```

Le serveur démarrera sur : http://localhost:3000

### Backend (si nécessaire)

```bash
cd C:\Dev\YelabGo\backend
# ou
cd C:\Dev\YelabGo\marrakech-backend
```

---

## 📊 Performances Attendues

### Avant (dans OneDrive)
```
[Fast Refresh] done in 14406ms ❌
[Fast Refresh] done in 9180ms  ❌
```

### Maintenant (hors OneDrive)
```
[Fast Refresh] done in 500-1500ms ✅
Navigation instantanée entre les pages ✅
```

**Gain : 80-90% plus rapide !** 🚀

---

## 📁 Structure du Projet

```
C:\Dev\YelabGo\
├── frontend/           # Application Next.js
├── backend/            # Backend principal
├── marrakech-backend/  # Backend Marrakech
├── nginx/              # Configuration Nginx
└── *.md                # Documentation
```

---

## ⚠️ Important

1. **Travaillez TOUJOURS depuis** `C:\Dev\YelabGo`
2. **N'utilisez PLUS** le dossier dans OneDrive
3. Le dossier OneDrive peut être supprimé après vérification
4. Configurez votre éditeur (VSCode, etc.) sur `C:\Dev\YelabGo`

---

## 🔧 Configurations VSCode (si applicable)

Ouvrez VSCode dans le nouveau dossier :

```bash
cd C:\Dev\YelabGo
code .
```

Ou : **File → Open Folder** → Sélectionnez `C:\Dev\YelabGo`

---

## 🐛 Dépannage

Si vous rencontrez encore des lenteurs :

1. **Redémarrez votre terminal complètement**
2. **Vérifiez que vous êtes dans C:\Dev** :
   ```bash
   pwd  # Doit afficher : /c/Dev/YelabGo
   ```
3. **Nettoyez le cache** :
   ```bash
   cd frontend
   rm -rf .next .turbo
   npm run dev
   ```

---

## 📝 Git (si applicable)

Si vous utilisez Git, mettez à jour votre dépôt local :

```bash
cd C:\Dev\YelabGo
git status
```

Tout devrait fonctionner normalement !

---

**Bon développement ! 🎉**
