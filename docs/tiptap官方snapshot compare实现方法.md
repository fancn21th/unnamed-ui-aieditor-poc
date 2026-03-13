Tiptap的Snapshot Compare（快照差异对比）并非直接暴露单一底层diff算法，而是基于**ProseMirror生态**+**Yjs协作引擎**实现的分层diff能力，核心依托ProseMirror的`prosemirror-changeset`做结构化diff处理，同时结合Yjs的状态追踪完成协作场景下的版本差异计算，且自身封装了**块级+字符级**的双层diff逻辑，以下是核心实现细节：

### 1. 核心底层依赖：ProseMirror-changeset
Snapshot Compare的diff能力基于ProseMirror官方的`prosemirror-changeset`模块实现，该模块是专门为富文本文档设计的**结构化diff工具**，而非简单的文本字符串diff，核心特性：
- 以ProseMirror的**节点/片段（Node/Fragment）** 为单位做diff，适配富文本的层级结构（如标题、段落、列表、代码块等）；
- 将差异抽象为**Change**和**Span**对象，记录删除/插入的范围、元数据（如操作人），并支持差异的合并、映射；
- 内置**令牌编码器（Token Encoder）**，将节点、字符编码为可对比的令牌，实现精准的节点/字符级匹配，避免纯文本diff的结构错乱问题。

### 2. 协作层diff：Yjs状态追踪与版本快照
由于Snapshot Compare依赖Tiptap的协作能力（TiptapCollabProvider），其版本快照的底层由**Yjs**维护：
- Yjs会实时追踪文档的状态变更，将每次编辑转化为**不可变的状态更新（Update）**，快照本质是Yjs文档在某个时间点的状态快照；
- 版本间的diff会先通过Yjs计算**状态增量**，再结合用户标识（userId）做差异归因，确保协作场景下能精准定位“谁在哪个版本做了什么修改”；
- TiptapCollabProvider必须传入`user`参数，核心作用就是为Yjs的diff增量绑定用户元数据，优化差异的归因和展示。

### 3. 自身封装的双层diff模式（与Tiptap Diff Utility同源）
Snapshot Compare的diff逻辑与Tiptap官方的Diff Utility一致，实现了**块级（block）** 和**字符级（detailed）** 两种diff模式，适配不同的对比需求：
- **字符级diff（默认）**：对文本节点（text node）做精细化的字符级对比，精准定位到单个字符的插入、删除、修改，适用于需要细粒度追踪编辑的场景；
- **块级diff**：将每个顶级节点（如段落、标题、列表）作为一个整体单位，仅判断节点的新增、删除、移动，不深入字符级，适用于快速概览文档结构变更的场景；
- 支持差异合并：自动将同一区域的多次小修改合并为单个差异，避免界面上的高亮混乱。

### 4. 差异的映射与渲染：从diff结果到视觉高亮
Snapshot Compare并非直接返回原始diff结果，而是通过**ProseMirror装饰器（Decoration）** 将diff映射为编辑器的视觉高亮：
- 内置`defaultMapDiffToDecorations`方法，将diff对象转化为ProseMirror的inline/block装饰器，为差异内容添加`data-diff-type`（如inline-insert/inline-delete）等属性；
- 支持自定义`mapDiffToDecorations`，开发者可根据diff类型、用户信息自定义高亮样式（如按用户分配专属背景色）；
- 针对自定义NodeView，提供`extractAttributeChanges`工具，提取节点属性的变更（如标题层级从H1改为H2），实现非文本节点的差异展示。

### 补充：与普通富文本diff的区别
普通的Tiptap自定义diff实现常使用Google的`diff-match-patch`做纯文本对比，而Snapshot Compare作为官方商业扩展，**摒弃了纯文本diff**，采用更适配富文本的**结构化diff方案**，核心优势：
1. 保留富文本文档的节点结构，避免纯文本diff导致的格式错乱；
2. 天然支持协作场景的用户归因，与Tiptap的实时协作能力无缝衔接；
3. 适配ProseMirror的装饰器系统，实现无侵入的视觉高亮，不修改原始文档内容。

### 总结
Tiptap Snapshot Compare的diff核心链路为：
**Yjs版本状态增量计算** → **prosemirror-changeset结构化diff（块级/字符级）** → **Diff对象转ProseMirror装饰器** → **视觉高亮与用户归因**
其底层无单一“字符串diff算法”，而是为富文本协作场景定制的**结构化diff方案**，这也是其区别于普通文本diff工具的核心所在。