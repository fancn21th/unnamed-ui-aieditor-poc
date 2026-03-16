import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TextAlign } from "@tiptap/extension-text-align"
import { Highlight } from "@tiptap/extension-highlight"
import { Superscript } from "@tiptap/extension-superscript"
import { Subscript } from "@tiptap/extension-subscript"
import { Typography } from "@tiptap/extension-typography"
import { Image } from "@tiptap/extension-image"

import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover"
import { LinkPopover } from "@/components/tiptap-ui/link-popover"

import { PreserveInlineStyles } from "@/components/tiptap-extension/preserve-inline-styles-extension"
import { InlineStyle } from "@/components/tiptap-extension/inline-style-mark"
import {
  ContentBoundaryLock,
  type ContentBoundaryLockStore,
} from "@/components/tiptap-extension/content-boundary-lock"

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"
import { useWindowSize } from "@/hooks/use-window-size"

import { buildLockedHtml } from "@/lib/process-test-res"
import { TiptapDevModal } from "@/components/tiptap-dev-modal"

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-templates/hybrid/hybrid-editor.scss"

export function HybridEditor() {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const toolbarRef = useRef<HTMLDivElement>(null)
  // callback ref：wrapper 挂载后触发 re-render，portal container 才能拿到真实元素
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null)

  // 可变锁定存储 —— 由 ContentBoundaryLock plugin 闭包捕获
  const lockStore = useRef<ContentBoundaryLockStore>({ lockUntil: 0 })

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
      Image,
      // ↓ 保留所有 block 节点的 style 属性（border/width/padding/font 等）
      PreserveInlineStyles,
      // ↓ 保留 <span style="..."> 的内联样式（font-family/font-size 等）
      InlineStyle,
      // ↓ 位置范围锁：pos < lockUntil 的内容不可修改
      ContentBoundaryLock.configure({ store: lockStore.current }),
    ],
    content: "",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
      },
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // 初始化：加载 test-res.json 并在文档末追加可编辑段落，然后锁定前段内容
  useEffect(() => {
    if (!editor) return

    const lockedHtml = buildLockedHtml()
    // 末尾追加空段落作为用户可编辑入口
    editor.commands.setContent(lockedHtml + "<p></p>")

    // setContent 是同步的，editor.state 已更新
    // doc.content.size - 2 = 最后一个空段落节点的起始位置
    const docSize = editor.state.doc.content.size
    lockStore.current.lockUntil = docSize - 2
  }, [editor])

  const handleReload = () => {
    if (!editor) return
    // 解除锁定 → 重置内容 → 重新锁定
    lockStore.current.lockUntil = 0
    const lockedHtml = buildLockedHtml()
    editor.commands.setContent(lockedHtml + "<p></p>")
    const docSize = editor.state.doc.content.size
    lockStore.current.lockUntil = docSize - 2
  }

  return (
    <div className="hybrid-editor-wrapper" ref={setWrapperEl}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={
            isMobile ? { bottom: `calc(100% - ${height - rect.y}px)` } : {}
          }
        >
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
            <ColorHighlightPopover container={wrapperEl} />
            <LinkPopover container={wrapperEl} />
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
            <button className="hybrid-action-btn" onClick={handleReload}>
              重载
            </button>
          </ToolbarGroup>

          <Spacer />
        </Toolbar>

        <div className="hybrid-editor-content">
          <EditorContent editor={editor} role="presentation" />
        </div>
        <TiptapDevModal editor={editor} container={wrapperEl} />
      </EditorContext.Provider>
    </div>
  )
}
