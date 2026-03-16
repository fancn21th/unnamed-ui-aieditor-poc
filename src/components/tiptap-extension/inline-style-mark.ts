import { Mark } from "@tiptap/core"

/**
 * InlineStyle Mark
 *
 * 保留 <span style="..."> 的内联样式（font-family、font-size 等）。
 * PreserveInlineStyles 只覆盖 block 节点，此 Mark 补充 inline 层。
 *
 * 使用场景：Word / Aspose 导出 HTML 中大量
 *   <span style="font-family:宋体; font-size:12pt">...</span>
 * 需要在 Tiptap 中原样保留并渲染。
 */
export const InlineStyle = Mark.create({
  name: "inlineStyle",

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("style") || null,
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.style ? { style: attrs.style } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: "span[style]" }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ["span", HTMLAttributes, 0]
  },
})
