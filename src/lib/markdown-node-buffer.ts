import remend from "remend";
import { splitMarkdownNodes } from "./markdown-node-splitter";
import type {
  BufferMessage,
  MarkdownNodeBufferOptions,
} from "./streaming-types";

/**
 * Layer 2 Buffer.
 *
 * Receives raw text chunks from Layer 1, accumulates them into markdown
 * block nodes (using blank-line boundaries), applies remend to heal
 * incomplete inline syntax, and emits BufferMessage objects to Layer 3
 * via the provided `onMessage` callback.
 *
 * State invariant: if `accumulated` is non-empty then `currentNodeId`
 * is always set (non-null).
 */
export class MarkdownNodeBuffer {
  private accumulated: string = "";
  private currentNodeId: string | null = null;
  private nodeCounter: number = 0;
  private isDone: boolean = false;
  private readonly onMessage: (msg: BufferMessage) => void;

  constructor(options: MarkdownNodeBufferOptions) {
    this.onMessage = options.onMessage;
  }

  /** Feed the next chunk from the stream. */
  push(chunk: string): void {
    if (this.isDone) return;
    if (chunk === "") return;

    this.accumulated += chunk;

    const { completeNodes, remainder } = splitMarkdownNodes(this.accumulated);

    // ── Process complete nodes ──────────────────────────────────────────
    for (const nodeContent of completeNodes) {
      if (this.currentNodeId !== null) {
        // The node we were tracking has now completed.
        this.emit({
          nodeId: this.currentNodeId,
          actualContent: nodeContent,
          completedContent: remend(nodeContent),
          status: "end",
        });
        this.currentNodeId = null;
      } else {
        // A whole node arrived without any prior partial emission.
        // Emit start followed immediately by end.
        const nodeId = this.generateNodeId();
        this.emit({
          nodeId,
          actualContent: nodeContent,
          completedContent: remend(nodeContent),
          status: "start",
        });
        this.emit({
          nodeId,
          actualContent: nodeContent,
          completedContent: remend(nodeContent),
          status: "end",
        });
      }
    }

    // ── Process remainder (current partial node) ───────────────────────
    this.accumulated = remainder;

    if (remainder !== "") {
      if (this.currentNodeId === null) {
        this.currentNodeId = this.generateNodeId();
        this.emit({
          nodeId: this.currentNodeId,
          actualContent: remainder,
          completedContent: remend(remainder),
          status: "start",
        });
      } else {
        this.emit({
          nodeId: this.currentNodeId,
          actualContent: remainder,
          completedContent: remend(remainder),
          status: "updating",
        });
      }
    }
  }

  /**
   * Signal that the stream is complete.
   * Flushes any partially accumulated node as a final 'end' message.
   */
  done(): void {
    if (this.isDone) return;
    this.isDone = true;

    // Invariant: accumulated !== '' ⟹ currentNodeId !== null
    if (this.accumulated !== "" && this.currentNodeId !== null) {
      this.emit({
        nodeId: this.currentNodeId,
        actualContent: this.accumulated,
        completedContent: remend(this.accumulated),
        status: "end",
      });
    }

    this.accumulated = "";
    this.currentNodeId = null;
  }

  private emit(msg: BufferMessage): void {
    this.onMessage(msg);
  }

  private generateNodeId(): string {
    return String(++this.nodeCounter);
  }
}
