import { describe, it, expect } from "vitest";
import { createStreamSimulator } from "../stream-simulator";

async function collectChunks(
  text: string,
  options?: Parameters<typeof createStreamSimulator>[1],
): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of createStreamSimulator(text, options)) {
    chunks.push(chunk);
  }
  return chunks;
}

describe("createStreamSimulator", () => {
  it("reassembled chunks equal the original text", async () => {
    const text = "Hello, world!\nThis is a test.\n\nAnother paragraph.";
    const chunks = await collectChunks(text, {
      delayMs: 0,
      delayJitter: 0,
    });
    expect(chunks.join("")).toBe(text);
  });

  it("chunk sizes are within configured range", async () => {
    const text = "a".repeat(200);
    const chunks = await collectChunks(text, {
      minChunkSize: 5,
      maxChunkSize: 15,
      delayMs: 0,
      delayJitter: 0,
    });
    // all but possibly the last chunk should respect the max
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i].length).toBeGreaterThanOrEqual(5);
      expect(chunks[i].length).toBeLessThanOrEqual(15);
    }
    // last chunk can be smaller than minChunkSize (remainder)
    expect(chunks[chunks.length - 1].length).toBeGreaterThan(0);
  });

  it("produces a single chunk when text is shorter than minChunkSize", async () => {
    const text = "hi";
    const chunks = await collectChunks(text, {
      minChunkSize: 10,
      maxChunkSize: 20,
      delayMs: 0,
      delayJitter: 0,
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("hi");
  });

  it("yields no chunks for empty text", async () => {
    const chunks = await collectChunks("", { delayMs: 0, delayJitter: 0 });
    expect(chunks).toHaveLength(0);
  });

  it("handles unicode / multibyte text without losing bytes", async () => {
    const text = "你好，世界！\n这是一个测试。";
    const chunks = await collectChunks(text, {
      minChunkSize: 3,
      maxChunkSize: 7,
      delayMs: 0,
      delayJitter: 0,
    });
    expect(chunks.join("")).toBe(text);
  });
});
