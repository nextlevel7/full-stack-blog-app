import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleContent } from "@/components/ArticleContent";
import { fetchPost } from "@/lib/api";

type Params = {
  params: {
    slug: string;
  };
};

export default async function PostDetailPage({ params }: Params) {
  const post = await fetchPost(params.slug).catch(() => null);
  if (!post) {
    notFound();
  }

  return (
    <article className="article-page">
      <header className="article-header">
        <div>
          <p className="eyebrow">{new Date(post.created_at).toLocaleString()}</p>
          <h1>{post.title}</h1>
          <p className="article-meta">By {post.author_name}</p>
        </div>
        <Link className="ghost-button" href="/">
          Back to feed
        </Link>
      </header>
      <ArticleContent data={post.body_blocks} fallbackHtml={post.body} />
    </article>
  );
}
