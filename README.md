# Memory Map

Monorepo layout separating the Next.js frontend and an Express + MongoDB backend.

## Structure
- `frontend/` – Next.js UI (app router).
- `backend/` – Express API (`/api/login`) and database connection helper.
- `.env.example` – shared environment template for both apps.

## Setup
1) Copy `.env.example` to `.env` at the repo root and fill in MongoDB credentials. Keep `NEXT_PUBLIC_API_BASE_URL` pointing at the backend (default `http://localhost:4000`).
2) Install and run the backend:
   - `cd backend`
   - `npm install`
   - `npm run dev` (or `npm start`) – listens on `PORT` (default 4000).
3) Install and run the frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev` – starts Next on port 3000 and calls the backend for login.

## API
- `POST /api/login` – accepts `{ name, role: 'PATIENT' | 'CAREGIVER', location, caregiverName? }` and returns the user record, mirroring the previous Next.js route logic.
