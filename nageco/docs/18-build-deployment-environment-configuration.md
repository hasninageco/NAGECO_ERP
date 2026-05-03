# 18. Build, Deployment & Environment Configuration

## 18.1 Build Overview

The ERP solution has two workspaces:
- Frontend app: `nageco` (React + TypeScript)
- Backend API/server: `serveur` (Node.js + Express)

The backend serves both API routes and frontend static build output.

## 18.2 Frontend Build (nageco)

Prerequisites:
- Node.js and npm installed

Commands:

```powershell
cd D:\NAGECO\NAGECO WEB\nageco
npm install
npm run build
```

Output:
- Production artifacts are generated in `nageco/build`

Relevant config:
- `REACT_APP_API_BASE` is used by frontend API helper (`src/utils/api.ts`)
- `.env.production` contains `GENERATE_SOURCEMAP=false`

## 18.3 Backend Build and Run (serveur)

Prerequisites:
- Node.js and npm installed

Commands:

```powershell
cd D:\NAGECO\NAGECO WEB\serveur
npm install
node index.js
```

Runtime notes:
- Backend listens on port `5000`
- Backend loads environment values with `dotenv`
- `serveur/package.json` currently has no dedicated `start` script

## 18.4 Deployment Topology

Current topology in code:
- Express serves static files from `serveur/build` if present
- If `serveur/build` does not exist, fallback is `../nageco/build`
- SPA fallback route serves `index.html` for non-API GET requests

Result:
- UI and APIs can be delivered from one backend service endpoint

## 18.5 Environment Configuration

### Frontend variables

- `REACT_APP_API_BASE` (example: `http://10.0.2.2:5000`)
- `GENERATE_SOURCEMAP` (set to `false` in production file)

### Backend variables

- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_DIALECT`

Important implementation note:
- Database connection settings are currently hardcoded in `serveur/config/database.js` (server, user, password, database).
- For production governance, this should be aligned to `.env` variables.

## 18.6 Release Procedure (Recommended)

1. Install dependencies for both workspaces.
2. Build frontend in `nageco` with `npm run build`.
3. Ensure backend can access the build output folder.
4. Start backend service with `node index.js` (or process manager).
5. Run smoke tests:
- `GET /api/health`
- `POST /api/login`
- Open frontend root and key ERP modules

## 18.7 Post-Deployment Validation Checklist

- API health endpoint returns HTTP 200.
- Login works and returns a valid JWT.
- Protected APIs accept `Authorization: Bearer <token>`.
- Static SPA loads and deep links resolve (fallback route works).
- File upload flows (claims, upload/files) are reachable.

## 18.8 Security and Operations Recommendations

- Keep secrets out of source control.
- Use strong per-environment `JWT_SECRET` values and rotate regularly.
- Move DB credentials to environment variables only.
- Add process supervision (PM2 or service manager) and central log collection.
- Use HTTPS and reverse proxy with environment-specific CORS allowlist.
