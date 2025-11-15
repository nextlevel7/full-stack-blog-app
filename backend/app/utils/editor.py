from __future__ import annotations

from html import escape
from typing import Any


def _render_list(items: list[Any], *, ordered: bool = False) -> str:
    tag = "ol" if ordered else "ul"
    inner = "".join(
        f"<li>{escape(item.get('text') if isinstance(item, dict) else str(item))}</li>"
        for item in items
    )
    return f"<{tag}>{inner}</{tag}>"


def editorjs_to_html(data: dict[str, Any] | None) -> str:
    if not data:
        return ""
    blocks = data.get("blocks", []) if isinstance(data, dict) else []
    html_parts: list[str] = []
    for block in blocks:
        if not isinstance(block, dict):
            continue
        block_type = block.get("type")
        content = block.get("data", {})
        text = content.get("text") if isinstance(content, dict) else ""
        if block_type == "header":
            level = content.get("level", 2)
            html_parts.append(f"<h{level}>{text or ''}</h{level}>")
        elif block_type == "paragraph":
            html_parts.append(f"<p>{text or ''}</p>")
        elif block_type == "list":
            style = content.get("style", "unordered")
            items = content.get("items", [])
            html_parts.append(_render_list(items, ordered=style == "ordered"))
        elif block_type == "checklist":
            items = content.get("items", [])
            inner = "".join(
                f"<li><input type='checkbox' {'checked' if item.get('checked') else ''} disabled /> {escape(item.get('text', ''))}</li>"
                for item in items
            )
            html_parts.append(f"<ul class='checklist'>{inner}</ul>")
        elif block_type == "quote":
            caption = escape(content.get("caption", ""))
            html_parts.append(f"<blockquote>{text or ''}{f'<cite>{caption}</cite>' if caption else ''}</blockquote>")
        elif block_type == "code":
            html_parts.append(f"<pre><code>{escape(content.get('code', ''))}</code></pre>")
        elif block_type == "table":
            rows = content.get("content", [])
            table = "".join(
                "<tr>" + "".join(f"<td>{escape(str(cell))}</td>" for cell in row) + "</tr>" for row in rows
            )
            html_parts.append(f"<table>{table}</table>")
        elif block_type == "embed":
            service = escape(content.get("service", ""))
            source = content.get("source", "")
            iframe = f"<iframe src='{escape(source)}' allowfullscreen></iframe>"
            html_parts.append(f"<div class='embed embed-{service}'>{iframe}</div>")
        elif block_type == "image":
            file_data = content.get("file", {})
            url = file_data.get("url")
            if url:
                caption = content.get("caption", "")
                caption_html = f"<figcaption>{escape(caption)}</figcaption>" if caption else ""
                html_parts.append(f"<figure><img src='{escape(url)}' alt='{escape(caption)}'/>{caption_html}</figure>")
        else:
            text = content.get("text")
            if text:
                html_parts.append(f"<p>{text}</p>")
    return "".join(html_parts)
