/**
 * toc-utils.ts
 *
 * TOC (Table of Contents) 纯工具函数，与 React/DOM 无关，便于单元测试。
 */

/**
 * 归一化标题层级深度：使最小层级成为深度 1，后续层级相对递增。
 * 例：[h2, h3, h4] → [1, 2, 3]；[h3, h1] → [3, 1]
 *
 * @param items  包含 level 属性的列表（通常是 TableOfContentDataItem[]）
 * @param index  当前项的下标
 * @returns      该项的显示深度（≥ 1）
 */
export function getTocDepth(
  items: { level: number }[],
  index: number
): number {
  if (items.length === 0) return 1;
  const minLevel = Math.min(...items.map((i) => i.level));
  return items[index].level - minLevel + 1;
}

/**
 * 计算滚动容器需要滚动到的目标位置（px）。
 *
 * targetTop = containerScrollTop + (heading视口top - 容器视口top) - topOffset
 *
 * @param containerScrollTop  容器当前 scrollTop
 * @param domTop              目标标题元素相对于视口的 top（getBoundingClientRect().top）
 * @param containerTop        容器元素相对于视口的 top（getBoundingClientRect().top）
 * @param topOffset           顶部保留间距（px），避免被 toolbar 遮挡
 */
export function calcScrollTarget(
  containerScrollTop: number,
  domTop: number,
  containerTop: number,
  topOffset: number
): number {
  return containerScrollTop + (domTop - containerTop) - topOffset;
}
