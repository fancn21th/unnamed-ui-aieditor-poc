import { describe, it, expect } from "vitest";
import { splitMarkdownNodes } from "../markdown-node-splitter";

// ─────────────────────────────────────────────
// A. Paragraph
// ─────────────────────────────────────────────
describe("Paragraph", () => {
  it("single complete paragraph", () => {
    const r = splitMarkdownNodes("hello world\n\n");
    expect(r.completeNodes).toEqual(["hello world"]);
    expect(r.remainder).toBe("");
  });

  it("incomplete paragraph (no trailing \\n\\n)", () => {
    const r = splitMarkdownNodes("hello world");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("hello world");
  });

  it("two complete paragraphs", () => {
    const r = splitMarkdownNodes("para1\n\npara2\n\n");
    expect(r.completeNodes).toEqual(["para1", "para2"]);
    expect(r.remainder).toBe("");
  });

  it("complete paragraph + incomplete paragraph", () => {
    const r = splitMarkdownNodes("para1\n\npara2");
    expect(r.completeNodes).toEqual(["para1"]);
    expect(r.remainder).toBe("para2");
  });

  it("empty input", () => {
    const r = splitMarkdownNodes("");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("");
  });

  it("only blank line", () => {
    const r = splitMarkdownNodes("\n\n");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("");
  });

  it("multi-line paragraph (soft break)", () => {
    const r = splitMarkdownNodes("line1\nline2\n\n");
    expect(r.completeNodes).toEqual(["line1\nline2"]);
    expect(r.remainder).toBe("");
  });
});

// ─────────────────────────────────────────────
// B. ATX Heading
// ─────────────────────────────────────────────
describe("ATX Heading", () => {
  it("H1", () => {
    const r = splitMarkdownNodes("# H1\n\n");
    expect(r.completeNodes).toEqual(["# H1"]);
    expect(r.remainder).toBe("");
  });

  it("H2 then H3", () => {
    const r = splitMarkdownNodes("## H2\n\n### H3\n\n");
    expect(r.completeNodes).toEqual(["## H2", "### H3"]);
    expect(r.remainder).toBe("");
  });

  it("heading followed by paragraph", () => {
    const r = splitMarkdownNodes("# Title\n\nparagraph");
    expect(r.completeNodes).toEqual(["# Title"]);
    expect(r.remainder).toBe("paragraph");
  });

  it("incomplete heading", () => {
    const r = splitMarkdownNodes("# Tit");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("# Tit");
  });
});

// ─────────────────────────────────────────────
// C. Setext Heading
// ─────────────────────────────────────────────
describe("Setext Heading", () => {
  it("= style heading", () => {
    const r = splitMarkdownNodes("Title\n===\n\n");
    expect(r.completeNodes).toEqual(["Title\n==="]);
    expect(r.remainder).toBe("");
  });

  it("- style heading", () => {
    const r = splitMarkdownNodes("Sub\n---\n\n");
    expect(r.completeNodes).toEqual(["Sub\n---"]);
    expect(r.remainder).toBe("");
  });

  it("incomplete - style heading (no trailing \\n\\n)", () => {
    const r = splitMarkdownNodes("Sub\n--");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("Sub\n--");
  });
});

// ─────────────────────────────────────────────
// D. Thematic Break
// ─────────────────────────────────────────────
describe("Thematic Break", () => {
  it("--- break", () => {
    const r = splitMarkdownNodes("---\n\n");
    expect(r.completeNodes).toEqual(["---"]);
    expect(r.remainder).toBe("");
  });

  it("*** break", () => {
    const r = splitMarkdownNodes("***\n\n");
    expect(r.completeNodes).toEqual(["***"]);
    expect(r.remainder).toBe("");
  });

  it("paragraph then break", () => {
    const r = splitMarkdownNodes("para\n\n---\n\n");
    expect(r.completeNodes).toEqual(["para", "---"]);
    expect(r.remainder).toBe("");
  });
});

