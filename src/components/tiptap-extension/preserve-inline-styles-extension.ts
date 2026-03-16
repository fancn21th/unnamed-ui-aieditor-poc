import { Extension } from "@tiptap/core"

export interface PreserveInlineStylesOptions {
  /**
   * 需要保留 style 属性的节点类型列表。
   * 新增扩展节点时只需往这个数组追加节点名称即可。
   */
  types: string[]
}

/**
 * PreserveInlineStyles
 *
 * 通过 addGlobalAttributes 一次性给所有指定节点类型挂载 `style` 属性，
 * parseHTML 时原封不动读取内联 style 字符串，renderHTML 时原封不动写回。
 *
 * 为什么用 Global Attribute 而不是逐个 .extend()：
 * - 一个扩展覆盖 N 种节点，后续增加节点只改 types 数组
 * - 与 node-background-extension 同等模式，项目内已有先例
 * - 不侵入任何已有扩展代码
 *
 * 局限：
 * - 仅作用于 block 节点（paragraph、table、td 等），
 *   inline mark（bold/italic）本身不走此路径
 * - span 的内联样式需要自定义 Mark 扩展（见下方注释）
 */
export const PreserveInlineStyles = Extension.create<PreserveInlineStylesOptions>({
  name: "preserveInlineStyles",

  addOptions() {
    return {
      types: [
        // 基础块节点
        "paragraph",
        "heading",
        "blockquote",
        "bulletList",
        "orderedList",
        "listItem",
        "taskList",
        "taskItem",
        "codeBlock",
        // 表格系列 —— test.html 中 border/width/padding 丢失的核心原因
        "table",
        "tableRow",
        "tableCell",
        "tableHeader",
      ],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          style: {
            default: null as string | null,

            // 从 DOM Element 读取 style 属性原始字符串
            parseHTML: (element: HTMLElement) => {
              return element.getAttribute("style") || null
            },

            // 写回 DOM 时原样输出
            renderHTML: (attributes) => {
              if (!attributes.style) return {}
              return { style: attributes.style as string }
            },
          },
        },
      },
    ]
  },
})

// ─── 关于 <span> 内联样式的扩展方式说明 ──────────────────────────────────────
//
// <span style="font-family:宋体; font-size:12pt"> 属于 inline 节点，
// 需要通过自定义 Mark 来保留，示例：
//
// import { Mark } from "@tiptap/core"
//
// export const InlineStyle = Mark.create({
//   name: "inlineStyle",
//   addAttributes() {
//     return {
//       style: {
//         default: null,
//         parseHTML: (el) => el.getAttribute("style") || null,
//         renderHTML: (attrs) => attrs.style ? { style: attrs.style } : {},
//       },
//     }
//   },
//   parseHTML() {
//     return [{ tag: "span[style]" }]
//   },
//   renderHTML({ HTMLAttributes }) {
//     return ["span", HTMLAttributes, 0]
//   },
// })
//
// 然后在 editor extensions 中加入 InlineStyle 即可保留所有 span 内联样式。
// ──────────────────────────────────────────────────────────────────────────────
