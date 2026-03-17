import { useEffect, useRef } from "react";
import type { Comment } from "@/hooks/use-comments";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface CommentPanelProps {
  comments: Comment[];
  activeCommentId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentPanel({
  comments,
  activeCommentId,
  onEdit,
  onDelete,
}: CommentPanelProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // 当 activeCommentId 变化时，滚动激活卡片到可视区
  useEffect(() => {
    if (activeCommentId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeCommentId]);

  return (
    <aside className="comment-panel">
      {/* Header */}
      <div className="comment-panel-header">
        <span className="comment-panel-title">评论</span>
        {comments.length > 0 && (
          <span className="comment-panel-count">{comments.length}</span>
        )}
      </div>

      {/* List */}
      {comments.length === 0 ? (
        <div className="comment-panel-empty">
          选中文字后，在气泡菜单中点击「评论」
        </div>
      ) : (
        <div className="comment-panel-list">
          {comments.map((comment) => {
            const isActive = comment.id === activeCommentId;
            return (
              <div
                key={comment.id}
                ref={isActive ? activeRef : null}
                className={[
                  "comment-card",
                  isActive ? "comment-card--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className="comment-card-content">{comment.content}</p>
                <div className="comment-card-footer">
                  <span className="comment-card-time">
                    {formatTime(comment.createdAt)}
                  </span>
                  <div className="comment-card-actions">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => onEdit(comment.id)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => onDelete(comment.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
