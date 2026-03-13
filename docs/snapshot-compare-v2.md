# Snapshot Compare V2 — 技术文档

> 实现目录：`src/components/tiptap-templates/markdown-snapshot-local-v2/`

---

## 1. 整体架构

```
用户操作
  │
  ├─ "Save Version" ──→ saveSnapshot(editor.getJSON())
  │                         → localStorage["md_snapshots_v1"]
  │
  └─ 点击历史版本 ──→ handleCompare(id)
                         ├─ 从 localStorage 取出 headSnapshot / baseSnapshot
                         ├─ editor.commands.setContent(headSnapshot.docJSON)
                         ├─ PMNode.fromJSON(schema, headDocJSON)  ← headDoc
                         ├─ PMNode.fromJSON(schema, baseDocJSON)  ← baseDoc
                         ├─ computeDiff(baseDoc, headDoc)         ← 核心 diff
                         └─ applyDiff(editor, ranges)             ← Decoration 渲染
```

技术链路与 **Tiptap 官方 snapshot-compare** 同路线，区别在于存储层：官方使用云端 Hocuspocus，本方案使用 **localStorage**。

---

## 2. 存储层：快照数据格式

### 存储键

```
localStorage key: "md_snapshots_v1"
```

### 数据结构

```typescript
// 单条快照
interface SnapshotEntry {
  id: string;          // "snap_<timestamp>"，e.g. "snap_1741234567890"
  name: string;        // "Version 1"、"Version 2"...，可自定义
  timestamp: number;   // Date.now() 毫秒时间戳
  docJSON: JSONContent; // Tiptap editor.getJSON() 返回的 ProseMirror 文档 JSON
}

// localStorage 存储的是 SnapshotEntry[] 的 JSON 序列化，数组头部为最新版本
// e.g. [最新版本, 次新版本, ..., 最旧版本]
```

### docJSON 示例（ProseMirror JSON）

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1, "textAlign": null },
      "content": [{ "type": "text", "text": "Hello World" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Bold text", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " and normal text." }
      ]
    }
  ]
}
```

### CRUD 操作

| 函数 | 说明 |
|---|---|
| `saveSnapshot(docJSON, name?)` | 头插新快照，版本号自增 |
| `getSnapshots()` | 读取全部，最新在前 |
| `deleteSnapshot(id)` | 按 id 删除 |
| `clearSnapshots()` | 清空 localStorage |

---

## 3. Diff 核心算法

### 3.1 依赖

| 包 | 版本 | 作用 |
|---|---|---|
| `@fellow/prosemirror-recreate-transform` | 1.2.3 | 从两个任意 ProseMirror 文档反推 Steps |
| `@tiptap/pm/transform` | （@tiptap/pm 内置） | ReplaceStep / AddMarkStep / RemoveMarkStep / AttrStep |

### 3.2 核心函数签名

```typescript
computeDiff(baseDoc: PMNode, headDoc: PMNode): DiffRange[]

interface DiffRange {
  from: number;   // headDoc 中的起始绝对位置
  to: number;     // headDoc 中的结束绝对位置
  type: "inserted" | "deleted" | "format-changed";
  text?: string;  // 仅 deleted 类型，记录被删除的原始文本
}
```

### 3.3 工作流程

```
baseDoc ──→ recreateTransform(baseDoc, headDoc, options)
                │
                └─ 返回 Transform 对象 tr
                       tr.steps[]   — 从 baseDoc 变到 headDoc 所需的最小 Step 序列
                       tr.docs[i]   — step i 执行前的文档
                       tr.mapping   — 完整映射链
```

**选项配置：**

```typescript
recreateTransform(baseDoc, headDoc, {
  complexSteps: true,   // 启用 AddMarkStep、RemoveMarkStep、AttrStep
  wordDiffs: false,     // 字符级粒度（更精细，false 不代表词级）
  simplifyDiff: true,   // 合并相邻 Step，减少噪音
})
```

### 3.4 Step 类型处理

#### ReplaceStep（内容增删）

```
ReplaceStep { from, to, slice }

