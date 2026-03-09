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

  const processMessage = useCallback(
    (msg: BufferMessage) => {
      if (!editor) return;

      if (msg.status === "start") {
        // Record where this node begins, then insert the healed content.
        const insertPos = editor.state.doc.content.size;
        nodeStartPosRef.current = insertPos;
        editor.commands.insertContentAt(insertPos, msg.completedContent, {
          contentType: "markdown",
        });
      } else if (msg.status === "updating") {
        if (nodeStartPosRef.current === null) return;
        const from = nodeStartPosRef.current;
        const to = editor.state.doc.content.size;
        if (from < to) {
          editor.commands.insertContentAt({ from, to }, msg.completedContent, {
            contentType: "markdown",
          });
        }
      } else if (msg.status === "end") {
        if (nodeStartPosRef.current === null) return;
        const from = nodeStartPosRef.current;
        const to = editor.state.doc.content.size;
        if (from < to) {
          editor.commands.insertContentAt({ from, to }, msg.actualContent, {
            contentType: "markdown",
          });
        } else {
          // Edge case: node completed before any partial insert happened
          editor.commands.insertContentAt(from, msg.actualContent, {
            contentType: "markdown",
          });
        }
        nodeStartPosRef.current = null;
      }

      scrollToBottom();
    },
    [editor, scrollToBottom],
  );

  const reset = useCallback(() => {
    nodeStartPosRef.current = null;
    cancelAnimationFrame(rafRef.current);
  }, []);

  return { processMessage, reset };
}
