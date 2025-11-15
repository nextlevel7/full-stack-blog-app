"use client";

import Link from "next/link";
import type { Post } from "@/lib/api";

type Props = {
  posts: Post[];
  onDelete?: (slug: string) => Promise<void>;
  busySlug?: string | null;
  canDelete?: boolean;
  onSelectTag?: (tag: string) => void;
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, "");
const hashtagRegex = /#([\w-]+)/g;

function extractHashtags(body: string | undefined): string[] {
  if (!body) {
    return [];
  }
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = hashtagRegex.exec(body)) !== null) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
}

export function PostList({ posts, onDelete, busySlug, canDelete, onSelectTag }: Props) {
  if (!posts.length) {
    return (
      <div className="empty-state">
        <p>No stories yet. Be the first to publish a thought.</p>
      </div>
    );
  }

  return (
    <div className="post-grid">
      {posts.map((post, index) => {
        const plain = stripHtml(post.body ?? "");
        const preview = plain.length > 320 ? `${plain.slice(0, 320)}...` : plain;
        const tags = extractHashtags(post.body);
        return (
          <article key={post.slug} className={`post-card${index === 0 ? " post-card--featured" : ""}`}>
            <Link href={`/posts/${post.slug}`}>
              <h3>{post.title}</h3>
            </Link>
            <p className="post-meta">
              by <strong>{post.author_name}</strong> · {new Date(post.created_at).toLocaleString()}
            </p>
            {plain && <p className="post-body">{preview || "⋯"}</p>}
            {tags.length > 0 && (
              <div className="tag-row">
                {tags.map((tag) =>
                  onSelectTag ? (
                    <button key={tag} type="button" className="tag-chip" onClick={() => onSelectTag(tag)}>
                      #{tag}
                    </button>
                  ) : (
                    <span key={tag} className="tag-chip">
                      #{tag}
                    </span>
                  )
                )}
              </div>
            )}
            {canDelete && onDelete && (
              <div className="post-actions">
                <button disabled={busySlug === post.slug} onClick={() => onDelete(post.slug)}>
                  {busySlug === post.slug ? "Removing..." : "Delete"}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
