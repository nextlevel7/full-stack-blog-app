import type { SanitizerConfig, ToolConstructable } from "@editorjs/editorjs";
import CodeTool from "@editorjs/code";
import { ToolType } from "@editorjs/editorjs/types/tools/adapters/tool-type";

function extractPlaintext(payload: unknown): string {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (typeof payload === "object") {
    const candidate = payload as { textContent?: string; innerText?: string; innerHTML?: string };
    if (typeof candidate.textContent === "string") {
      return candidate.textContent;
    }
    if (typeof candidate.innerText === "string") {
      return candidate.innerText;
    }
    if (typeof candidate.innerHTML === "string") {
      return candidate.innerHTML.replace(/<[^>]+>/g, "");
    }
  }
  return String(payload ?? "");
}

export default class SafeCodeTool extends CodeTool {
  static get sanitize(): SanitizerConfig {
    return {
      code: true,
    };
  }

  onPaste(event: any): void {
    const detail = event?.detail;
    const raw = detail?.data;
    const text = extractPlaintext(raw);
    this.data = { code: text };
  }
}