// ─────────────────────────────────────────────
// E. Fenced Code Block
// ─────────────────────────────────────────────
describe("Fenced Code Block", () => {
  it("basic code block", () => {
    const r = splitMarkdownNodes("```\ncode\n```\n\n");
    expect(r.completeNodes).toEqual(["```\ncode\n```"]);
    expect(r.remainder).toBe("");
  });

  it("code block with language identifier", () => {
    const r = splitMarkdownNodes("```typescript\nconst x = 1\n```\n\n");
    expect(r.completeNodes).toEqual(["```typescript\nconst x = 1\n```"]);
    expect(r.remainder).toBe("");
  });

  it("code block containing a blank line — must NOT split", () => {
    const r = splitMarkdownNodes("```\nline1\n\nline2\n```\n\n");
    expect(r.completeNodes).toEqual(["```\nline1\n\nline2\n```"]);
    expect(r.remainder).toBe("");
  });

  it("code block with multiple internal blank lines", () => {
    const r = splitMarkdownNodes("```\na\n\nb\n\nc\n```\n\n");
    expect(r.completeNodes).toEqual(["```\na\n\nb\n\nc\n```"]);
    expect(r.remainder).toBe("");
  });

  it("unclosed fence stays in remainder", () => {
    const r = splitMarkdownNodes("```\ncode");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("```\ncode");
  });

  it("code block followed by paragraph", () => {
    const r = splitMarkdownNodes("```\ncode\n```\n\nparagraph");
    expect(r.completeNodes).toEqual(["```\ncode\n```"]);
    expect(r.remainder).toBe("paragraph");
  });
});

// ─────────────────────────────────────────────
// F. Indented Code Block
// ─────────────────────────────────────────────
describe("Indented Code Block", () => {
  it("4-space indent", () => {
    const r = splitMarkdownNodes("    code line\n\n");
    expect(r.completeNodes).toEqual(["    code line"]);
    expect(r.remainder).toBe("");
  });

  it("multi-line indented block", () => {
    const r = splitMarkdownNodes("    line1\n    line2\n\n");
    expect(r.completeNodes).toEqual(["    line1\n    line2"]);
    expect(r.remainder).toBe("");
  });
});

// ─────────────────────────────────────────────
// G. Blockquote
// ─────────────────────────────────────────────
describe("Blockquote", () => {
  it("single-line blockquote", () => {
    const r = splitMarkdownNodes("> quote\n\n");
    expect(r.completeNodes).toEqual(["> quote"]);
    expect(r.remainder).toBe("");
  });

  it("multi-line blockquote (continuation lines)", () => {
    const r = splitMarkdownNodes("> l1\n> l2\n\n");
    expect(r.completeNodes).toEqual(["> l1\n> l2"]);
    expect(r.remainder).toBe("");
  });

  it("multi-paragraph blockquote joined by > continuation", () => {
    const r = splitMarkdownNodes("> p1\n>\n> p2\n\n");
    expect(r.completeNodes).toEqual(["> p1\n>\n> p2"]);
    expect(r.remainder).toBe("");
  });

  it("nested blockquote", () => {
    const r = splitMarkdownNodes("> > inner\n\n");
    expect(r.completeNodes).toEqual(["> > inner"]);
    expect(r.remainder).toBe("");
  });

  it("incomplete blockquote (no trailing \\n\\n)", () => {
    const r = splitMarkdownNodes("> quote");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("> quote");
  });
});

// ─────────────────────────────────────────────
// H. Tight List
// ─────────────────────────────────────────────
describe("Tight List", () => {
  it("unordered list with - marker", () => {
    const r = splitMarkdownNodes("- a\n- b\n- c\n\n");
    expect(r.completeNodes).toEqual(["- a\n- b\n- c"]);
    expect(r.remainder).toBe("");
  });

  it("unordered list with * marker", () => {
    const r = splitMarkdownNodes("* a\n* b\n\n");
    expect(r.completeNodes).toEqual(["* a\n* b"]);
    expect(r.remainder).toBe("");
  });

  it("unordered list with + marker", () => {
    const r = splitMarkdownNodes("+ a\n+ b\n\n");
    expect(r.completeNodes).toEqual(["+ a\n+ b"]);
    expect(r.remainder).toBe("");
  });

  it("ordered list with . terminator", () => {
    const r = splitMarkdownNodes("1. a\n2. b\n3. c\n\n");
    expect(r.completeNodes).toEqual(["1. a\n2. b\n3. c"]);
    expect(r.remainder).toBe("");
  });

  it("ordered list with ) terminator", () => {
    const r = splitMarkdownNodes("1) a\n2) b\n\n");
    expect(r.completeNodes).toEqual(["1) a\n2) b"]);
    expect(r.remainder).toBe("");
  });

  it("task list", () => {
    const r = splitMarkdownNodes("- [ ] todo\n- [x] done\n\n");
    expect(r.completeNodes).toEqual(["- [ ] todo\n- [x] done"]);
    expect(r.remainder).toBe("");
  });

  it("nested list", () => {
    const r = splitMarkdownNodes("- item\n  - nested\n\n");
    expect(r.completeNodes).toEqual(["- item\n  - nested"]);
    expect(r.remainder).toBe("");
  });

  it("incomplete list (no trailing \\n\\n)", () => {
    const r = splitMarkdownNodes("- a\n- b");
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("- a\n- b");
  });
});

