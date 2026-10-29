# RAFIKI

RAFIKI facilite la mise en relation entre les clients et les motards-taxis, en commençant par Nyankunde, en République démocratique du Congo.

## Prérequis

- Node.js 20.19+ ou 22.12+
- npm
- MySQL Server 8 pour les fonctions de base de données (le client seul ne suffit pas)

## Frontend

Application React avec Vite, React Router, Bootstrap 5, Axios, Lucide React et i18next en français et en swahili.

```sh
cd frontend
npm install
npm run dev
```

Pour générer et prévisualiser une version de production : `npm run build`, puis `npm run preview`.

## Backend

Serveur Node.js et Express. `GET /api/health` vérifie l’API sans dépendre de MySQL. `GET /api/health/db` indique séparément si la base est joignable, sans exposer les erreurs SQL ou les identifiants.

```sh
cd backend
npm install
npm run dev
```

Pour démarrer sans rechargement automatique : `npm start`.

## Base de données

Le schéma MySQL 8, les migrations ordonnées et les instructions de configuration sont documentés dans [backend/database/README.md](backend/database/README.md).

Après avoir démarré MySQL et configuré les variables `DB_*` dans `backend/.env`, depuis `backend/` :

```sh
npm run db:status
npm run db:migrate
npm run db:verify
```

Les migrations sont réservées à une base de développement dédiée dont le nom se termine par `_dev`. Aucune migration ne s’exécute au démarrage du serveur.

## Structure

- `frontend/` — application web React/Vite.
- `backend/` — API Express, configuration et migrations MySQL.
- `docs/` — documentation du projet.

## Direction visuelle

Bleu marine `#10213A`, jaune `#F5B900`, fond clair `#F5F6F8` et blanc `#FFFFFF`.

L’authentification, le GPS, les courses, la vérification métier des motards, les paiements et Socket.IO ne sont pas implémentés. Le schéma prépare certaines de ces données futures, sans activer ces fonctionnalités.
