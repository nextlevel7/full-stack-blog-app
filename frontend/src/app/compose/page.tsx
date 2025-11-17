"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { OutputData } from "@editorjs/editorjs";

import { PostForm, type PostFormHandle } from "@/components/PostForm";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/context/auth-context";
import { createPost } from "@/lib/api";

export default function ComposePage() {
  const router = useRouter();
  const { token, initialized } = useAuth();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const formRef = useRef<PostFormHandle>(null);

  useEffect(() => {
    if (initialized && !token) {
      router.replace("/auth");
    }
  }, [initialized, router, token]);

  const handlePublish = async (values: { title: string; body: OutputData }) => {
    if (!token) {
      router.replace("/auth");
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      const post = await createPost(values, token);
      setToast({ text: `Story "${post.title}" is live!`, type: "success" });
    } catch (err) {
      setToast({ text: err instanceof Error ? err.message : "Failed to publish.", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!initialized) {
    return (
      <main className="page">
        <div className="card-panel">
          <p>Preparing your editor...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="composer-layout">
      <aside className="composer-sidebar">
        <Link className="ghost-button" href="/">
          Back to stories
        </Link>
        {token && (
          <div className="composer-sidebar-actions">
            <button className="pill" type="button" disabled={busy} onClick={() => formRef.current?.submit()}>
              {busy ? "Publishing..." : "Publish story"}
            </button>
            <button className="ghost-button" type="button" onClick={() => formRef.current?.reset()}>
              Reset draft
            </button>
          </div>
        )}
      </aside>
      <main className="composer-editor">
        {token ? (
          <PostForm ref={formRef} onSubmit={handlePublish} busy={busy} authToken={token} />
        ) : (
          <div className="card-panel">
            <p>Need to authenticate before composing. You will be redirected to sign in.</p>
          </div>
        )}
        {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
