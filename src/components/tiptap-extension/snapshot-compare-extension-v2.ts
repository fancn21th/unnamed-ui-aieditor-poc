import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";
import type { DiffRange } from "@/lib/snapshot-diff-v2";

const pluginKey = new PluginKey<DecorationSet>("snapshotCompareV2");

/**
 * 将 diff ranges 应用到编辑器，渲染为 Decoration：
 * - inserted       → inline Decoration（绿色背景）
 * - deleted        → widget Decoration（红色中划线文本）
 * - format-changed → inline Decoration（浅蓝色背景）
 */
export function applyDiff(editor: Editor, ranges: DiffRange[]): void {
  const { state, view } = editor;
  const decorations: Decoration[] = [];
  const docSize = state.doc.content.size;

  for (const range of ranges) {
    if (range.type === "inserted") {
      const from = Math.max(1, Math.min(range.from, docSize));
      const to   = Math.max(from, Math.min(range.to, docSize + 1));
      if (from < to) {
        decorations.push(Decoration.inline(from, to, { class: "diff-inserted" }));
      }
    } else if (range.type === "format-changed") {
      const from = Math.max(1, Math.min(range.from, docSize));
      const to   = Math.max(from, Math.min(range.to, docSize + 1));
      if (from < to) {
        decorations.push(Decoration.inline(from, to, { class: "diff-format-changed" }));
      }
    } else if (range.type === "deleted" && range.text) {
      const pos = Math.max(1, Math.min(range.from, docSize));
      decorations.push(Decoration.widget(pos, createDeletedWidget(range.text), { side: -1 }));
    }
  }

  const decoSet = DecorationSet.create(state.doc, decorations);
  view.dispatch(state.tr.setMeta(pluginKey, decoSet));
}

/** 清空所有 diff decorations */
export function clearDiff(editor: Editor): void {
  const { state, view } = editor;
  view.dispatch(state.tr.setMeta(pluginKey, DecorationSet.empty));
}

function createDeletedWidget(text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "diff-deleted";
  span.textContent = text;
  return span;
}

export const SnapshotCompareExtensionV2 = Extension.create({
  name: "snapshotCompareV2",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, decoSet) {
            const next = tr.getMeta(pluginKey) as DecorationSet | undefined;
            if (next !== undefined) return next;
            return decoSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
