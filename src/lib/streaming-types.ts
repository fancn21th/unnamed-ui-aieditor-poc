export type NodeStatus = "start" | "updating" | "end";

export interface BufferMessage {
  nodeId: string;
  actualContent: string;
  completedContent: string;
  status: NodeStatus;
}

export interface MarkdownNodeBufferOptions {
  onMessage: (msg: BufferMessage) => void;
}