// ─────────────────────────────────────────────
// I. Loose List — documented known behaviour
// ─────────────────────────────────────────────
describe("Loose List (known boundary difference)", () => {
  it("two-item loose list splits into two single-item nodes", () => {
    // CommonMark treats this as ONE list, but our splitter uses \n\n as
    // a node boundary and therefore produces two nodes. This is intentional
    // and documented in STREAMING_PLAN.md §I (future improvement).
    const r = splitMarkdownNodes("- a\n\n- b\n\n");
    expect(r.completeNodes).toEqual(["- a", "- b"]);
    expect(r.remainder).toBe("");
  });

  it("three-item loose list splits into three single-item nodes", () => {
    const r = splitMarkdownNodes("- a\n\n- b\n\n- c\n\n");
    expect(r.completeNodes).toEqual(["- a", "- b", "- c"]);
    expect(r.remainder).toBe("");
  });
});

// ─────────────────────────────────────────────
// J. GFM Table
// ─────────────────────────────────────────────
describe("GFM Table", () => {
  it("basic table", () => {
    const input = "| A | B |\n|---|---|\n| 1 | 2 |\n\n";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual(["| A | B |\n|---|---|\n| 1 | 2 |"]);
    expect(r.remainder).toBe("");
  });

  it("table with alignment", () => {
    const input = "| L | C | R |\n|:--|:--:|--:|\n| a | b | c |\n\n";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual([
      "| L | C | R |\n|:--|:--:|--:|\n| a | b | c |",
    ]);
    expect(r.remainder).toBe("");
  });

  it("table followed by paragraph", () => {
    const input = "| A |\n|---|\n| 1 |\n\nparagraph";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual(["| A |\n|---|\n| 1 |"]);
    expect(r.remainder).toBe("paragraph");
  });

  it("incomplete table (no trailing \\n\\n)", () => {
    const input = "| A | B |\n|---|---";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual([]);
    expect(r.remainder).toBe("| A | B |\n|---|---");
  });
});

// ─────────────────────────────────────────────
// K. Mixed sequences
// ─────────────────────────────────────────────
describe("Mixed sequences", () => {
  it("H1 + paragraph + code block", () => {
    const input = "# T\n\npara\n\n```\ncode\n```\n\n";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual(["# T", "para", "```\ncode\n```"]);
    expect(r.remainder).toBe("");
  });

  it("heading + list + table", () => {
    const input =
      "# Heading\n\n- item1\n- item2\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual([
      "# Heading",
      "- item1\n- item2",
      "| A | B |\n|---|---|\n| 1 | 2 |",
    ]);
    expect(r.remainder).toBe("");
  });

  it("five nodes in a single push all land in completeNodes", () => {
    const input = "n1\n\nn2\n\nn3\n\nn4\n\nn5\n\n";
    const r = splitMarkdownNodes(input);
    expect(r.completeNodes).toEqual(["n1", "n2", "n3", "n4", "n5"]);
    expect(r.remainder).toBe("");
  });

  it("chinese paragraph", () => {
    const r = splitMarkdownNodes("你好世界\n\n");
    expect(r.completeNodes).toEqual(["你好世界"]);
    expect(r.remainder).toBe("");
  });
});
