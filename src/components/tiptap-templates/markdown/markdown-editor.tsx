import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import gfmContent from "./data/gfm-example.md?raw";

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
    content: gfmContent,
    contentType: "markdown",
  });

  return (
    <div>
      <EditorContext.Provider value={{ editor }}>
        <EditorContent editor={editor} role="presentation" />
      </EditorContext.Provider>
    </div>
  );
}
