import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

export function MarkdownEditor() {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: `# Hello World\n\nThis is **Markdown**!`,
    contentType: 'markdown',
  });

  return (
    <div>
      <EditorContext.Provider value={{ editor }}>
        <EditorContent editor={editor} role="presentation" />
      </EditorContext.Provider>
    </div>
  );
}
