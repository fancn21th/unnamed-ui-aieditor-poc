export interface SplitResult {
  /** Complete block nodes, each ready to send to Layer 3. */
  completeNodes: string[];
  /** Partial content not yet terminated by a blank line. */
  remainder: string;
}

/**
 * Splits accumulated markdown text into complete block nodes.
 *
 * Strategy: scan the raw string for the two-character sequence `\n\n`
 * (blank line = CommonMark block separator). Any `\n\n` inside a fenced
 * code block (``` ... ```) is ignored.
 *
 * This avoids the false-positive that arises when you split by `\n` and
 * see the trailing empty string from a single `\n` at end-of-line.
 *
 * Known limitation: loose lists have `\n\n` between items. Each item
 * is emitted as a separate node. This is documented in STREAMING_PLAN.md §I.
 */
export function splitMarkdownNodes(text: string): SplitResult {
  const completeNodes: string[] = [];
  let inFence = false;
  let nodeStart = 0;
  let i = 0;

  while (i < text.length) {
    // At the start of every line, check for a code fence delimiter (` ``` `).
    // CommonMark allows 0–3 spaces of indentation before the backticks.
    if (i === 0 || text[i - 1] === "\n") {
      let j = i;
      // Skip up to 3 leading spaces
      while (j < i + 3 && j < text.length && text[j] === " ") j++;
      if (
        text[j] === "`" &&
        text[j + 1] === "`" &&
        text[j + 2] === "`"
      ) {
        inFence = !inFence;
      }
    }

    // Detect the blank-line boundary (\n\n) only when outside a fence.
    if (
      !inFence &&
      text[i] === "\n" &&
      i + 1 < text.length &&
      text[i + 1] === "\n"
    ) {
      const nodeContent = text.slice(nodeStart, i);
      if (nodeContent.trim() !== "") {
        completeNodes.push(nodeContent);
      }
      i += 2; // consume both newline characters
      nodeStart = i;
      continue;
    }

    i++;
  }

  return {
    completeNodes,
    remainder: text.slice(nodeStart),
  };
}
