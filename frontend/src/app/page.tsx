"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PostList } from "@/components/PostList";
import { useAuth } from "@/context/auth-context";
import { deletePost, fetchPosts, type Post } from "@/lib/api";

export default function HomePage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    let data = posts;
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      data = data.filter((post) => {
        const body = (post.body || "").replace(/<[^>]+>/g, "").toLowerCase();
        return post.title.toLowerCase().includes(query) || body.includes(query);
      });
    }
    if (activeTag) {
      data = data.filter((post) => new RegExp(`#${activeTag}\\b`, "i").test(post.body || ""));
    }
    return data;
  }, [posts, search, activeTag]);

  const trendingTags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      const matches = post.body?.match(/#([\w-]+)/g) || [];
      matches.forEach((tagWithHash) => {
        const tag = tagWithHash.slice(1).toLowerCase();
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchPosts();
        if (!cancelled) {
          setPosts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load posts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFilters = () => {
    setSearch("");
    setActiveTag(null);
  };

  return (
    <main className="page">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Publishing for thinkers</p>
          <h1>Share ideas that matter.</h1>
          <p className="hero-lede">
            Essays, hot takes, and practical notes from builders everywhere. Read without friction, and publish with a
            professional editor when inspiration strikes.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="pill" href={token ? "/compose" : "/auth"}>
            {token ? "Start writing" : "Join to publish"}
          </Link>
          {!token && (
            <Link className="ghost-button" href="/auth">
              Sign in
            </Link>
          )}
        </div>
      </section>

      <section className="search-panel">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search stories or hashtags..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {(search || activeTag) && (
            <button type="button" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
        {trendingTags.length > 0 && (
          <div className="trending-tags">
            <p className="eyebrow">Trending</p>
            <div className="chip-grid">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chip ${activeTag === tag ? "chip--active" : ""}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Latest stories</p>
          <h2>Ideas shaping the community</h2>
        </div>
        <Link className="ghost-button" href={token ? "/compose" : "/auth"}>
          {token ? "Create a story" : "Join to publish"}
        </Link>
      </section>

      {error && <div className="status-callout">{error}</div>}

      <section className="feed-stack">
        {loading ? (
          <div className="card-panel">
            <p>Loading the latest drops...</p>
          </div>
        ) : (
          <PostList
            posts={filteredPosts}
            busySlug={busySlug}
            canDelete={false}
            onSelectTag={(tag) => setActiveTag(tag)}
          />
        )}
      </section>
    </main>
  );
}
