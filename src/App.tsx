import { usePageRoute } from "./hooks/use-page-route";
import { PrototypeLayout } from "./components/layout/prototype-layout";
import { SimpleEditor } from "./components/tiptap-templates/simple/simple-editor";
import { BubbleMenuEditor } from "./components/tiptap-templates/bubble-menu-editor/bubble-menu-editor";
import { Markdown2Editor } from "./components/tiptap-templates/markdown2/markdown2-editor";
import { MarkdownEditor } from "./components/tiptap-templates/markdown/markdown-editor";
import { TocEditor } from "./components/tiptap-templates/toc-editor/toc-editor";
import { CommentsEditor } from "./components/tiptap-templates/comments-editor/comments-editor";
import { Markdown3Editor } from "./components/tiptap-templates/markdown3/markdown3-editor";

const PAGE_COMPONENTS = {
  basic: SimpleEditor,
  bubbleMenu: BubbleMenuEditor,
  toolbar: Markdown2Editor,
  streaming: MarkdownEditor,
  toc: TocEditor,
  comments: CommentsEditor,
  pro: Markdown3Editor,
} as const;

export default function App() {
  const { currentPage, navigateTo } = usePageRoute();
  const PageComponent = PAGE_COMPONENTS[currentPage];

  return (
    <PrototypeLayout currentPage={currentPage} onNavigate={navigateTo}>
      <PageComponent />
    </PrototypeLayout>
  );
}
