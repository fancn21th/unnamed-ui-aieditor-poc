import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { TextSelection, type EditorState } from "@tiptap/pm/state";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import "./format-bubble-menu.scss";

interface FormatBubbleMenuProps {
  editor: Editor;
}

export function FormatBubbleMenu({ editor }: FormatBubbleMenuProps) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", strategy: "fixed", hide: true }}
      shouldShow={({ state }: { state: EditorState }) =>
        state.selection instanceof TextSelection && !state.selection.empty
      }
    >
      <div className="format-bubble-menu">
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
      </div>
    </BubbleMenu>
  );
}
