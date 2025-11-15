"use client";

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from "react";
import type { OutputData } from "@editorjs/editorjs";

import { Editor, type EditorHandle } from "@/components/Editor";

type Props = {
  onSubmit: (values: { title: string; body: OutputData }) => Promise<void>;
  busy: boolean;
  initialTitle?: string;
  initialData?: OutputData | null;
  resetAfterSubmit?: boolean;
  authToken?: string | null;
};

export type PostFormHandle = {
  submit: () => void;
  reset: () => void;
};

export const PostForm = forwardRef<PostFormHandle, Props>(function PostForm(
  { onSubmit, busy, initialTitle, initialData, resetAfterSubmit = true, authToken },
  ref
) {
  const cloneData = (data?: OutputData | null) => (data ? (JSON.parse(JSON.stringify(data)) as OutputData) : null);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [editorData, setEditorData] = useState<OutputData | null>(cloneData(initialData));
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
    setTitle(initialTitle ?? "");
  }, [initialTitle]);

  useEffect(() => {
    const nextData = cloneData(initialData);
    setEditorData(nextData);
    if (!nextData) {
      void editorRef.current?.clear();
    } else {
      void editorRef.current?.render(nextData);
    }
  }, [initialData]);

  const wordCount = useMemo(() => {
    if (!editorData?.blocks?.length) {
      return 0;
    }
    const text = editorData.blocks
      .map((block) => {
        if (typeof block.data?.text === "string") {
          return block.data.text;
        }
        if (Array.isArray((block.data as any)?.items)) {
          return (block.data as any).items.join(" ");
        }
        return "";
      })
      .join(" ");
    const clean = text.replace(/<[^>]+>/g, " ").trim();
    return clean ? clean.split(/\\s+/).length : 0;
  }, [editorData]);

  const handleSubmit = useCallback(async () => {
    if (busy) {
      return;
    }
    setError(null);
    if (!title.trim()) {
      setError("Give your story a name.");
      return;
    }
    const data = editorData || (await editorRef.current?.save());
    if (!data || !data.blocks || data.blocks.length === 0) {
      setError("Tell your story in the editor.");
      return;
    }
    const hasText = data.blocks.some((block) => {
      if (typeof block.data?.text === "string" && block.data.text.replace(/<[^>]+>/g, " ").trim()) {
        return true;
      }
      if (Array.isArray((block.data as any)?.items) && (block.data as any).items.join(" ").trim()) {
        return true;
      }
      if (block.type === "image" && block.data?.file?.url) {
        return true;
      }
      return false;
    });
    if (!hasText) {
      setError("Tell your story in the editor.");
      return;
    }
    await onSubmit({ title, body: data });
    if (resetAfterSubmit) {
      setTitle("");
      setEditorData(null);
      await editorRef.current?.clear();
    }
  }, [busy, editorData, onSubmit, resetAfterSubmit, title]);

  const handleReset = useCallback(async () => {
    if (busy) {
      return;
    }
    setTitle(initialTitle ?? "");
    const nextData = cloneData(initialData);
    setEditorData(nextData);
    if (!nextData) {
      await editorRef.current?.clear();
    } else {
      await editorRef.current?.render(nextData);
    }
  }, [busy, initialData, initialTitle]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleSubmit();
      },
      reset: () => {
        void handleReset();
      },
    }),
    [handleReset, handleSubmit]
  );

  return (
    <div className="editor-wrapper">
      <div className="editor-word-count">
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </div>
      <input
        className="editor-title"
        name="title"
        placeholder="Title your masterpiece"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={busy}
      />
      <Editor
        ref={editorRef}
        placeholder="Share your idea with the world..."
        data={editorData ?? undefined}
        onChange={setEditorData}
        authToken={authToken}
      />
      {error && <p className="danger" style={{ marginTop: "1rem" }}>{error}</p>}
    </div>
  );
});
