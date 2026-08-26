# 9adhiya — قائمة الشراء

Application mobile React + Vite en arabe tunisien pour préparer, conserver et partager une liste de courses.

L’application est une PWA installable sur Android et iOS. Elle fonctionne hors ligne après la première visite, utilise une icône maskable et fournit des écrans de démarrage adaptés aux principales tailles d’iPhone.

## Développement

```bash
npm install
npm run dev
```

## Vérification

```bash
npm test
npm run build
```

Le build vérifie automatiquement le manifeste, le service worker, les icônes et les splash screens. La branche `main` est ensuite déployée sur GitHub Pages par GitHub Actions. Vite utilise le chemin de base `/9adhiya/`.

L’icône source modifiable se trouve dans `public/icons/app-icon.svg`.
