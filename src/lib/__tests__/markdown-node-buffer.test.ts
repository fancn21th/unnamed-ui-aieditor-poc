import { describe, it, expect } from "vitest";
import { MarkdownNodeBuffer } from "../markdown-node-buffer";
import remend from "remend";
import type { BufferMessage } from "../streaming-types";

function makeBuffer(msgs: BufferMessage[] = []) {
  return new MarkdownNodeBuffer({
    onMessage: (m) => msgs.push(m),
  });
}

// ─────────────────────────────────────────────
// A. State machine — message ordering
// ─────────────────────────────────────────────
describe("State machine — message ordering", () => {
  it("single paragraph: 5 chunks then \\n\\n produces start→updating×3→end", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("He");
    buf.push("llo");
    buf.push(" wo");
    buf.push("rld");
    buf.push("\n\n");

    const statuses = msgs.map((m) => m.status);
    expect(statuses[0]).toBe("start");
    expect(statuses.slice(1, -1).every((s) => s === "updating")).toBe(true);
    expect(statuses[statuses.length - 1]).toBe("end");
  });

  it("all messages for the same node share the same nodeId", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("para");
    buf.push(" text");
    buf.push("\n\n");

    const ids = new Set(msgs.map((m) => m.nodeId));
    expect(ids.size).toBe(1);
  });

  it("single push of a complete node emits start then end", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("para\n\n");

    expect(msgs[0].status).toBe("start");
    expect(msgs[1].status).toBe("end");
    expect(msgs[0].nodeId).toBe(msgs[1].nodeId);
  });

  it("two paragraphs produce two distinct nodeIds", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("p1\n\np2\n\n");

    const byNode = new Map<string, BufferMessage[]>();
    for (const m of msgs) {
      if (!byNode.has(m.nodeId)) byNode.set(m.nodeId, []);
      byNode.get(m.nodeId)!.push(m);
    }

    expect(byNode.size).toBe(2);
    for (const [, nodeMsgs] of byNode) {
      expect(nodeMsgs[0].status).toBe("start");
      expect(nodeMsgs[nodeMsgs.length - 1].status).toBe("end");
    }
  });

  it("single push containing 3 complete nodes emits 3 start+end pairs in order", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("a\n\nb\n\nc\n\n");

    const byNode = new Map<string, string[]>();
    for (const m of msgs) {
      if (!byNode.has(m.nodeId)) byNode.set(m.nodeId, []);
      byNode.get(m.nodeId)!.push(m.status);
    }

    expect(byNode.size).toBe(3);
    for (const [, statuses] of byNode) {
      expect(statuses).toEqual(["start", "end"]);
    }
  });

  it("second node starts after the first node ends", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("p1\n\n");
    buf.push("p2 partial");

    const n1Msgs = msgs.filter((m) => m.nodeId === msgs[0].nodeId);
    const n2Start = msgs.find(
      (m) => m.nodeId !== msgs[0].nodeId && m.status === "start",
    );

    expect(n1Msgs[n1Msgs.length - 1].status).toBe("end");
    expect(n2Start).toBeDefined();
    expect(n2Start!.actualContent).toBe("p2 partial");
  });
});

// ─────────────────────────────────────────────
// B. actualContent / completedContent correctness
// ─────────────────────────────────────────────
describe("actualContent and completedContent", () => {
  it("actualContent accumulates the raw chunks correctly", () => {
    const chunks = ["He", "ll", "o ", "wo", "rl", "d"];
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    let expected = "";
    for (const chunk of chunks) {
      expected += chunk;
      buf.push(chunk);
      const last = msgs[msgs.length - 1];
      expect(last.actualContent).toBe(expected);
    }
  });

  it("completedContent equals remend(actualContent)", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("**bold");
    const last = msgs[msgs.length - 1];
    expect(last.completedContent).toBe(remend(last.actualContent));
  });

  it("when syntax is complete, completedContent === actualContent", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("This is plain text.");
    const last = msgs[msgs.length - 1];
    expect(last.completedContent).toBe(last.actualContent);
  });

  it("end message actualContent is the original text, not remend-modified", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    // A complete bold statement arriving in parts
    buf.push("**bold**\n\n");
    const endMsg = msgs.find((m) => m.status === "end")!;
    expect(endMsg.actualContent).toBe("**bold**");
    // completedContent should also be the same since syntax is closed
    expect(endMsg.completedContent).toBe(endMsg.actualContent);
  });
});

// ─────────────────────────────────────────────
// C. remend inline syntax completion
// ─────────────────────────────────────────────
describe("remend inline syntax completion", () => {
  function getCompleted(text: string): string {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);
    buf.push(text);
    return msgs[msgs.length - 1].completedContent;
  }

  it("closes unclosed bold **", () => {
    expect(getCompleted("**bold")).toBe("**bold**");
  });

  it("closes unclosed italic *", () => {
    expect(getCompleted("*ital")).toBe("*ital*");
  });

  it("closes unclosed italic _", () => {
    expect(getCompleted("_ital")).toBe("_ital_");
  });

  it("closes unclosed bold+italic ***", () => {
    expect(getCompleted("***bi")).toBe("***bi***");
  });

  it("closes unclosed inline code backtick", () => {
    expect(getCompleted("`code")).toBe("`code`");
  });

  it("closes unclosed strikethrough ~~", () => {
    expect(getCompleted("~~str")).toBe("~~str~~");
  });

  it("does not alter syntactically complete bold", () => {
    expect(getCompleted("**bold**")).toBe("**bold**");
  });

  it("works with Chinese unicode characters", () => {
    expect(getCompleted("**中文")).toBe("**中文**");
  });

  it("partial link is handled by remend", () => {
    const result = getCompleted("[text](url");
    // remend transforms the incomplete link — exact form depends on linkMode
    expect(result).not.toBe("[text](url"); // must be modified
  });
});

