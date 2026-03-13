"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
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
import { Selection } from "@tiptap/extensions";
import { Node as PMNode } from "@tiptap/pm/model";

import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
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
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
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

import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

import {
  SnapshotCompareExtension,
  applyDiff,
  clearDiff,
} from "@/components/tiptap-extension/snapshot-compare-extension";
import {
  saveSnapshot,
  getSnapshots,
  type SnapshotEntry,
} from "@/lib/snapshot-store";
import { computeDiff } from "@/lib/snapshot-diff";
import { SnapshotHistoryPanel } from "./components/snapshot-history-panel";

import content from "@/components/tiptap-templates/markdown2/data/content.md?raw";
import "./markdown-snapshot-local-editor.scss";

// ─── Toolbar 子组件（复用 markdown2 的结构）──────────────────────────────────

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => (
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

// ─── 主编辑器组件 ──────────────────────────────────────────────────────────────

export function MarkdownSnapshotLocalEditor() {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main");
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>(() => getSnapshots());
  const [comparingId, setComparingId] = useState<string | null>(null);
  /** 比较模式期间保存的"工作内容"，退出时恢复 */
  const savedDocRef = useRef<ReturnType<NonNullable<typeof editor>["getJSON"]> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "markdown-snapshot-local-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: { openOnClick: false, enableClickSelection: true },
      }),
      Markdown.configure({ markedOptions: { gfm: true } }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      SnapshotCompareExtension,
    ],
    content,
    contentType: "markdown",
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") setMobileView("main");
  }, [isMobile, mobileView]);

  // ── 保存快照 ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!editor) return;
    saveSnapshot(editor.getJSON());
    setSnapshots(getSnapshots());
  }, [editor]);

  // ── 进入比较模式 ───────────────────────────────────────────────────────────
  const handleCompare = useCallback(
    (id: string) => {
      if (!editor) return;

      // 如果已经在比较模式中，先退出再重新进入（切换版本）
      if (comparingId !== null) {
        clearDiff(editor);
        editor.setEditable(true);
        // 恢复之前保存的工作文档（下面会重新保存新的）
      }

      const allSnapshots = getSnapshots();
      const idx = allSnapshots.findIndex((s) => s.id === id);
      if (idx < 0) return;

      const headSnapshot = allSnapshots[idx];     // 选中的版本（较新）
      const baseSnapshot = allSnapshots[idx + 1]; // 前一个版本（较旧），可能不存在

      // 保存当前工作内容（首次进入比较模式时）
      if (comparingId === null) {
        savedDocRef.current = editor.getJSON();
      }

      // 切换编辑器内容为选中版本
      editor.commands.setContent(headSnapshot.docJSON);
      editor.setEditable(false);

      setComparingId(id);

      // 异步执行 diff，等 editor 内容更新后再计算
      setTimeout(() => {
        if (!baseSnapshot) return; // 没有更早版本，仅展示内容，不 diff

        const headDoc = PMNode.fromJSON(editor.schema, headSnapshot.docJSON);
        const baseDoc = PMNode.fromJSON(editor.schema, baseSnapshot.docJSON);
        const ranges = computeDiff(baseDoc, headDoc);
        applyDiff(editor, ranges);
      }, 0);
    },
    [editor, comparingId]
  );

  // ── 关闭比较模式 ───────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (!editor) return;
    clearDiff(editor);
    editor.setEditable(true);
    if (savedDocRef.current) {
      editor.commands.setContent(savedDocRef.current);
      savedDocRef.current = null;
    }
    setComparingId(null);
  }, [editor]);

  // ── 恢复版本 ───────────────────────────────────────────────────────────────
  const handleRestore = useCallback(
    (id: string) => {
      if (!editor) return;
      const allSnapshots = getSnapshots();
      const target = allSnapshots.find((s) => s.id === id);
      if (!target) return;

      clearDiff(editor);
      editor.setEditable(true);
      editor.commands.setContent(target.docJSON);
      savedDocRef.current = null;
      setComparingId(null);
    },
    [editor]
  );

  return (
    <div className="msl-wrapper">
      <EditorContext.Provider value={{ editor }}>
        {/* 左侧编辑区 */}
        <div className="msl-editor-area">
          <Toolbar
            ref={toolbarRef}
            style={
              isMobile
                ? { bottom: `calc(100% - ${height - rect.y}px)` }
                : undefined
            }
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

          <EditorContent
            editor={editor}
            role="presentation"
            className="msl-editor-content"
          />
        </div>

        {/* 右侧历史面板 */}
        <SnapshotHistoryPanel
          snapshots={snapshots}
          comparingId={comparingId}
          onCompare={handleCompare}
          onClose={handleClose}
          onRestore={handleRestore}
          onSave={handleSave}
        />
      </EditorContext.Provider>
    </div>
  );
}
