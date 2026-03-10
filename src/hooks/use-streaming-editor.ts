import { useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import type { BufferMessage } from "@/lib/streaming-types";

/**
 * Layer 3: Tiptap incremental editor updater.
 *
 * Consumes BufferMessage objects from Layer 2 and applies them to the
 * Tiptap editor using insertContentAt with contentType:'markdown':
 *
 *  start    → insert completedContent at the current doc end; remember
 *              the start position for future replacements
 *  updating → replace [nodeStartPos, docEnd] with new completedContent
 *  end      → replace [nodeStartPos, docEnd] with final actualContent
 */
export function useStreamingEditor(editor: Editor | null) {
  // Start position of the currently in-progress node in the ProseMirror doc.
  const nodeStartPosRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const insertOptions = {
    contentType: "markdown" as const,
    updateSelection: false,
  };

  /** Scroll the last rendered element into view after the DOM updates. */
  const scrollToBottom = useCallback(() => {
    if (!editor) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      editor.view.dom.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [editor]);

  const clearNativeSelection = useCallback(() => {
    if (!editor) return;
    if (editor.isFocused) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    selection.removeAllRanges();
  }, [editor]);

  const processMessage = useCallback(
    (msg: BufferMessage) => {
      if (!editor) return;

      // Guard: whitespace-only content produces empty ProseMirror fragments
      // which throw "Invalid content for node doc".
      const content =
        msg.status === "end" ? msg.actualContent : msg.completedContent;
      if (!content.trim()) return;

      try {
        if (msg.status === "start") {
          // Record where this node begins, then insert the healed content.
          const insertPos = editor.state.doc.content.size;
          nodeStartPosRef.current = insertPos;
          editor.commands.insertContentAt(
            insertPos,
            msg.completedContent,
            insertOptions,
          );
        } else if (msg.status === "updating") {
          if (nodeStartPosRef.current === null) return;
          const from = nodeStartPosRef.current;
          const to = editor.state.doc.content.size;
          if (from < to) {
            editor.commands.insertContentAt(
              { from, to },
              msg.completedContent,
              insertOptions,
            );
          }
        } else if (msg.status === "end") {
          if (nodeStartPosRef.current === null) return;
          const from = nodeStartPosRef.current;
          const to = editor.state.doc.content.size;
          if (from < to) {
            editor.commands.insertContentAt(
              { from, to },
              msg.actualContent,
              insertOptions,
            );
          } else {
            // Edge case: node completed before any partial insert happened
            editor.commands.insertContentAt(from, msg.actualContent, insertOptions);
          }
          nodeStartPosRef.current = null;
        }
      } catch {
        // During streaming, partial markdown (e.g. "> " without body text)
        // can produce nodes that violate ProseMirror's schema (e.g. an empty
        // blockquote).  These transient errors are harmless — the next chunk
        // will supply valid content — so we silently skip the update.
        return;
      }

      clearNativeSelection();
      scrollToBottom();
    },
    [editor, scrollToBottom, clearNativeSelection],
  );

  const reset = useCallback(() => {
    nodeStartPosRef.current = null;
    cancelAnimationFrame(rafRef.current);
  }, []);

  return { processMessage, reset };
}
