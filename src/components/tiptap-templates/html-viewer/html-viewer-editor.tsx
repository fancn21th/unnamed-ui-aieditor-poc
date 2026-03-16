import { useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { Typography } from "@tiptap/extension-typography";

import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import {
  ColorHighlightPopover,
} from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";

import { Mark } from "@tiptap/core";
import { PreserveInlineStyles } from "@/components/tiptap-extension/preserve-inline-styles-extension";

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useWindowSize } from "@/hooks/use-window-size";

// <span style="..."> 内联样式 Mark —— 保留字体、字号等 span 级样式
const InlineStyle = Mark.create({
  name: "inlineStyle",
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("style") || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.style ? { style: attrs.style } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style]" }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ["span", HTMLAttributes, 0];
  },
});

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import "@/components/tiptap-templates/html-viewer/html-viewer-editor.scss";

// 直接导入 mockData/test.html 原始字符串
import testHtml from "../../../../mockData/test.html?raw";

type ViewMode = "editor" | "preview";

export function HtmlViewerEditor() {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      Typography,
      // ↓ 保留所有 block 节点的内联 style 属性（border/width/padding 等）
      PreserveInlineStyles,
      // ↓ 保留 <span style="..."> 的内联样式（font-family/font-size 等）
      InlineStyle,
    ],
    content: "",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        // ⚠️ 不设置 class，避免 .markdown2-editor 等规则覆盖 HTML 内联样式
      },
    },
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  // 首次加载时渲染 HTML
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(testHtml);
  }, [editor]);

  const handleReload = () => {
    if (!editor) return;
    editor.commands.setContent(testHtml);
  };

  const handleClear = () => {
    if (!editor) return;
    editor.commands.clearContent();
  };

  return (
    <div className="html-viewer-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? { bottom: `calc(100% - ${height - rect.y}px)` }
              : {}),
          }}
        >
          {/* Tab 切换 */}
          <ToolbarGroup>
            <button
              className={`html-viewer-tab-btn${viewMode === "preview" ? " active" : ""}`}
              onClick={() => setViewMode("preview")}
            >
              原始预览
            </button>
            <button
              className={`html-viewer-tab-btn${viewMode === "editor" ? " active" : ""}`}
              onClick={() => setViewMode("editor")}
            >
              编辑器视图
            </button>
          </ToolbarGroup>

          <ToolbarSeparator />

          {/* 编辑器视图专属工具栏 */}
          {viewMode === "editor" && (
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
                <ColorHighlightPopover />
                <LinkPopover />
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
                <button className="html-viewer-action-btn" onClick={handleReload}>
                  重载
                </button>
                <button className="html-viewer-action-btn" onClick={handleClear}>
                  清空
                </button>
              </ToolbarGroup>
              <Spacer />
            </>
          )}
        </Toolbar>

        {/* 原始预览：用 iframe 完整保留所有内联样式和浏览器默认渲染 */}
        {viewMode === "preview" && (
          <iframe
            className="html-viewer-iframe"
            srcDoc={testHtml}
            sandbox="allow-same-origin"
            title="HTML 原始预览"
          />
        )}

        {/* 编辑器视图：Tiptap 解析后的效果 */}
        {viewMode === "editor" && (
          <div className="html-viewer-content">
            <EditorContent editor={editor} role="presentation" />
          </div>
        )}
      </EditorContext.Provider>
    </div>
  );
}
