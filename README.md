# IntelliCAM AI

Full-stack manufacturing assistant that ingests DXF/image drawings and supports authenticated planning workflows for CNC turning.

## Stack
- **Backend:** FastAPI, SQLAlchemy, SQLite/PostgreSQL via `DATABASE_URL`, JWT auth (Admin/Engineer)
- **Frontend:** Vite + React 18 + TypeScript + TailwindCSS + Lucide Icons
- **Testing:** Pytest integration tests
- **Containers:** Docker + Docker Compose

## Project Layout
- `/backend/app/api/v1` API endpoints and schemas
- `/backend/app/core` config, DB session, auth dependencies
- `/backend/app/models` SQLAlchemy entities
- `/backend/app/repositories` data access layer
- `/backend/app/services` auth and parsing workflows
- `/backend/app/tests` pytest integration tests
- `/frontend/src` React app (`components`, `context`, `hooks`, `pages`, `services`, `types`)

## Run locally with Docker
```bash
docker compose up --build
```
- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:5173

## Backend local dev
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend local dev
```bash
cd frontend
npm install
npm run dev
```
