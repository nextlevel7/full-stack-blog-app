import type { OutputData } from "@editorjs/editorjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type Post = {
  id: number;
  title: string;
  slug: string;
  body: string;
  body_blocks?: OutputData;
  author_name: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
};

export type AuthPayload = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    username: string;
  };
};

type HeadersRecord = Record<string, string>;

function authHeaders(token?: string | null): HeadersRecord {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = detail?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.status === 204 ? ({} as T) : response.json();
}

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch(`${API_BASE_URL}/posts/`, {
    method: "GET",
    cache: "no-store"
  });
  const data = await handleResponse<Post[] | { results: Post[] }>(response);
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}

type PostPayload = {
  title: string;
  body: OutputData;
};

export async function createPost(payload: PostPayload, token: string | null): Promise<Post> {
  if (!token) {
    throw new Error("Authentication required.");
  }
  const response = await fetch(`${API_BASE_URL}/posts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) } as HeadersRecord,
    body: JSON.stringify(payload)
  });
  return handleResponse<Post>(response);
}

export async function deletePost(slug: string, token: string | null): Promise<void> {
  if (!token) {
    throw new Error("Authentication required.");
  }
  const response = await fetch(`${API_BASE_URL}/posts/${slug}/`, {
    method: "DELETE",
    headers: authHeaders(token) as HeadersRecord
  });
  await handleResponse(response);
}

export async function updatePost(slug: string, payload: PostPayload, token: string | null): Promise<Post> {
  if (!token) {
    throw new Error("Authentication required.");
  }
  const response = await fetch(`${API_BASE_URL}/posts/${slug}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) } as HeadersRecord,
    body: JSON.stringify(payload)
  });
  return handleResponse<Post>(response);
}

export async function fetchPost(slug: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/posts/${slug}/`, {
    method: "GET",
    cache: "no-store"
  });
  return handleResponse<Post>(response);
}

export async function fetchMyPosts(token: string | null): Promise<Post[]> {
  if (!token) {
    throw new Error("Authentication required.");
  }
  const response = await fetch(`${API_BASE_URL}/posts/mine`, {
    method: "GET",
    headers: authHeaders(token) as HeadersRecord,
    cache: "no-store"
  });
  return handleResponse<Post[]>(response);
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<AuthResponse>(response);
}

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<AuthResponse>(response);
}
