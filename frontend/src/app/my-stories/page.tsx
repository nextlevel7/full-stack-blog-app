"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { deletePost, fetchMyPosts, type Post } from "@/lib/api";

export default function MyStoriesPage() {
  const { token, initialized } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (!token) {
      router.push("/auth");
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyPosts(token);
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load stories.");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialized, router, token]);

  const handleDelete = async (slug: string) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this story? This action cannot be undone.")) {
      return;
    }
    if (!token) {
      router.push("/auth");
      return;
    }
    setBusySlug(slug);
    setError(null);
    try {
      await deletePost(slug, token);
      setPosts((prev) => prev.filter((post) => post.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete story.");
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <main className="page">
      <div className="section-heading" style={{ marginBottom: "1.5rem" }}>
        <div>
          <p className="eyebrow">Your writing</p>
          <h2>My stories</h2>
        </div>
        <Link className="pill" href="/compose">
          Write a story
        </Link>
      </div>

      {error && <div className="status-callout">{error}</div>}

      {loading ? (
        <div className="card-panel">
          <p>Loading your stories...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card-panel">
          <p>You have not published anything yet. Start your first story!</p>
        </div>
      ) : (
        <div className="post-grid">
          {posts.map((post) => (
            <article key={post.slug} className="post-card">
              <h3>{post.title}</h3>
              <p className="post-meta">Published {new Date(post.created_at).toLocaleString()}</p>
              <div className="tag-row">
                <Link className="ghost-button" href={`/compose/${post.slug}`}>
                  Edit story
                </Link>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => handleDelete(post.slug)}
                  disabled={busySlug === post.slug}
                  style={{ borderColor: "rgba(248, 113, 113, 0.6)", color: "#fecaca" }}
                >
                  {busySlug === post.slug ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
