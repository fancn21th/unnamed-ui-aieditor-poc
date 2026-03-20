"use client";

import { useCallback, useEffect, useRef } from "react";
import { posToDOMRect } from "@tiptap/core";
import type { Editor, EditorStateSnapshot } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { TextSelection, type EditorState } from "@tiptap/pm/state";
import { Button } from "@/components/tiptap-ui-primitive/button";

interface Markdown3BubbleMenuProps {
  editor: Editor;
  lockableNodeTypes: string[];
  onAddComment: () => void;
  scrollContainer?: HTMLElement | null;
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
  onAddComment,
  scrollContainer,
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

  const bubbleMenuRef = useRef<HTMLDivElement>(null);

  // 在 scroll 事件内同步直接更新菜单位置，消除 1 帧延迟，实现真正的丝滑跟随
  useEffect(() => {
    if (!scrollContainer) return;
    const onScroll = () => {
      const el = bubbleMenuRef.current;
      if (!el) return;

      const { state, view } = editor;
      const { selection } = state;
      if (selection.empty) return;

      const selRect = posToDOMRect(view, selection.from, selection.to);
      const elWidth = el.offsetWidth;
      const elHeight = el.offsetHeight;
      if (!elWidth || !elHeight) return;

      // 选中文字滚出视口时隐藏菜单
      if (selRect.bottom < 0 || selRect.top > window.innerHeight) {
        el.style.visibility = "hidden";
        return;
      }
      el.style.visibility = "visible";

      const gap = 8;
      let top = selRect.top - elHeight - gap;
      let left = selRect.left + selRect.width / 2 - elWidth / 2;

      // 上方空间不足时翻转到下方
      if (top < gap) top = selRect.bottom + gap;
      // 水平方向不超出视口
      left = Math.max(gap, Math.min(left, window.innerWidth - elWidth - gap));

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [scrollContainer, editor]);

  return (
    <BubbleMenu
      ref={bubbleMenuRef}
      editor={editor}
      options={{
        placement: "top",
        strategy: "fixed",
        hide: true,
      }}
      shouldShow={({ state }: { state: EditorState }) => {
        return state.selection instanceof TextSelection && !state.selection.empty;
      }}
    >
      <div className="mardown3-context-menu" >
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
          onClick={onAddComment}
        >
          评论
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
