"use client";

import { useId, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData, EditorConfig } from "@editorjs/editorjs";

export type EditorHandle = {
  save: () => Promise<OutputData | null>;
  clear: () => Promise<void>;
  render: (data: OutputData) => Promise<void>;
  focus: () => Promise<void>;
};

type Props = {
  data?: OutputData;
  placeholder?: string;
  onChange?: (data: OutputData) => void;
  authToken?: string | null;
  uploadEndpoint?: string;
};

export const Editor = forwardRef<EditorHandle, Props>(function Editor({ data, placeholder, onChange, authToken, uploadEndpoint }, ref) {
  const holderId = useId().replace(/:/g, "_");
  const instanceRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef<typeof onChange>();
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let cancelled = false;
    const load = async () => {
      const [
        { default: EditorJSConstructor },
        { default: Header },
        { default: List },
        { default: Checklist },
        { default: Quote },
        { default: Code },
        { default: Table },
        { default: Embed },
        { default: ImageTool },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/checklist"),
        import("@editorjs/quote"),
        import("@editorjs/code"),
        import("@editorjs/table"),
        import("@editorjs/embed"),
        import("@editorjs/image"),
      ]);

      if (cancelled) {
        return;
      }
      const editorConfig: EditorConfig = {
        holder: holderId,
        autofocus: true,
        placeholder: placeholder ?? "Start writing...",
        data,
        tools: {
          header: { class: Header, inlineToolbar: true, config: { placeholder: "Heading" } },
          list: { class: List, inlineToolbar: true },
          checklist: { class: Checklist, inlineToolbar: true },
          quote: { class: Quote, inlineToolbar: true },
          code: Code,
          table: Table,
          embed: Embed,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                const endpoint = uploadEndpoint || process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || "/api/uploads/images";
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const response = await fetch(endpoint, {
                    method: "POST",
                    body: formData,
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                  });
                  if (!response.ok) {
                    throw new Error("Upload failed");
                  }
                  const payload = await response.json();
                  if (payload?.url) {
                    return { success: 1, file: { url: payload.url } };
                  }
                } catch {
                  // fallback to data URL
                }
                const url = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => reject(reader.error);
                  reader.readAsDataURL(file);
                });
                return { success: 1, file: { url } };
              },
            },
          },
        },
        },
        onChange: async () => {
          if (!onChangeRef.current) return;
          const saved = await editor.save();
          onChangeRef.current(saved);
        },
      };
      const editor = new EditorJSConstructor(editorConfig);
      instanceRef.current = editor;
    };

    load();
    return () => {
      cancelled = true;
      instanceRef.current?.destroy?.();
      instanceRef.current = null;
    };
  }, [holderId, placeholder]);

  const clearEditor = useCallback(async () => {
    if (!instanceRef.current) {
      return;
    }
    await instanceRef.current.isReady;
    instanceRef.current.blocks.clear();
  }, []);

  const renderData = useCallback(async (payload?: OutputData | null) => {
    if (!instanceRef.current) {
      return;
    }
    await instanceRef.current.isReady;
    if (!payload || !payload.blocks?.length) {
      instanceRef.current.blocks.clear();
    } else {
      await instanceRef.current.render(payload);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      async save() {
        if (!instanceRef.current) return null;
        return instanceRef.current.save();
      },
      async clear() {
        await clearEditor();
      },
      async focus() {
        if (!instanceRef.current) return;
        await instanceRef.current.isReady;
        const holder = document.getElementById(holderId);
        if (!holder) return;
        const editable = holder.querySelector<HTMLElement>("[contenteditable='true']");
        if (editable) {
          editable.focus();
          try {
            const range = document.createRange();
            range.selectNodeContents(editable);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          } catch {
          }
        }
      },
      async render(payload: OutputData) {
        await renderData(payload);
      },
    }),
    [clearEditor, renderData]
  );

  return <div id={holderId} className="editorjs-container" />;
});