// ─────────────────────────────────────────────
// D. done() behaviour
// ─────────────────────────────────────────────
describe("done()", () => {
  it("flushes an incomplete node as 'end'", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("partial content");
    buf.done();

    const last = msgs[msgs.length - 1];
    expect(last.status).toBe("end");
    expect(last.actualContent).toBe("partial content");
  });

  it("on empty buffer emits nothing", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);
    buf.done();
    expect(msgs).toHaveLength(0);
  });

  it("done() after \\n\\n does not emit a duplicate end", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("para\n\n");
    const countBefore = msgs.length;
    buf.done();
    expect(msgs.length).toBe(countBefore); // no new messages
  });

  it("push() after done() is silently ignored", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.done();
    buf.push("ignored");

    expect(msgs).toHaveLength(0);
  });

  it("calling done() twice does not double-emit", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("content");
    buf.done();
    const count = msgs.length;
    buf.done();
    expect(msgs.length).toBe(count);
  });
});

// ─────────────────────────────────────────────
// E. End-to-end for special block types
// ─────────────────────────────────────────────
describe("End-to-end block types", () => {
  function streamInChunks(text: string, chunkSize = 3): BufferMessage[] {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    for (let i = 0; i < text.length; i += chunkSize) {
      buf.push(text.slice(i, i + chunkSize));
    }
    buf.done();
    return msgs;
  }

  it("fenced code block with internal blank lines is one node", () => {
    const text = "```\nline1\n\nline2\n```\n\n";
    const msgs = streamInChunks(text);

    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(1);
    expect(endMsgs[0].actualContent).toBe("```\nline1\n\nline2\n```");
  });

  it("GFM table is a single node", () => {
    const text = "| A | B |\n|---|---|\n| 1 | 2 |\n\n";
    const msgs = streamInChunks(text, 5);

    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(1);
    expect(endMsgs[0].actualContent).toBe("| A | B |\n|---|---|\n| 1 | 2 |");
  });

  it("multi-line blockquote is a single node", () => {
    const text = "> l1\n> l2\n\n";
    const msgs = streamInChunks(text, 4);

    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(1);
    expect(endMsgs[0].actualContent).toBe("> l1\n> l2");
  });

  it("tight ordered list is a single node", () => {
    const text = "1. a\n2. b\n\n";
    const msgs = streamInChunks(text, 3);

    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(1);
    expect(endMsgs[0].actualContent).toBe("1. a\n2. b");
  });

  it("thematic break is a single node", () => {
    const msgs = streamInChunks("---\n\n", 2);
    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(1);
    expect(endMsgs[0].actualContent).toBe("---");
  });

  it("last node without trailing \\n\\n is flushed by done()", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("# Last heading");
    buf.done();

    expect(msgs[msgs.length - 1].status).toBe("end");
    expect(msgs[msgs.length - 1].actualContent).toBe("# Last heading");
  });
});

// ─────────────────────────────────────────────
// F. Edge cases
// ─────────────────────────────────────────────
describe("Edge cases", () => {
  it("empty chunk push emits nothing and leaves state unchanged", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("");
    expect(msgs).toHaveLength(0);
  });

  it("push of only \\n\\n emits nothing (no content)", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("\n\n");
    expect(msgs).toHaveLength(0);
  });

  it("full document in a single push produces all nodes in order", () => {
    const text = "# H1\n\nparagraph\n\n- a\n- b\n\n";
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);
    buf.push(text);

    const endMsgs = msgs.filter((m) => m.status === "end");
    expect(endMsgs).toHaveLength(3);
    expect(endMsgs[0].actualContent).toBe("# H1");
    expect(endMsgs[1].actualContent).toBe("paragraph");
    expect(endMsgs[2].actualContent).toBe("- a\n- b");
  });

  it("nodeIds are unique across many nodes", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    // 10 paragraphs
    for (let i = 0; i < 10; i++) {
      buf.push(`paragraph ${i}\n\n`);
    }

    const startMsgs = msgs.filter((m) => m.status === "start");
    const ids = startMsgs.map((m) => m.nodeId);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("chinese unicode content is accumulated correctly", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("你好");
    buf.push("世界");
    buf.done();

    const endMsg = msgs.find((m) => m.status === "end")!;
    expect(endMsg.actualContent).toBe("你好世界");
  });

  it("whitespace-only chunk does not emit messages", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("   ");
    buf.push("\n\n");
    // Whitespace-only remainder is not emitted. The splitter also
    // filters whitespace-only complete nodes. No messages at all.
    expect(msgs).toHaveLength(0);
  });

  it("whitespace-only remainder followed by real content emits correctly", () => {
    const msgs: BufferMessage[] = [];
    const buf = makeBuffer(msgs);

    buf.push("\n");
    expect(msgs).toHaveLength(0); // "\n" is whitespace-only, no emit

    buf.push("hello");
    expect(msgs.length).toBeGreaterThan(0);
    const last = msgs[msgs.length - 1];
    expect(last.actualContent).toBe("\nhello");
    expect(last.status).toBe("start");
  });
});
