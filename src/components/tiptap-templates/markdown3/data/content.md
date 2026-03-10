# Mardown3 Streaming Demo

这份内容会通过流式分片逐步写入编辑器。

## 基础能力

- 支持标题、段落、引用、代码块
- 支持有序/无序/任务列表
- 支持链接、图片、行内样式

> 这里的内容不是一次性 setContent，而是持续增量更新。

### 代码块

```ts
const mode = "streaming"
console.log("mardown3", mode)
```

### 任务清单

- [x] 工具栏能力合并
- [x] Markdown 流式输出合并
- [ ] 接入业务侧真实流

---

![placeholder-image](/images/tiptap-ui-placeholder-image.jpg)
