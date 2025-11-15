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
const imageRegex = /<img[^>]+src="([^"]+)"/i;

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

function extractImage(post: Post): string | null {
  if (post.body) {
    const match = imageRegex.exec(post.body);
    if (match) {
      return match[1];
    }
  }

  const blocks = post.body_blocks?.blocks;
  if (!Array.isArray(blocks)) {
    return null;
  }

  for (const block of blocks) {
    if (block?.type !== "image") continue;
    const data = block.data as { file?: { url?: string } } | undefined;
    const url = data?.file?.url || (data as any)?.url;
    if (typeof url === "string" && url.trim()) {
      return url;
    }
  }

  return null;
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
        const imageUrl = extractImage(post);
        return (
          <article key={post.slug} className="post-card post-card--list">
            <div className="post-card__content">
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
            </div>
            <div className="post-card__media">
              {imageUrl ? (
                <img src={imageUrl} alt={post.title} loading="lazy" />
              ) : (
                <div className="post-card__placeholder" aria-hidden="true">
                  <span>{post.title.slice(0, 1)}</span>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
