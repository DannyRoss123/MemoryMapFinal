# Memory Map – Backend

Express API that mirrors the previous Next.js login route.

## Setup
- `npm install`
- `npm run dev` (or `npm start`)

Environment values are read from `backend/.env` and also from the repo root `.env` if present:
- `PORT` (default 4000)
- `MONGODB_URI` (required)
- `MONGODB_DB` (defaults to `memorymap`)
- `CORS_ORIGINS` (optional comma-separated list, allow all if unset)

## Routes
- `POST /api/login` – accepts `{ name, role: 'PATIENT' | 'CAREGIVER', location, caregiverName? }` and returns the user/caregiver document ids.
- `GET /health` – simple readiness probe.
