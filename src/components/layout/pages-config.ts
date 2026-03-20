import type { PageId } from "@/hooks/use-page-route";

export interface PageConfig {
  id: PageId;
  label: string;
}

export const PAGES: PageConfig[] = [
  { id: "basic", label: "基础" },
  { id: "bubbleMenu", label: "气泡菜单" },
  { id: "toolbar", label: "工具栏" },
  { id: "streaming", label: "流式输出" },
  { id: "toc", label: "TOC" },
  { id: "comments", label: "评论" },
  { id: "pro", label: "PRO" },
];
