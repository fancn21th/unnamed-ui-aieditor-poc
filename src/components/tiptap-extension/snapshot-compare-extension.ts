import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";
import type { DiffRange } from "@/lib/snapshot-diff";

const pluginKey = new PluginKey<DecorationSet>("snapshotCompare");

/**
 * 将 diff ranges 应用到编辑器，渲染为 Decoration：
 * - inserted → inline Decoration（绿色背景）
 * - deleted  → widget Decoration（红色中划线文本）
 */
export function applyDiff(editor: Editor, ranges: DiffRange[]): void {
  const { state, view } = editor;
  const decorations: Decoration[] = [];
  const docSize = state.doc.content.size;

  for (const range of ranges) {
    if (range.type === "inserted") {
      const from = Math.max(1, Math.min(range.from, docSize));
      const to = Math.max(from, Math.min(range.to, docSize + 1));
      if (from < to) {
        decorations.push(
          Decoration.inline(from, to, { class: "diff-inserted" })
        );
      }
    } else if (range.type === "deleted" && range.text) {
      const pos = Math.max(1, Math.min(range.from, docSize));
      const widget = createDeletedWidget(range.text);
      decorations.push(Decoration.widget(pos, widget, { side: -1 }));
    }
  }

  const decoSet = DecorationSet.create(state.doc, decorations);

  // 通过 plugin meta 更新 decoration set
  const tr = state.tr.setMeta(pluginKey, decoSet);
  view.dispatch(tr);
}

/** 清空所有 diff decorations */
export function clearDiff(editor: Editor): void {
  const { state, view } = editor;
  const tr = state.tr.setMeta(pluginKey, DecorationSet.empty);
  view.dispatch(tr);
}

/** 创建删除文本的 widget DOM 元素 */
function createDeletedWidget(text: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "diff-deleted";
  span.textContent = text;
  return span;
}

/** Tiptap Extension：注册 ProseMirror Plugin 用于维护 DecorationSet */
export const SnapshotCompareExtension = Extension.create({
  name: "snapshotCompare",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decoSet) {
            // 如果 transaction 携带新的 decoSet，直接替换
            const next = tr.getMeta(pluginKey) as DecorationSet | undefined;
            if (next !== undefined) return next;
            // 否则根据文档变化映射 decoration 位置
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
