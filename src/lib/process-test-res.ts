/**
 * process-test-res.ts
 *
 * 将 test-res.json 处理为可供 Tiptap 编辑器直接 setContent 的 HTML 字符串。
 *
 * 数据特征：
 *  - 每个 key 格式："{数字前缀}.{中文标题}"，例如 "1.合并用药及合并处置"
 *  - 父级 key 的 value 已包含所有子节内容，子级 key 是对应片段的单独副本
 *  - 为避免重复渲染，只取「顶层 key」（数字前缀仅含一段，如 "1." "2."）
 *
 * 处理流程：
 *  1. 过滤出顶层章节 key
 *  2. 按数字前缀排序
 *  3. 将各章节 HTML 拼接，每个章节用语义化 <section> 包裹（携带 data-section-key）
 */

// Vite JSON 静态导入
import testResJson from "../../mockData/test-res.json"

type TestResData = typeof testResJson

/**
 * 从 key 中提取数字前缀数组。
 * "2.3.1.自觉症状" → [2, 3, 1]
 * "1.合并用药" → [1]
 */
function getNumericPrefix(key: string): number[] {
  const match = key.match(/^([\d.]+)/)
  if (!match) return [Infinity]
  return match[1]
    .replace(/\.$/, "")
    .split(".")
    .filter(Boolean)
    .map(Number)
}

/** 仅保留顶层章节（数字前缀长度为 1） */
function isTopLevel(key: string): boolean {
  return getNumericPrefix(key).length === 1
}

/** 按数字前缀字典序比较两个 key */
function compareKeys(a: string, b: string): number {
  const pa = getNumericPrefix(a)
  const pb = getNumericPrefix(b)
  const len = Math.min(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return pa.length - pb.length
}

/**
 * 构建用于初始化 Tiptap 编辑器的 HTML 字符串。
 * 所有章节 HTML 按序排列，每个章节用 <section data-section-key="..."> 包裹。
 *
 * @returns 拼接后的 HTML 字符串（不含文档级标签）
 */
export function buildLockedHtml(): string {
  const data = testResJson as TestResData

  const sortedTopLevelKeys = (Object.keys(data) as (keyof TestResData)[])
    .filter((key) => isTopLevel(key as string))
    .sort((a, b) => compareKeys(a as string, b as string))

  return sortedTopLevelKeys
    .map((key) => {
      const html = data[key] as string
      return `<section data-section-key="${key}">${html}</section>`
    })
    .join("\n")
}
