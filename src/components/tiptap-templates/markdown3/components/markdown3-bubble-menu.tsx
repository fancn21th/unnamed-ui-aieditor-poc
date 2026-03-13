"use client";

import { useCallback } from "react";
import type { Editor, EditorStateSnapshot } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { TextSelection, type EditorState } from "@tiptap/pm/state";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface Markdown3BubbleMenuProps {
  editor: Editor;
  lockableNodeTypes: string[];
}

function getNodeLockStateFromState(state: EditorState, lockableNodeTypes: string[]) {
  const typeSet = new Set(lockableNodeTypes);
  for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) {
    const node = state.selection.$from.node(depth);
    if (!node.isBlock) continue;
    if (!typeSet.has(node.type.name)) continue;
    return {
      available: true,
      locked: Boolean(node.attrs?.locked),
    };
  }
  return {
    available: false,
    locked: false,
  };
}

export function Markdown3BubbleMenu({
  editor,
  lockableNodeTypes,
}: Markdown3BubbleMenuProps) {
  const { isBold, isItalic, isStrike, nodeLockState } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }: EditorStateSnapshot) => {
      if (!currentEditor) {
        return {
          isBold: false,
          isItalic: false,
          isStrike: false,
          nodeLockState: {
            available: false,
            locked: false,
          },
        };
      }
      return {
        isBold: currentEditor.isActive("bold"),
        isItalic: currentEditor.isActive("italic"),
        isStrike: currentEditor.isActive("strike"),
        nodeLockState: getNodeLockStateFromState(
          currentEditor.state,
          lockableNodeTypes,
        ),
      };
    },
  });

  const handleBold = useCallback(() => {
    editor.chain().focus().toggleMark("bold").run();
  }, [editor]);

  const handleItalic = useCallback(() => {
    editor.chain().focus().toggleMark("italic").run();
  }, [editor]);

  const handleStrike = useCallback(() => {
    editor.chain().focus().toggleMark("strike").run();
  }, [editor]);

  const handleToggleNodeLock = useCallback(() => {
    if (!nodeLockState.available) return;
    editor.chain().focus().toggleCurrentNodeLock().run();
  }, [editor, nodeLockState.available]);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ state }: { state: EditorState }) => {
        return state.selection instanceof TextSelection && !state.selection.empty;
      }}
    >
      <div className="mardown3-context-menu">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBold}
          data-active-state={isBold ? "on" : "off"}
        >
          加粗
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleItalic}
          data-active-state={isItalic ? "on" : "off"}
        >
          斜体
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleStrike}
          data-active-state={isStrike ? "on" : "off"}
        >
          删除线
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={handleToggleNodeLock}
          disabled={!nodeLockState.available}
          tooltip={nodeLockState.locked ? "解锁节点" : "锁定节点"}
          data-active-state={nodeLockState.locked ? "on" : "off"}
        >
          {nodeLockState.locked ? "解锁" : "锁定"}
        </Button>
      </div>
    </BubbleMenu>
  );
}
