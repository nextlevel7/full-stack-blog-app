"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { OutputData } from "@editorjs/editorjs";

import { PostForm, type PostFormHandle } from "@/components/PostForm";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/auth-context";
import { fetchPost, updatePost, type Post } from "@/lib/api";

export default function EditStoryPage() {
  const params = useParams<{ slug: string }>() ?? { slug: "" };
  const slug = params.slug;
  const { token, initialized } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const formRef = useRef<PostFormHandle>(null);

  useEffect(() => {
    if (initialized && !token) {
      router.push("/auth");
    }
  }, [initialized, token, router]);

  useEffect(() => {
    if (!slug) {
      setPost(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setToast(null);
      try {
        const data = await fetchPost(slug);
        setPost(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load story.");
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleUpdate = async (values: { title: string; body: OutputData }) => {
    if (!token) {
      router.push("/auth");
      return;
    }
    if (!slug) {
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const updated = await updatePost(slug, values, token);
      setPost(updated);
      setToast({ text: "Story updated successfully.", type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Failed to update story.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="card-panel">
          <p>Loading story...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="page">
        <div className="card-panel">
          <p>Story not found.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="composer-layout">
      <aside className="composer-sidebar">
        <Link className="ghost-button" href="/my-stories">
          Back to my stories
        </Link>
        <div className="composer-sidebar-actions">
          <button className="pill" type="button" disabled={busy} onClick={() => formRef.current?.submit()}>
            {busy ? "Saving..." : "Save changes"}
          </button>
          <button className="ghost-button" type="button" onClick={() => formRef.current?.reset()}>
            Reset draft
          </button>
        </div>
        <p className="eyebrow" style={{ marginTop: "2rem" }}>
          Editing
        </p>
        <h2>{post.title}</h2>
        <p style={{ color: "var(--muted)" }}>Update your published story.</p>
      </aside>
      <main className="composer-editor">
        <PostForm
          ref={formRef}
          onSubmit={handleUpdate}
          busy={busy}
          initialTitle={post.title}
          initialData={post.body_blocks ?? null}
          resetAfterSubmit={false}
          authToken={token}
        />
        {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
