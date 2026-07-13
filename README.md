# IntelliCAM AI

**AI-Powered Intelligent Manufacturing Planning & Automatic CNC G-Code Generator from 2D Engineering Drawings**

IntelliCAM AI is a research-grade automated manufacturing plan generator and G-Code compiler designed to bridge the gap between 2D engineering drawings and CNC turning operations. It acts as an autonomous manufacturing engineer, parsing, recognition, sequences planning, parameters predicting, and path generating.

---

## 🛠️ Technology Stack

- **Frontend**: React (v18), TypeScript, TailwindCSS, Lucide Icons, Vite
- **Backend**: FastAPI, SQLAlchemy ORM, Uvicorn
- **Database**: PostgreSQL (Production) / SQLite (Fallback for testing/local dev)
- **AI/ML Engine**: OpenCV, EasyOCR, YOLOv11, PyTorch (Planned for subsequent phases)
- **Orchestration**: Docker & Docker Compose

---

## 📂 Directory Layout

```
c:\Users\VICTUS\Desktop\AI-Based-cost-estimation/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API endpoints, schemas, dependencies
│   │   ├── core/             # DB setup, JWT security, error configs
│   │   ├── models/           # SQLAlchemy User entity mappings
│   │   ├── repositories/     # Domain data access interfaces (Repository Pattern)
│   │   ├── services/         # Encapsulated Auth business rules
│   │   └── tests/            # Test suite integration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Vite + React Client
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Global AuthContext provider
│   │   ├── hooks/            # useAuth hook utility
│   │   ├── pages/            # Login screen & interactive dashboard
│   │   ├── services/         # Token-aware native fetch API client
│   │   └── types/            # TypeScript typing models
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Multi-container orchestrator
└── README.md                 # Project root manual
```

---

## 🚀 Running IntelliCAM AI

### Option A: Using Docker (Recommended)
Make sure you have Docker and Docker Compose installed.

1. Navigate to the root workspace directory.
2. Spin up the orchestrator:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend Console**: `http://localhost:5173`
   - **Backend OpenAPI documentation**: `http://localhost:8000/docs`

---

### Option B: Local Setup (Without Docker)

#### 1. Backend Startup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API server:
   ```bash
   python run.py
   ```
5. Run the test suite:
   ```bash
   python -m pytest app/tests
   ```

#### 2. Frontend Startup
1. Open another terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Run the development console:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 🔐 Module 1 Features (Authentication)

- **JWT-Based Stateless Auth**: Issues access and refresh tokens.
- **Auto-Token Interceptor**: The React fetch client automatically injects access tokens and intercepts `401 Unauthorized` responses to perform background token refreshes.
- **Role-Based Routing (RBAC)**: Supports roles for `Admin` and `Engineer`.
- **Premium Glassmorphism View**: Frost-glass overlay card, deep midnight radial gradient background, and glowing hover buttons.
