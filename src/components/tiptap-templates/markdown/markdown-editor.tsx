import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { useEffect } from "react";

import { createStreamSimulator } from "@/lib/stream-simulator";
import { MarkdownNodeBuffer } from "@/lib/markdown-node-buffer";
import { useStreamingEditor } from "@/hooks/use-streaming-editor";

// Node styles
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";

// Editor styles
import "@/components/tiptap-templates/markdown/markdown-editor.scss";

import gfmContent from "./data/gfm-simple.md?raw";

export function MarkdownEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      Table,
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem,
    ],
    content: "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "markdown-editor",
      },
    },
  });

  const { processMessage, reset } = useStreamingEditor(editor);

  useEffect(() => {
    if (!editor) return;

    let aborted = false;

    const buffer = new MarkdownNodeBuffer({
      onMessage: processMessage,
    });

    const run = async () => {
      const stream = createStreamSimulator(gfmContent, {
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

  return (
    <div className="markdown-editor-wrapper">
      <div className="markdown-editor-content">
        <EditorContext.Provider value={{ editor }}>
          <EditorContent editor={editor} role="presentation" />
        </EditorContext.Provider>
      </div>
    </div>
  );
}