删除部分：preDoc[from..to]
  → 提取纯文本 deletedText
  → 位置映射到 headDoc：widgetPos = toHead.map(from)
  → 输出 { from: widgetPos, to: widgetPos, type: "deleted", text: deletedText }

插入部分：step.slice.content.size > 0
  → 插入位置在 step i 执行后的文档中，起点为 step.from
  → 映射到 headDoc：fromInHead = toHead.map(step.from)
  →                 toInHead   = toHead.map(step.from + insertedSize)
  → 输出 { from, to, type: "inserted" }
```

#### AddMarkStep / RemoveMarkStep（格式变更）

```
AddMarkStep / RemoveMarkStep { from, to, mark }

坐标为 preDoc 坐标，映射到 headDoc：
  → fromInHead = toHead.map(step.from)
  → toInHead   = toHead.map(step.to)
  → 输出 { from, to, type: "format-changed" }

触发场景：
  - 加粗 / 取消加粗 (bold)
  - 斜体 / 取消斜体 (italic)
  - 删除线 (strike)
  - 高亮颜色变更 (highlight)
  - 下划线、行内代码等所有 Mark 类型
```

#### AttrStep（节点属性变更）

```
AttrStep { pos, attr, value }

pos 为 preDoc 中节点自身的位置，内容区域为 [pos+1, pos+1+node.content.size)
映射到 headDoc 后包裹整个节点内容
→ 输出 { from, to, type: "format-changed" }

触发场景：
  - 标题级别变更（H1 → H2）
  - 文本对齐变更（left → center）
  - 其他节点 attrs 变更
```

### 3.5 位置映射原理

```
tr.docs[i]            — step i 执行前的文档状态（preDoc）
tr.mapping.slice(i+1) — 从"step i 执行后"投影到最终 headDoc 的位置映射

即：step.from（preDoc 坐标）─ toHead.map() ─→ headDoc 坐标

这确保所有 DiffRange 的 from/to 都是相对 headDoc 的绝对位置，
可直接传给 DecorationSet.create(headDoc, decorations)。
```

---

## 4. Decoration 渲染层

### 4.1 Extension 结构

```typescript
// PluginKey 独立，不与 V1 冲突
const pluginKey = new PluginKey<DecorationSet>("snapshotCompareV2");

// Plugin state 机制：
// - setMeta(pluginKey, newDecoSet)  → 替换整个 DecorationSet
// - 普通 tr（editor 编辑）         → decoSet.map(tr.mapping, tr.doc) 自动跟随文档变化
```

### 4.2 Decoration 类型映射

| DiffType | Decoration 类型 | CSS 类 | 视觉效果 |
|---|---|---|---|
| `inserted` | `Decoration.inline` | `.diff-inserted` | 绿色背景 |
| `deleted` | `Decoration.widget` | `.diff-deleted` | 红色中划线幽灵文本（插入到原位置） |
| `format-changed` | `Decoration.inline` | `.diff-format-changed` | 浅蓝色背景 |

### 4.3 CSS 样式

```scss
.diff-inserted {
  background-color: hsla(129, 100%, 90%, 0.6);
  outline: 1px solid hsla(147, 99%, 50%, 0.4);
}

.diff-deleted {
  color: hsl(7, 100%, 45%);
  text-decoration: line-through;
  background-color: hsla(11, 100%, 92%, 0.7);
}

