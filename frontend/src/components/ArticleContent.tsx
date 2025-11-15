import type { OutputData } from "@editorjs/editorjs";

function renderList(items: any[], ordered = false) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items?.map((item, index) => (
        <li key={index} dangerouslySetInnerHTML={{ __html: typeof item === "string" ? item : item?.text || "" }} />
      ))}
    </Tag>
  );
}

export function ArticleContent({ data, fallbackHtml }: { data?: OutputData; fallbackHtml?: string }) {
  if (!data?.blocks?.length && fallbackHtml) {
    return <section className="article-body" dangerouslySetInnerHTML={{ __html: fallbackHtml }} />;
  }

  return (
    <section className="article-body">
      {data?.blocks?.map((block, index) => {
        const content = block.data as any;
        switch (block.type) {
          case "header":
            const Tag = `h${content?.level ?? 2}` as keyof JSX.IntrinsicElements;
            return <Tag key={index} dangerouslySetInnerHTML={{ __html: content?.text || "" }} />;
          case "paragraph":
            return <p key={index} dangerouslySetInnerHTML={{ __html: content?.text || "" }} />;
          case "list":
            return <div key={index}>{renderList(content?.items || [], content?.style === "ordered")}</div>;
          case "checklist":
            return (
              <ul key={index} className="checklist">
                {(content?.items || []).map((item: any, idx: number) => (
                  <li key={idx}>
                    <input type="checkbox" checked={!!item.checked} readOnly />
                    <span dangerouslySetInnerHTML={{ __html: item.text || "" }} />
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={index}>
                <div dangerouslySetInnerHTML={{ __html: content?.text || "" }} />
                {content?.caption && <cite>{content.caption}</cite>}
              </blockquote>
            );
          case "code":
            return (
              <pre key={index}>
                <code>{content?.code}</code>
              </pre>
            );
          case "table":
            return (
              <table key={index}>
                <tbody>
                  {(content?.content || []).map((row: any[], rowIdx: number) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} dangerouslySetInnerHTML={{ __html: cell }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "embed":
            return (
              <div key={index} className={`embed embed-${content?.service ?? ""}`}>
                <iframe src={content?.source} allowFullScreen title={content?.service || "embed"} />
              </div>
            );
          case "image":
            return (
              <figure key={index}>
                <img src={content?.file?.url} alt={content?.caption || ""} />
                {content?.caption && <figcaption>{content.caption}</figcaption>}
              </figure>
            );
          default:
            return content?.text ? <p key={index} dangerouslySetInnerHTML={{ __html: content.text }} /> : null;
        }
      })}
    </section>
  );
}
