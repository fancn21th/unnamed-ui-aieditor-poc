"use client";

import { useState } from "react";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";

import { TocSidebar } from "@/components/tiptap-templates/markdown3/components/toc-sidebar";
import { TiptapDevModal } from "@/components/tiptap-dev-modal";

import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";

import "@/components/tiptap-templates/markdown3/markdown3-editor.scss";
import "./toc-editor.scss";

import gfmContent from "@/components/tiptap-templates/markdown3/data/gfm-simple.md?raw";

export function TocEditor() {
  const [tocItems, setTocItems] = useState<TableOfContentData>([]);

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
      TableOfContents.configure({
        onUpdate: (content) => setTocItems(content),
      }),
    ],
    content: gfmContent,
    contentType: "markdown",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "toc-editor",
      },
    },
  });

  return (
    <div className="toc-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <div className="toc-editor-body">
          <TocSidebar
            items={tocItems}
            topOffset={0}
            scrollContainerClassName="toc-editor-center"
          />
          <div className="toc-editor-center">
            <div className="toc-editor-content">
              <EditorContent editor={editor} role="presentation" />
            </div>
          </div>
        </div>
        <TiptapDevModal editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}
