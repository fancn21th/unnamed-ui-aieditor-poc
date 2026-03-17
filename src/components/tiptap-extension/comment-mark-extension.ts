import { Mark } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commentMark: {
      /** 对当前选区应用评论 mark */
      setCommentMark: (commentId: string) => ReturnType;
      /** 移除文档中所有匹配该 commentId 的 mark */
      removeCommentMark: (commentId: string) => ReturnType;
    };
  }
}

export const CommentMark = Mark.create({
  name: "commentMark",

  // 允许跨节点（跨段落/标题）
  spanning: false,
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.commentId ? { "data-comment-id": attrs.commentId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ["span", { ...HTMLAttributes, class: "comment-mark" }, 0];
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },

      removeCommentMark:
        (commentId: string) =>
        ({ tr, dispatch, state }) => {
          if (dispatch) {
            const markType = state.schema.marks[this.name];
            if (!markType) return false;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;
              const found = node.marks.find(
                (m) =>
                  m.type === markType && m.attrs.commentId === commentId,
              );
              if (found) {
                tr.removeMark(pos, pos + node.nodeSize, found);
              }
            });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
