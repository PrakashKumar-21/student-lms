# Student LMS — AI-Powered Learning Platform

A full-stack Learning Management System where students browse a Board → Class → Subject
catalog, subscribe to subjects, upload study material (PDFs/images), and **chat with an AI
course companion** that answers questions grounded in that material using
Retrieval-Augmented Generation (RAG).

> Built by **Prakash Kumar** — [github.com/PrakashKumar-21](https://github.com/PrakashKumar-21)

---

## ✨ Features

- **OTP authentication** — phone (Twilio) and email (SendGrid) one-time-password login.
- **Catalog** — hierarchical Board → Class → Subject structure with admin management.
- **Subscriptions & payments** — subject subscriptions with Razorpay integration and usage limits.
- **Document ingestion pipeline** — upload PDFs/images; a Celery worker extracts text
  (with OCR via Tesseract/Poppler), chunks it, generates OpenAI embeddings, and stores
  them in Postgres using the **pgvector** extension.
- **AI chat (RAG)** — streaming answers from an LLM, grounded in the student's own
  subject documents.
- **Admin panel** — manage boards, classes, subjects, and users.

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| **Worker / queue** | Celery + Redis |
| **Database** | PostgreSQL + pgvector (vector embeddings) |
| **AI** | OpenAI (embeddings + chat), RAG |
| **Auth** | JWT, Twilio (SMS OTP), SendGrid (email OTP) |
| **Payments** | Razorpay |
| **Storage** | DigitalOcean Spaces / S3-compatible (optional) |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Query |
| **Infra** | Docker, docker-compose |

## 🗺️ Architecture

```
                 ┌─────────────────┐        ┌─────────────────┐
                 │  frontend-student│        │ ai-course-       │
                 │  (React/Vite)    │        │ companion (React)│
                 └────────┬─────────┘        └────────┬────────┘
                          │   REST / streaming (HTTP)  │
                          └──────────────┬─────────────┘
                                         ▼
                              ┌────────────────────┐
                              │  FastAPI backend    │  :8000
                              │  (auth, catalog,    │
                              │   chat, payments)   │
                              └─────┬─────────┬─────┘
                                    │         │
                  enqueue ingestion │         │ read/write
                                    ▼         ▼
                       ┌──────────────┐   ┌──────────────────────┐
                       │ Redis (queue)│   │ PostgreSQL + pgvector │
                       └──────┬───────┘   └──────────────────────┘
                              │                     ▲
                              ▼                     │ embeddings
                     ┌──────────────────┐           │
                     │ Celery worker     │───────────┘
                     │ PDF→OCR→chunks→   │
                     │ OpenAI embeddings │
                     └──────────────────┘
```

## 📦 Repository structure

```
student_lms/
├── backend-student/      FastAPI API + Celery worker + Alembic migrations
├── frontend-student/     Main student web app (Vite + React)
└── ai-course-companion/  AI chat companion web app (Vite + React)
```

---

## 🚀 Run locally

### Prerequisites
- [Docker](https://www.docker.com/) (Docker Desktop)
- [Node.js](https://nodejs.org/) 18+

### 1. Backend (API + worker + Postgres + Redis)

```bash
cd backend-student
cp .env.example .env          # fill in OPENAI_API_KEY etc. (defaults work for local DB)
docker compose up --build
```

This starts Postgres (with pgvector), Redis, the API, and the Celery worker.
Alembic migrations run automatically on startup.

- API: http://localhost:8000
- Health check: http://localhost:8000/health → `{"status":"ok","db":true,"redis":true,"worker":true}`

### 2. Frontend(s)

```bash
# Main student app
cd frontend-student
cp .env.example .env
npm install
npm run dev                   # http://localhost:8080

# AI companion (run on a different port to avoid a clash)
cd ai-course-companion
cp .env.example .env
npm install
npm run dev -- --port 8081    # http://localhost:8081
```

---

## ☁️ Deployment

The project is designed to deploy on free/low-cost tiers:

| Component | Suggested host |
|-----------|----------------|
| PostgreSQL (pgvector) | [Neon](https://neon.tech) or [Supabase](https://supabase.com) |
| Backend API + worker | [Render](https://render.com) or [Railway](https://railway.app) |
| Frontend(s) | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) |

Set the same environment variables from `.env.example` in the host's dashboard,
and point the frontends' `VITE_API_BASE_URL` at the deployed API URL.

---

## 🔐 Security note

All secrets live in `.env` files, which are git-ignored. Use `.env.example` as the
template and provide real values via your own environment / hosting dashboard.

## 📄 License

MIT © Prakash Kumar