.diff-format-changed {
  background-color: hsla(210, 100%, 88%, 0.55);  /* 浅蓝色 */
  outline: 1px solid hsla(210, 100%, 60%, 0.35);
}
```

---

## 5. 比较模式的交互流程

```
1. 用户点击历史面板中的某个版本（headSnapshot）
   ├─ 保存当前文档到 savedDocRef（用于恢复）
   ├─ editor.commands.setContent(headSnapshot.docJSON)  ← 切换到历史文档
   ├─ editor.setEditable(false)                          ← 锁定编辑
   └─ setTimeout(0):
        headDoc = PMNode.fromJSON(schema, headSnapshot.docJSON)
        baseDoc = PMNode.fromJSON(schema, nextSnapshot.docJSON)  ← 历史中的前一个版本
        ranges  = computeDiff(baseDoc, headDoc)
        applyDiff(editor, ranges)                                ← 叠加 Decoration

2. "Close" 按钮
   ├─ clearDiff(editor)
   ├─ editor.setEditable(true)
   └─ editor.commands.setContent(savedDocRef.current)   ← 恢复到操作前的文档

3. "Restore" 按钮
   ├─ clearDiff(editor)
   ├─ editor.setEditable(true)
   ├─ editor.commands.setContent(target.docJSON)         ← 以历史版本覆盖当前文档
   └─ savedDocRef.current = null
```

**注意**：若点击的是最旧的版本（无 baseSnapshot），diff 不会执行，仅展示文档内容。

---

## 6. V1 vs V2 对比

| 维度 | V1（diffWords） | V2（recreateTransform） |
|---|---|---|
| diff 算法 | jsdiff `diffWords`，文本级别字符串比较 | ProseMirror 原生 Steps 重建 |
| 格式变更感知 | ❌ 无法检测（bold/italic 等 Mark 变化不被捕获） | ✅ AddMarkStep / RemoveMarkStep |
| 属性变更感知 | ❌ 无法检测（H1→H2 不被捕获） | ✅ AttrStep |
| 坐标映射 | 手动 `buildCharPosMap`（曾有 +1 偏移 bug） | ProseMirror 原生 `Mapping`，零手动计算 |
| 已知局限 | 列表块拼接导致 diff 串位（已修复） | `ReplaceAroundStep` / `AddNodeMarkStep` 暂被忽略 |
| 依赖包 | `diff` (jsdiff v8.0.3) | `@fellow/prosemirror-recreate-transform` v1.2.3 |
| diff 颜色 | 绿色（插入）/ 红色（删除） | 绿色（插入）/ 红色（删除）/ **浅蓝色（格式变更）** |

---

## 7. 文件索引

| 文件 | 职责 |
|---|---|
| `src/lib/snapshot-store.ts` | localStorage CRUD，V1/V2 共享 |
| `src/lib/snapshot-diff-v2.ts` | `computeDiff` 核心算法 |
| `src/components/tiptap-extension/snapshot-compare-extension-v2.ts` | ProseMirror Plugin + `applyDiff` / `clearDiff` |
| `src/components/tiptap-templates/markdown-snapshot-local-v2/markdown-snapshot-local-v2-editor.tsx` | 编辑器主组件，交互逻辑 |
| `src/components/tiptap-templates/markdown-snapshot-local-v2/markdown-snapshot-local-v2-editor.scss` | 布局 + Diff 高亮样式 |
| `src/components/tiptap-templates/markdown-snapshot-local/components/snapshot-history-panel.tsx` | 历史面板 UI（V1/V2 共享） |

---

## 8. 已知局限与后续优化方向

1. **`ReplaceAroundStep` 未处理**：列表缩进、blockquote 包裹等操作产生此类 Step，当前被忽略，不会显示 diff。
2. **`AddNodeMarkStep` 未处理**：节点级 Mark（如图片 alt 文本等）变更不显示。
3. **删除以 Widget 形式展示**：幽灵文本不可选中，在复杂段落中视觉插入位置偶有偏差。
4. **最旧版本无法 diff**：历史列表倒序存储，最旧版本没有 baseDoc，点击后仅展示内容无高亮。
5. **性能**：`recreateTransform` 对超大文档（数万字）可能有延迟，可考虑 `requestIdleCallback` 异步执行。
