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

The JSON files in `backend/data/` act as the storage engine and are created automatically the first time the app runs.

### Using PostgreSQL 

1. Provision a database and note the connection string. Example: `postgresql+psycopg2://user:password@localhost:5432/blog`.
2. Set the `DATABASE_URL` environment variable before starting FastAPI:
   ```bash
   export DATABASE_URL="postgresql+psycopg2://user:password@localhost:5432/blog"
   ```
3. Install backend dependencies (SQLAlchemy + psycopg are already listed in `requirements.txt`) and run the app. On startup the `posts` table will be created automatically.
4. If `DATABASE_URL` is not set, the service will fall back to the JSON storage so local development continues to work.

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
```

Compose (`/compose`) and edit (`/compose/[slug]`) pages use Editor.js with image uploads handled client-side (data URLs). Stored posts keep both the rendered HTML and original Editor.js JSON so the article detail view can render structured content.

### Image uploads

The default Editor.js image tool posts files to `POST /api/uploads/images`, which stores them under `backend/data/uploads/` and makes them available at `http://<api>/uploads/<filename>`. For a hosted alternative you can point `NEXT_PUBLIC_UPLOAD_ENDPOINT` to any compatible service (e.g., Supabase Storage, Cloudflare R2, or Backblaze B2—all of which offer free tiers) and implement the same JSON response shape in your proxy.
