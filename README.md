# 9adhiya — قائمة الشراء

Application mobile React + Vite en arabe tunisien pour préparer, conserver et partager une liste de courses.

La liste est **enregistrée dans une base MariaDB** (via l'API de `server/`) et **partagée entre tous les appareils, sans compte** : ce qui est coché sur un téléphone apparaît sur les autres. Elle reste utilisable hors connexion (copie locale) et se resynchronise au retour du réseau.

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

Le build vérifie automatiquement le manifeste, le service worker, les icônes et les splash screens. La branche `main` est ensuite déployée sur GitHub Pages par GitHub Actions (chemin de base `/9adhiya/`) et sur le serveur (voir plus bas, chemin de base `/`, variable `VITE_BASE`).

L’icône source modifiable se trouve dans `public/icons/app-icon.svg`.

## API et base de données

Le navigateur appelle l'API de `server/` (Node.js 24, sans framework), qui stocke la liste dans la base MariaDB `adhiya`.

- `GET /api/list` lit la liste ; `PUT /api/list` l'enregistre avec la révision connue du client. Si un autre appareil a modifié la liste entre-temps, l'API répond `409` avec la version actuelle et le client **fusionne** les deux (`src/lib/merge.js` : fusion à trois voies par article, donc deux personnes qui font les courses en même temps ne s'écrasent pas).
- **Pas d'authentification** (choix assumé) : quiconque connaît l'adresse peut modifier la liste. Garde-fous : validation stricte de la forme et de la taille, limite d'écritures par adresse IP, et **historique des 200 dernières versions** (`shopping_list_history`) pour restaurer une liste en cas de problème.
- La première synchronisation d'un appareil **fusionne la liste déjà présente sur son navigateur** avec celle du serveur (rien n'est perdu).
- Schéma : `server/schema.sql`, appliqué automatiquement au démarrage. Configuration : `server/.env` (voir `server/.env.example`).
- Le conteneur (`server/Dockerfile`, `docker compose up -d --build` dans `server/`) sert le site à la racine et l'API sous `/api` ; le front cible par défaut `https://panier.clubika.com/api` (`VITE_API_URL` pour une autre API).
- Tests : `npm test` (liste, fusion, synchronisation avec un faux serveur) et `cd server && npm test` (API sur une vraie base MariaDB de test : `TEST_DB_NAME`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_SOCKET` ou `TEST_DB_HOST`).

## Déploiement automatique

Chaque commit poussé sur `main` met l'application à jour : GitHub Actions exécute les tests et publie GitHub Pages, et le serveur (`panier.clubika.com`) vérifie chaque minute si `main` a changé (`app-deploy.timer`), reconstruit l'image Docker, teste `/api/health` et revient automatiquement à la version précédente en cas d'échec. Journal : `~/deploy/deploy.log` sur le serveur.
