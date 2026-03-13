/**
 * snapshot-diff-v2.ts
 *
 * 技术链路（与 Tiptap 官方 snapshot-compare 同路线）：
 *   recreateTransform(baseDoc, headDoc)
 *     → 从两个任意 JSON 快照反推 ProseMirror Steps
 *     → complexSteps: true 捕获 AddMarkStep / RemoveMarkStep / AttrStep
 *
 *   逐步迭代 tr.steps：
 *     ReplaceStep      → content change  → "inserted" / "deleted"
 *     AddMarkStep      → 格式新增（加粗等）→ "format-changed"（浅蓝色）
 *     RemoveMarkStep   → 格式移除         → "format-changed"（浅蓝色）
 *     AttrStep         → 节点属性变更（H1→H2、对齐）→ "format-changed"（浅蓝色）
 *
 *   位置映射：tr.mapping.slice(i + 1) 把 step i 之后的坐标映射到 headDoc 坐标
 *   pre-step 文档：tr.docs[i]（step i 执行前的文档）
 */

import { recreateTransform } from "@fellow/prosemirror-recreate-transform";
import {
  ReplaceStep,
  AddMarkStep,
  RemoveMarkStep,
  AttrStep,
} from "@tiptap/pm/transform";
import type { Node as PMNode } from "@tiptap/pm/model";

export type DiffType = "inserted" | "deleted" | "format-changed";

export interface DiffRange {
  from: number;
  to: number;
  type: DiffType;
  /** 删除内容的文本（仅 deleted 类型，用于 WidgetDecoration 展示） */
  text?: string;
}

/** 从文档中提取 [from, to) 范围内的纯文本 */
function extractText(doc: PMNode, from: number, to: number): string {
  let text = "";
  doc.nodesBetween(from, to, (node) => {
    if (node.isText) text += node.text ?? "";
  });
  return text;
}

/**
 * 计算 baseDoc → headDoc 的结构化差异，返回相对于 headDoc 的 DiffRange 列表。
 *
 * 相比 v1（diffWords + buildCharPosMap）的改进：
 *   ✓ 感知格式变更（bold / italic / strike / highlight 等 mark）
 *   ✓ 感知节点属性变更（H1→H2、textAlign 等 attrs）
 *   ✓ 位置映射由 ProseMirror 原生 Mapping 保证，无手动偏移 bug
 */
export function computeDiff(baseDoc: PMNode, headDoc: PMNode): DiffRange[] {
  const tr = recreateTransform(baseDoc, headDoc, {
    complexSteps: true,  // 允许 AddMarkStep / RemoveMarkStep / AttrStep
    wordDiffs: false,    // 字符级 diff（更精细）
    simplifyDiff: true,  // 合并相邻步骤减少噪音
  });

  const ranges: DiffRange[] = [];
  const docSize = headDoc.content.size;

  tr.steps.forEach((step, i) => {
    // tr.docs[i] = step i 执行前的文档
    const preDoc = tr.docs[i];

    // tr.mapping.slice(i + 1) = 从"step i 执行后"到 headDoc 的位置映射
    const toHead = tr.mapping.slice(i + 1);

    // ── 内容变更（文字增删）────────────────────────────────────────────────
    if (step instanceof ReplaceStep) {
      // ① 被删除的内容：preDoc 中 [step.from, step.to)
      if (step.from < step.to) {
        const deletedText = extractText(preDoc, step.from, step.to);
        if (deletedText) {
          const widgetPos = clamp(toHead.map(step.from), 1, docSize);
          ranges.push({ from: widgetPos, to: widgetPos, type: "deleted", text: deletedText });
        }
      }

      // ② 新插入的内容：在"step i 执行后"的文档中，[step.from, step.from + slice.size)
      const insertedSize = step.slice.content.size;
      if (insertedSize > 0) {
        const fromInHead = clamp(toHead.map(step.from), 1, docSize);
        const toInHead   = clamp(toHead.map(step.from + insertedSize), fromInHead, docSize + 1);
        if (fromInHead < toInHead) {
          ranges.push({ from: fromInHead, to: toInHead, type: "inserted" });
        }
      }

    // ── 格式变更（Mark 新增/移除）─────────────────────────────────────────
    } else if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
      // step.from / step.to 是 preDoc 坐标
      const fromInHead = clamp(toHead.map(step.from), 1, docSize);
      const toInHead   = clamp(toHead.map(step.to), fromInHead, docSize + 1);
      if (fromInHead < toInHead) {
        ranges.push({ from: fromInHead, to: toInHead, type: "format-changed" });
      }

    // ── 节点属性变更（H1→H2、textAlign 等）──────────────────────────────
    } else if (step instanceof AttrStep) {
      // step.pos 是 preDoc 中节点的位置
      const node = preDoc.nodeAt(step.pos);
      if (node) {
        const contentFrom = step.pos + 1;
        const contentTo   = step.pos + 1 + node.content.size;
        const fromInHead  = clamp(toHead.map(contentFrom), 1, docSize);
        const toInHead    = clamp(toHead.map(contentTo), fromInHead, docSize + 1);
        if (fromInHead < toInHead) {
          ranges.push({ from: fromInHead, to: toInHead, type: "format-changed" });
        }
      }
    }
    // 其他 Step 类型（ReplaceAroundStep、AddNodeMarkStep 等）暂忽略
  });

  return ranges;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max));
}
