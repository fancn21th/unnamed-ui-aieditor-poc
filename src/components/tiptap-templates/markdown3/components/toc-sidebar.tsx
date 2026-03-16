import type { CSSProperties } from "react";
import type { TableOfContentDataItem } from "@tiptap/extension-table-of-contents";

interface TocSidebarProps {
  items: TableOfContentDataItem[];
  topOffset?: number;
}

export function TocSidebar({ items, topOffset = 80 }: TocSidebarProps) {
  const handleClick = (item: TableOfContentDataItem) => {
    if (!item.dom) return;

    // 找到实际的滚动容器（而非 window）
    const scrollContainer = item.dom.closest(
      ".mardown3-editor-body"
    ) as HTMLElement | null;

    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const domRect = item.dom.getBoundingClientRect();
      const targetTop =
        scrollContainer.scrollTop +
        (domRect.top - containerRect.top) -
        topOffset;
      scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      // 降级：直接用 scrollIntoView
      item.dom.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 计算层级缩进深度（归一化，使最小层级为 1）
  const getLevelDepth = (items: TableOfContentDataItem[], index: number) => {
    if (items.length === 0) return 1;
    const minLevel = Math.min(...items.map((i) => i.level));
    return items[index].level - minLevel + 1;
  };

  return (
    <aside className="toc-sidebar">
      <div className="toc-sidebar-inner">
        <p className="toc-sidebar-title">目录</p>
        {items.length === 0 ? (
          <p className="toc-sidebar-empty">文档暂无标题</p>
        ) : (
          <nav className="toc-sidebar-nav">
            {items.map((item, idx) => {
              const depth = getLevelDepth(items, idx);
              return (
                <button
                  key={item.id}
                  className={[
                    "toc-sidebar-item",
                    item.isActive ? "toc-sidebar-item--active" : "",
                    item.isScrolledOver ? "toc-sidebar-item--scrolled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    { "--toc-depth": depth } as CSSProperties
                  }
                  onClick={() => handleClick(item)}
                  title={item.textContent}
                >
                  <span className="toc-sidebar-item-text">
                    {item.textContent}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}
