import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { useInsertMarkdown } from "@/hooks/use-insert-markdown";
import { chunkText } from "@/lib/chunk-text";
import remend from "remend";
import { useEffect, useRef } from "react";

import gfmContent from "./data/gfm-simple.md?raw";
// import gfmContent from "./data/gfm-example.md?raw";

const chunks = chunkText(gfmContent);

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
  });

  const { insertMarkdown } = useInsertMarkdown(editor);

  const indexRef = useRef(0);

  useEffect(() => {
    if (!editor) return;

    console.log("start inserting markdown chunks...");

    const interval = setInterval(() => {
      if (indexRef.current < chunks.length) {
        const chunk = chunks[indexRef.current];
        const remendedChunk = remend(chunk);
        if (remendedChunk.trim()) {
          insertMarkdown(remendedChunk);
        }
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [editor]);

  return (
    <div>
      <EditorContext.Provider value={{ editor }}>
        <EditorContent editor={editor} role="presentation" />
      </EditorContext.Provider>
    </div>
  );
}
