import type { CSSProperties } from "react";
import type { TableOfContentDataItem } from "@tiptap/extension-table-of-contents";
import { getTocDepth, calcScrollTarget } from "@/lib/toc-utils";

interface TocSidebarProps {
  items: TableOfContentDataItem[];
  topOffset?: number;
}

export function TocSidebar({ items, topOffset = 80 }: TocSidebarProps) {
  const handleClick = (item: TableOfContentDataItem) => {
    if (!item.dom) return;

    const scrollContainer = item.dom.closest(
      ".mardown3-editor-center"
    ) as HTMLElement | null;

    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const domRect = item.dom.getBoundingClientRect();
      const targetTop = calcScrollTarget(
        scrollContainer.scrollTop,
        domRect.top,
        containerRect.top,
        topOffset
      );
      scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      item.dom.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
              const depth = getTocDepth(items, idx);
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
