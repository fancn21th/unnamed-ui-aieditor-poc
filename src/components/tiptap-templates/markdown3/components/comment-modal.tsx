import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface CommentModalProps {
  open: boolean;
  initialContent?: string;
  onConfirm: (content: string) => void;
  onClose: () => void;
}

export function CommentModal({
  open,
  initialContent = "",
  onConfirm,
  onClose,
}: CommentModalProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      // 延迟 focus，等待 DOM 渲染
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, initialContent]);

  if (!open) return null;

  const handleConfirm = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleConfirm();
    }
  };

  return (
    <div
      className="comment-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="comment-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="comment-modal-title">
          {initialContent ? "编辑评论" : "添加评论"}
        </h3>
        <textarea
          ref={textareaRef}
          className="comment-modal-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入评论内容… (Ctrl+Enter 确定)"
          rows={4}
        />
        <div className="comment-modal-actions">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!content.trim()}
          >
            确定
          </Button>
        </div>
      </div>
    </div>
  );
}
