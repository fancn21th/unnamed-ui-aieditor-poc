"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import {
  EditorContent,
  EditorContext,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useStreamingEditor } from "@/hooks/use-streaming-editor";

import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";
import { NodeLock } from "@/components/tiptap-extension/node-lock-extension";
import { Markdown3BubbleMenu } from "@/components/tiptap-templates/markdown3/components/markdown3-bubble-menu";
import { TocSidebar } from "@/components/tiptap-templates/markdown3/components/toc-sidebar";
import { CommentModal } from "@/components/tiptap-templates/markdown3/components/comment-modal";
import { CommentPanel } from "@/components/tiptap-templates/markdown3/components/comment-panel";
import { CommentMark } from "@/components/tiptap-extension/comment-mark-extension";
import { useComments } from "@/hooks/use-comments";
import { TiptapDevModal } from "@/components/tiptap-dev-modal";

import { createStreamSimulator } from "@/lib/stream-simulator";
import { MarkdownNodeBuffer } from "@/lib/markdown-node-buffer";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

import "@/components/tiptap-templates/markdown3/markdown3-editor.scss";
import content from "@/components/tiptap-templates/markdown3/data/gfm-simple.md?raw";
// import htmlContent from "/mockData/test.html?raw";
const LOCKABLE_NODE_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "taskList",
  "bulletList",
  "orderedList",
  "codeBlock",
];

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function Markdown3Editor() {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const [tocItems, setTocItems] = useState<TableOfContentData>([]);
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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "mardown3-editor",
      },
    },
    extensions: [
      StarterKit as any,
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      NodeLock.configure({
        types: LOCKABLE_NODE_TYPES,
      }),
      CommentMark,
      TableOfContents.configure({
        onUpdate: (content) => {
          setTocItems(content);
        },
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content,
    contentType: "markdown",
  });

  const { processMessage, reset } = useStreamingEditor(editor);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!editor) return;

    let aborted = false;
    const buffer = new MarkdownNodeBuffer({
      onMessage: processMessage,
    });

    const run = async () => {
      const stream = createStreamSimulator(content, {
        minChunkSize: 3,
        maxChunkSize: 25,
        delayMs: 150,
        delayJitter: 30,
      });

      for await (const chunk of stream) {
        if (aborted) break;
        buffer.push(chunk);
      }

      if (!aborted) {
        buffer.done();
      }
    };

    run();

    return () => {
      aborted = true;
      reset();
    };
  }, [editor, processMessage, reset]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // ── 评论：给激活的 comment-mark span 同步 --active CSS 类 ─────────────
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

  // ── 评论：在气泡菜单点击「评论」时触发 ──────────────────────────────
  const handleAddComment = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    setModalState({ open: true, mode: "add", pendingFrom: from, pendingTo: to });
  }, [editor]);

  // ── 评论：点击编辑器内带虚线文字时，高亮对应评论卡片 ─────────────────
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const el = target.closest("[data-comment-id]") as HTMLElement | null;
    setActiveCommentId(el?.dataset.commentId ?? null);
  }, []);

  // ── 评论：Modal 确认 ──────────────────────────────────────────────
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
    <div className="mardown3-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        {editor && (
          <Markdown3BubbleMenu
            editor={editor}
            lockableNodeTypes={LOCKABLE_NODE_TYPES}
            onAddComment={handleAddComment}
            scrollContainer={scrollContainer}
          />
        )}

        <div className="mardown3-editor-body">
          {!isMobile && (
            <TocSidebar items={tocItems} topOffset={60} />
          )}
          <div
            ref={setScrollContainer}
            className="mardown3-editor-center"
            onClick={handleEditorClick}
          >
            <EditorContent
              editor={editor}
              role="presentation"
              className="mardown3-editor-content"
            />
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
