"use client";

import { useCallback, useState } from "react";
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
import { NodeLock } from "@/components/tiptap-extension/node-lock-extension";
import { CommentMark } from "@/components/tiptap-extension/comment-mark-extension";
import { Markdown3BubbleMenu } from "@/components/tiptap-templates/markdown3/components/markdown3-bubble-menu";
import { CommentModal } from "@/components/tiptap-templates/markdown3/components/comment-modal";
import { TiptapDevModal } from "@/components/tiptap-dev-modal";

import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";

import "@/components/tiptap-templates/markdown3/markdown3-editor.scss";
import "./bubble-menu-editor.scss";

import gfmContent from "@/components/tiptap-templates/markdown3/data/gfm-simple.md?raw";

const LOCKABLE_NODE_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "taskList",
  "bulletList",
  "orderedList",
  "codeBlock",
];

export function BubbleMenuEditor() {
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "add" | "edit";
    pendingFrom: number;
    pendingTo: number;
    editId?: string;
    initialContent?: string;
  }>({ open: false, mode: "add", pendingFrom: 0, pendingTo: 0 });
  const { addComment, updateComment } = useComments();
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      NodeLock.configure({
        types: LOCKABLE_NODE_TYPES,
      }),
      CommentMark,
    ],
    content: gfmContent,
    contentType: "markdown",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "bubble-menu-editor",
      },
    },
  });

  const handleAddComment = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    setModalState({ open: true, mode: "add", pendingFrom: from, pendingTo: to });
  }, [editor]);

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

  return (
    <div className="bubble-menu-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {editor && (
          <Markdown3BubbleMenu
            editor={editor}
            lockableNodeTypes={LOCKABLE_NODE_TYPES}
            onAddComment={handleAddComment}
            scrollContainer={scrollContainer}
          />
        )}
        <div className="bubble-menu-editor-body">
          <div
            ref={setScrollContainer}
            className="bubble-menu-editor-center"
          >
            <div className="bubble-menu-editor-content">
              <EditorContent editor={editor} role="presentation" />
            </div>
          </div>
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
