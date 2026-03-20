"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";

import { useComments } from "@/hooks/use-comments";

import { CommentMark } from "@/components/tiptap-extension/comment-mark-extension";
import { Markdown3BubbleMenu } from "@/components/tiptap-templates/markdown3/components/markdown3-bubble-menu";
import { CommentPanel } from "@/components/tiptap-templates/markdown3/components/comment-panel";
import { CommentModal } from "@/components/tiptap-templates/markdown3/components/comment-modal";
import { TiptapDevModal } from "@/components/tiptap-dev-modal";

import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";

import "@/components/tiptap-templates/markdown3/markdown3-editor.scss";
import "./comments-editor.scss";

import gfmContent from "@/components/tiptap-templates/markdown3/data/gfm-simple.md?raw";

export function CommentsEditor() {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "add" | "edit";
    pendingFrom: number;
    pendingTo: number;
    editId?: string;
    initialContent?: string;
  }>({ open: false, mode: "add", pendingFrom: 0, pendingTo: 0 });
  const { comments, addComment, updateComment, deleteComment } = useComments();
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      Table,
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem,
      CommentMark,
    ],
    content: gfmContent,
    contentType: "markdown",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "comments-editor",
      },
    },
  });

  // 同步激活评论的 CSS class
  useEffect(() => {
    document.querySelectorAll(".comment-mark--active").forEach((el) => {
      el.classList.remove("comment-mark--active");
    });
    if (activeCommentId) {
      document
        .querySelectorAll(`[data-comment-id="${activeCommentId}"]`)
        .forEach((el) => el.classList.add("comment-mark--active"));
    }
  }, [activeCommentId]);

  const handleAddComment = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    setModalState({ open: true, mode: "add", pendingFrom: from, pendingTo: to });
  }, [editor]);

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const el = target.closest("[data-comment-id]") as HTMLElement | null;
    setActiveCommentId(el?.dataset.commentId ?? null);
  }, []);

  const handleModalConfirm = useCallback(
    (content: string) => {
      if (!editor) return;
      if (modalState.mode === "add") {
        const id = crypto.randomUUID();
        editor
          .chain()
          .focus()
          .setTextSelection({ from: modalState.pendingFrom, to: modalState.pendingTo })
          .setCommentMark(id)
          .run();
        addComment(id, content);
      } else if (modalState.mode === "edit" && modalState.editId) {
        updateComment(modalState.editId, content);
      }
      setModalState((s) => ({ ...s, open: false }));
    },
    [editor, modalState, addComment, updateComment],
  );

  const handleEditComment = useCallback(
    (id: string) => {
      const c = comments.find((c) => c.id === id);
      if (!c) return;
      setModalState({
        open: true,
        mode: "edit",
        pendingFrom: 0,
        pendingTo: 0,
        editId: id,
        initialContent: c.content,
      });
    },
    [comments],
  );

  const handleDeleteComment = useCallback(
    (id: string) => {
      deleteComment(id, editor ?? undefined);
      if (activeCommentId === id) setActiveCommentId(null);
    },
    [deleteComment, editor, activeCommentId],
  );

  return (
    <div className="comments-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {editor && (
          <Markdown3BubbleMenu
            editor={editor}
            lockableNodeTypes={[]}
            onAddComment={handleAddComment}
            scrollContainer={scrollContainer}
          />
        )}
        <div className="comments-editor-body">
          <div
            ref={setScrollContainer}
            className="comments-editor-center"
            onClick={handleEditorClick}
          >
            <div className="comments-editor-content">
              <EditorContent editor={editor} role="presentation" />
            </div>
          </div>
          <CommentPanel
            comments={comments}
            activeCommentId={activeCommentId}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
          />
        </div>
        <CommentModal
          open={modalState.open}
          initialContent={modalState.initialContent ?? ""}
          onConfirm={handleModalConfirm}
          onClose={() => setModalState((s) => ({ ...s, open: false }))}
        />
        <TiptapDevModal editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}
