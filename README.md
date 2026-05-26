# Full Stack Blog APP

## Backend (FastAPI)

```
backend/
├─ app/
│  ├─ api/
│  │  ├─ routes/        # FastAPI routers (root, auth, posts)
│  │  └─ dependencies.py
│  ├─ core/             # Settings and security helpers
│  ├─ schemas/          # Pydantic request/response models
│  ├─ services/         # Storage, post, and user services
│  └─ main.py           # FastAPI entrypoint
├─ data/                # JSON storage for posts/users
└─ requirements.txt
```

### Running the API

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API exposes the following endpoints:

- `GET /` – health information
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/{slug}`
- `PATCH /api/posts/{slug}`
- `DELETE /api/posts/{slug}`


## Frontend (Next.js + Editor.js)

The Next.js app in `frontend/` consumes the FastAPI endpoints, handles auth, and provides a Notion-style editing experience powered by [Editor.js](https://editorjs.io/).

Key directories:

```
frontend/
├─ src/app/              # App Router pages (feed, compose, my-stories, etc.)
├─ src/components/       # Reusable UI including the Editor.js wrapper
├─ src/context/          # Auth context persisted in localStorage
└─ src/lib/api.ts        # API client helpers
```

### Running the frontend

```bash
cd frontend
npm install
npm run dev   # Visit http://localhost:3000
