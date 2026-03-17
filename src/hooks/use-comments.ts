import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";

const STORAGE_KEY = "md3-comments";

export interface Comment {
  id: string;
  content: string;
  createdAt: number;
}

function loadComments(): Comment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

function persist(comments: Comment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

export function useComments() {
  const [comments, setComments] = useState<Comment[]>(loadComments);

  const addComment = useCallback((id: string, content: string) => {
    setComments((prev) => {
      const next: Comment[] = [
        ...prev,
        { id, content, createdAt: Date.now() },
      ];
      persist(next);
      return next;
    });
  }, []);

  const updateComment = useCallback((id: string, content: string) => {
    setComments((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, content } : c));
      persist(next);
      return next;
    });
  }, []);

  /**
   * 删除评论，同时移除编辑器内对应的 comment-mark。
   * editor 为可选，外部传入后清除 mark；若不传则仅清除数据。
   */
  const deleteComment = useCallback((id: string, editor?: Editor) => {
    editor?.commands.removeCommentMark(id);
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { comments, addComment, updateComment, deleteComment };
}
