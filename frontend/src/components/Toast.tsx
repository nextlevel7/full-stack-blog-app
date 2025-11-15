"use client";

import { useEffect } from "react";

export type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    if (!onClose) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
