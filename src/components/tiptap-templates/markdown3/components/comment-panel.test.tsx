/* @vitest-environment jsdom */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentPanel } from "./comment-panel";

const comments = [
  { id: "c1", content: "第一条评论", createdAt: 1700000000000 },
  { id: "c2", content: "第二条评论", createdAt: 1700000001000 },
];

function renderPanel(props: React.ComponentProps<typeof CommentPanel>) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<CommentPanel {...props} />);
  });

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("CommentPanel", () => {
  it("shows empty state for empty comments", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const view = renderPanel({
      comments: [],
      activeCommentId: null,
      onEdit,
      onDelete,
    });

    const empty = view.container.querySelector(".comment-panel-empty");
    const count = view.container.querySelector(".comment-panel-count");

    expect(empty?.textContent).toContain("选中文字后，在气泡菜单中点击「评论」");
    expect(count).toBeNull();
    view.unmount();
  });

  it("renders list and triggers edit/delete callbacks", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const view = renderPanel({
      comments,
      activeCommentId: null,
      onEdit,
      onDelete,
    });

    const count = view.container.querySelector(".comment-panel-count");
    const cards = view.container.querySelectorAll(".comment-card");
    const buttons = Array.from(view.container.querySelectorAll("button"));
    const editButtons = buttons.filter((button) => button.textContent?.includes("编辑"));
    const deleteButtons = buttons.filter((button) => button.textContent?.includes("删除"));

    expect(count?.textContent).toBe("2");
    expect(cards).toHaveLength(2);

    act(() => {
      editButtons[1].click();
      deleteButtons[0].click();
    });

    expect(onEdit).toHaveBeenCalledWith("c2");
    expect(onDelete).toHaveBeenCalledWith("c1");
    view.unmount();
  });

  it("marks active card and scrolls it into view", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const scrollIntoView = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => {});

    const view = renderPanel({
      comments,
      activeCommentId: "c2",
      onEdit,
      onDelete,
    });

    const activeCard = view.container.querySelector(".comment-card--active");
    expect(activeCard).not.toBeNull();
    expect(activeCard?.textContent).toContain("第二条评论");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
