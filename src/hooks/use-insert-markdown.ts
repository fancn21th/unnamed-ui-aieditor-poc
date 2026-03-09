import { Editor } from "@tiptap/react";

export function useInsertMarkdown(editor: Editor | null) {
  const insertMarkdown = (content: string) => {
    if (!editor) return;
    editor.commands.insertContent(content, { contentType: "markdown" });
  };

  return { insertMarkdown };
}
