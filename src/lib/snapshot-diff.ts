import { diffWords } from "diff";
import type { Node as PMNode } from "@tiptap/pm/model";

export type DiffType = "inserted" | "deleted";

export interface DiffRange {
  from: number;
  to: number;
  type: DiffType;
  /** 删除内容的文本（用于 WidgetDecoration 展示） */
  text?: string;
}

interface BlockInfo {
  text: string;
  /** 块节点在文档中的起始 pos（含 open token，即 node pos 本身） */
  nodePos: number;
  /** 块节点内容区域的起始 pos（nodePos + 1） */
  contentFrom: number;
  node: PMNode;
}

/**
 * 递归收集文档中所有叶子 textblock（paragraph、heading、code_block 等）。
 * 不将整个 list/blockquote 当作一个 block，避免跨 listItem 文本拼接导致 diff 串位。
 */
function extractBlocks(doc: PMNode): BlockInfo[] {
  const blocks: BlockInfo[] = [];

  function walk(node: PMNode, pos: number) {
    if (node.isTextblock) {
      // 叶子文本块：paragraph、heading、code_block 等
      blocks.push({
        text: nodeText(node),
        nodePos: pos,
        contentFrom: pos + 1,
        node,
      });
      return;
    }
    // 容器节点（orderedList、bulletList、listItem、blockquote 等）：继续递归
    node.forEach((child, offset) => {
      walk(child, pos + offset + 1);
    });
  }

  // doc 自身不算 textblock，遍历其直接子节点
  doc.forEach((node, offset) => {
    walk(node, offset);
  });

  return blocks;
}

/** 递归提取节点内的纯文本 */
function nodeText(node: PMNode): string {
  if (node.isText) return node.text ?? "";
  let result = "";
  node.forEach((child) => {
    result += nodeText(child);
  });
  return result;
}

/**
 * 为某个块节点构建 charIndex → docAbsPos 映射表。
 * 返回长度为 text.length+1 的数组，charPosMap[i] = 文档中第 i 个字符对应的绝对 pos。
 *
 * 遍历规则：
 *  - text 节点没有 open token，字符位置就是父节点内容区域起始 + forEach offset
 *  - 非 text 节点有 open token，其内容区域起始 = 自身位置 + 1
 */
function buildCharPosMap(blockNode: PMNode, blockContentStart: number): number[] {
  const map: number[] = [];

  // contentStart：当前节点「内容区域」的起始位置
  function walkContent(node: PMNode, contentStart: number) {
    node.forEach((child, offset) => {
      const childPos = contentStart + offset;
      if (child.isText) {
        // text 节点无 open token，字符从 childPos 开始
        const text = child.text ?? "";
        for (let i = 0; i < text.length; i++) {
          map.push(childPos + i);
        }
      } else {
        // 非 text 节点有 open token，内容区域从 childPos + 1 开始
        walkContent(child, childPos + 1);
      }
    });
  }

  walkContent(blockNode, blockContentStart);
  // 末尾哨兵（代表块结束位置）
  map.push(blockContentStart + blockNode.content.size);
  return map;
}

/**
 * 计算 baseDoc 和 headDoc 的差异，返回相对于 **headDoc** 的 DiffRange 列表。
 *
 * - inserted：在 headDoc 中新增的区间（绿色背景）
 * - deleted：在 headDoc 中消失的文本（红色中划线 Widget，插入在 headDoc 的对应位置）
 */
export function computeDiff(baseDoc: PMNode, headDoc: PMNode): DiffRange[] {
  const baseBlocks = extractBlocks(baseDoc);
  const headBlocks = extractBlocks(headDoc);
  const ranges: DiffRange[] = [];

  const minLen = Math.min(baseBlocks.length, headBlocks.length);

  // 1. 对逐一对应的块做 word-level diff
  for (let i = 0; i < minLen; i++) {
    const base = baseBlocks[i];
    const head = headBlocks[i];

    if (base.text === head.text) continue; // 完全相同，跳过

    const charPosMap = buildCharPosMap(head.node, head.contentFrom);
    let charIdx = 0;

    const changes = diffWords(base.text, head.text);

    for (const change of changes) {
      const len = change.value.length;

      if (change.added) {
        // head 中有，base 中没有 → inserted
        const from = charPosMap[charIdx] ?? head.contentFrom;
        const to = charPosMap[Math.min(charIdx + len, charPosMap.length - 1)] ?? from + len;
        ranges.push({ from, to, type: "inserted" });
        charIdx += len;
      } else if (change.removed) {
        // base 中有，head 中没有 → deleted，作为 widget 插在 head 当前位置
        const insertPos = charPosMap[charIdx] ?? head.contentFrom;
        ranges.push({ from: insertPos, to: insertPos, type: "deleted", text: change.value });
        // charIdx 不前进（deleted 不消耗 head 字符）
      } else {
        // 相同段
        charIdx += len;
      }
    }
  }

  // 2. baseDoc 多出的块（head 中不存在）→ deleted widget 插在 headDoc 末尾
  for (let i = minLen; i < baseBlocks.length; i++) {
    const base = baseBlocks[i];
    const endPos = headDoc.content.size + 1; // 文档末尾
    ranges.push({ from: endPos, to: endPos, type: "deleted", text: base.text });
  }

  // 3. headDoc 多出的块（base 中不存在）→ 整块标记为 inserted
  for (let i = minLen; i < headBlocks.length; i++) {
    const head = headBlocks[i];
    ranges.push({
      from: head.contentFrom,
      to: head.contentFrom + head.node.content.size,
      type: "inserted",
    });
  }

  return ranges;
}
