import { useCallback, useEffect, useState } from "react";

export type PageId = "basic" | "bubbleMenu" | "toolbar" | "streaming" | "toc" | "comments" | "pro";

function getPageFromHash(): PageId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const valid: PageId[] = ["basic", "bubbleMenu", "toolbar", "streaming", "toc", "comments", "pro"];
  return valid.includes(hash as PageId) ? (hash as PageId) : "streaming";
}

export function usePageRoute() {
  const [currentPage, setCurrentPage] = useState<PageId>(getPageFromHash);

  useEffect(() => {
    const onHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigateTo = useCallback((id: PageId) => {
    window.location.hash = id;
  }, []);

  return { currentPage, navigateTo };
}
