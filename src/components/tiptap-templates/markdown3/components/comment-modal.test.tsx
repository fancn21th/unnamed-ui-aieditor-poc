/* @vitest-environment jsdom */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentModal } from "./comment-modal";

function renderModal(props: React.ComponentProps<typeof CommentModal>) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<CommentModal {...props} />);
  });

  return {
    container,
    rerender(nextProps: React.ComponentProps<typeof CommentModal>) {
      act(() => {
        root.render(<CommentModal {...nextProps} />);
      });
    },
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

describe("CommentModal", () => {
  it("returns null when open is false", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const view = renderModal({
      open: false,
      onConfirm,
      onClose,
    });

    expect(view.container.querySelector(".comment-modal")).toBeNull();
    view.unmount();
  });

  it("renders edit state and initial content when open", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const view = renderModal({
      open: true,
      initialContent: "已有评论",
      onConfirm,
      onClose,
    });

    const title = view.container.querySelector(".comment-modal-title");
    const textarea = view.container.querySelector(
      ".comment-modal-textarea",
    ) as HTMLTextAreaElement | null;

    expect(title?.textContent).toBe("编辑评论");
    expect(textarea?.value).toBe("已有评论");
    view.unmount();
  });

  it("disables confirm for blank text and confirms with trimmed content", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const view = renderModal({
      open: true,
      onConfirm,
      onClose,
    });

    const textarea = view.container.querySelector(
      ".comment-modal-textarea",
    ) as HTMLTextAreaElement;
    const confirmButton = Array.from(view.container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("确定")) as HTMLButtonElement;

    expect(confirmButton.disabled).toBe(true);

    act(() => {
      textarea.value = "  新评论  ";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(confirmButton.disabled).toBe(false);

    act(() => {
      confirmButton.click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("新评论");
    expect(textarea.value).toBe("");
    view.unmount();
  });

  it("handles keyboard shortcuts: Escape closes, Ctrl+Enter confirms", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const view = renderModal({
      open: true,
      onConfirm,
      onClose,
    });

    const textarea = view.container.querySelector(
      ".comment-modal-textarea",
    ) as HTMLTextAreaElement;

    act(() => {
      textarea.value = "快捷键提交";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Enter",
          ctrlKey: true,
        }),
      );
    });

    expect(onConfirm).toHaveBeenCalledWith("快捷键提交");

    act(() => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "Escape",
        }),
      );
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("calls onClose when clicking overlay", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const view = renderModal({
      open: true,
      onConfirm,
      onClose,
    });

    const overlay = view.container.querySelector(".comment-modal-overlay") as HTMLDivElement;
    act(() => {
      overlay.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
