# GFM (GitHub Flavored Markdown) 完整规范示例

> GitHub Flavored Markdown (GFM) 是 GitHub 在 CommonMark 基础上扩展的 Markdown 方言，本文档覆盖所有规范节点。

---

## 目录

- [1. 标题 Headings](#1-标题-headings)
- [2. 段落与换行 Paragraphs & Line Breaks](#2-段落与换行)
- [3. 强调 Emphasis](#3-强调-emphasis)
- [4. 删除线 Strikethrough](#4-删除线-strikethrough)
- [5. 块引用 Blockquotes](#5-块引用-blockquotes)
- [6. 列表 Lists](#6-列表-lists)
- [7. 任务列表 Task Lists](#7-任务列表-task-lists)
- [8. 代码 Code](#8-代码-code)
- [9. 链接 Links](#9-链接-links)
- [10. 图片 Images](#10-图片-images)
- [11. 表格 Tables](#11-表格-tables)
- [12. 水平分割线 Thematic Breaks](#12-水平分割线-thematic-breaks)
- [13. HTML 内联 Inline HTML](#13-html-内联-inline-html)
- [14. 转义字符 Backslash Escapes](#14-转义字符-backslash-escapes)
- [15. 自动链接 Autolinks](#15-自动链接-autolinks)
- [16. 脚注 Footnotes](#16-脚注-footnotes)
- [17. 定义链接 Link Reference Definitions](#17-定义链接-link-reference-definitions)
- [18. 数学公式 Math（扩展）](#18-数学公式-math扩展)

---

## 1. 标题 Headings

ATX 风格（推荐）：

# 一级标题 H1
## 二级标题 H2
### 三级标题 H3
#### 四级标题 H4
##### 五级标题 H5
###### 六级标题 H6

Setext 风格（仅支持 H1 / H2）：

一级标题 Setext
================

二级标题 Setext
----------------

---

## 2. 段落与换行

这是第一段落。段落之间用**空行**分隔。

这是第二段落。Lorem ipsum dolor sit amet, consectetur adipiscing elit.

行末添加两个空格可以实现硬换行：  
这是同一段落的第二行。  
这是第三行。

---

## 3. 强调 Emphasis

| 语法 | 效果 |
|------|------|
| `*斜体*` | *斜体* |
| `_斜体_` | _斜体_ |
| `**粗体**` | **粗体** |
| `__粗体__` | __粗体__ |
| `***粗斜体***` | ***粗斜体*** |
| `___粗斜体___` | ___粗斜体___ |
| `**_粗斜体_**` | **_粗斜体_** |

---

## 4. 删除线 Strikethrough

GFM 扩展语法，使用双波浪线：

~~这段文字将被删除~~

~~删除线~~ 可以与 **粗体** 和 *斜体* 混合使用：~~**粗体删除线**~~

---

## 5. 块引用 Blockquotes

> 这是一级块引用。
>
> 块引用可以跨越多个段落，只要每行都以 `>` 开头。

> 块引用中可以嵌套其他元素：
>
> > 这是二级嵌套块引用。
> >
> > > 这是三级嵌套块引用。
>
> 回到一级引用。

> **注意：** 块引用内支持 *Markdown* 格式，`代码`，以及列表：
>
> - 列表项 A
> - 列表项 B

---

## 6. 列表 Lists

### 无序列表 Unordered List

- 项目 A（使用 `-`）
- 项目 B
  - 嵌套项目 B-1（缩进 2 空格）
  - 嵌套项目 B-2
    - 三级嵌套 B-2-a
- 项目 C

* 也可以用 `*`
* 项目二

+ 也可以用 `+`
+ 项目二

### 有序列表 Ordered List

1. 第一项
2. 第二项
   1. 嵌套第一项
   2. 嵌套第二项
3. 第三项

有序列表起始数字可以不从 1 开始：

57. 从 57 开始
58. 第二项
59. 第三项

### 松散列表 Loose List

列表项之间有空行时，渲染为"松散"列表（每项包裹在 `<p>` 中）：

- 第一项

- 第二项

- 第三项

---

## 7. 任务列表 Task Lists

GFM 扩展：使用 `[ ]` 和 `[x]` 表示未完成 / 已完成任务。

- [x] 撰写项目需求文档
- [x] 完成原型设计
- [ ] 前端开发
  - [x] 首页布局
  - [ ] 用户登录页
  - [ ] 数据看板
- [ ] 后端 API 开发
- [ ] 单元测试
- [ ] 部署上线

---

## 8. 代码 Code

### 行内代码 Inline Code

使用反引号包裹：`console.log("Hello, World!")`

包含反引号的代码：`` `code` `` 或 `` ` `` 单独一个反引号。

### 围栏代码块 Fenced Code Blocks

不指定语言：

```
这是一段无高亮的代码块
可以包含任意内容
```

指定语言（语法高亮）：

```javascript
// JavaScript 示例
const greet = (name) => {
  return `Hello, ${name}!`;
};

console.log(greet("GFM"));
```

```python
# Python 示例
def fibonacci(n: int) -> list[int]:
    """返回前 n 个斐波那契数列"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))
```

```bash
# Shell 脚本示例
#!/bin/bash
for i in {1..5}; do
  echo "Iteration $i"
done
```

```json
{
  "name": "gfm-example",
  "version": "1.0.0",
  "description": "GitHub Flavored Markdown 示例",
  "keywords": ["markdown", "gfm", "github"],
  "dependencies": {}
}
```

```sql
-- SQL 示例
SELECT
    u.id,
    u.username,
    COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.username
ORDER BY order_count DESC
LIMIT 10;
```

### 缩进代码块 Indented Code Blocks

    // 4 个空格缩进也可以创建代码块
    function add(a, b) {
        return a + b;
    }

---

## 9. 链接 Links

### 内联链接 Inline Links

[GitHub 官网](https://github.com)

[带有 Title 的链接](https://github.com "GitHub - 世界最大代码托管平台")

[相对路径链接](./README.md)

[锚点链接](#1-标题-headings)

### 引用链接 Reference Links

这里有一个[引用链接][ref-1]，还有一个[隐式引用链接][]。

[ref-1]: https://www.markdownguide.org "Markdown 指南"
[隐式引用链接]: https://spec.commonmark.org

### 折叠链接（数字引用）

请访问 [CommonMark 规范][1] 了解更多。

[1]: https://spec.commonmark.org/0.31.2/

---

## 10. 图片 Images

### 内联图片

![Alt 文字描述](https://via.placeholder.com/400x200/0d1117/58a6ff?text=GFM+Image "可选 Title")

### 引用图片

![GitHub Logo][github-logo]

[github-logo]: https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png "GitHub Logo"

### 带链接的图片

[![点击跳转到 GitHub](https://via.placeholder.com/200x60/0d1117/58a6ff?text=GitHub)](https://github.com)

---

## 11. 表格 Tables

GFM 扩展：使用管道符 `|` 和连字符 `-` 绘制表格。

### 基本表格

| 姓名   | 年龄 | 城市   |
| ------ | ---- | ------ |
| 张三   | 28   | 北京   |
| 李四   | 32   | 上海   |
| 王五   | 25   | 深圳   |

### 对齐方式

| 左对齐       |    居中对齐    |       右对齐 |
| :----------- | :------------: | -----------: |
| 左边         |     中间       |         右边 |
| `left`       |   `center`     |      `right` |
| 使用 `:-`    | 使用 `:-:` | 使用 `-:` |

### 包含格式的表格

| 功能         | 状态              | 备注                    |
| ------------ | ----------------- | ----------------------- |
| **任务列表** | ✅ 支持           | GFM 扩展                |
| *斜体*       | ✅ 支持           | CommonMark 标准         |
| ~~删除线~~   | ✅ 支持           | GFM 扩展                |
| `行内代码`   | ✅ 支持           | CommonMark 标准         |
| 表格嵌套     | ❌ 不支持         | 需用 HTML 实现          |
| [链接](#)    | ✅ 支持           | —                       |

---

## 12. 水平分割线 Thematic Breaks

三种等效写法（至少三个字符，可有空格）：

---

***

___

- - -

* * *

---

## 13. HTML 内联 Inline HTML

GFM 支持在 Markdown 中嵌入部分 HTML 标签。

<details>
<summary>点击展开详情（折叠块）</summary>

这里是折叠内容，使用原生 HTML `<details>` 和 `<summary>` 实现。

```python
print("折叠块中也可以有代码！")
```

</details>

<br>

<kbd>Ctrl</kbd> + <kbd>C</kbd> 复制，<kbd>Ctrl</kbd> + <kbd>V</kbd> 粘贴。

文字颜色（部分平台支持）：<span style="color:red">红色文字</span>，<span style="color:blue">蓝色文字</span>。

<table>
  <tr>
    <th>HTML 表头 1</th>
    <th>HTML 表头 2</th>
  </tr>
  <tr>
    <td>单元格 1</td>
    <td>单元格 2</td>
  </tr>
</table>

---

## 14. 转义字符 Backslash Escapes

使用反斜线 `\` 转义以下特殊字符：

| 字符 | 转义写法 | 说明           |
| ---- | -------- | -------------- |
| \*   | `\*`     | 星号           |
| \_   | `\_`     | 下划线         |
| \`   | `` \` `` | 反引号         |
| \#   | `\#`     | 井号           |
| \+   | `\+`     | 加号           |
| \-   | `\-`     | 连字符         |
| \.   | `\.`     | 句点           |
| \!   | `\!`     | 感叹号         |
| \[   | `\[`     | 左方括号       |
| \]   | `\]`     | 右方括号       |
| \(   | `\(`     | 左圆括号       |
| \)   | `\)`     | 右圆括号       |
| \{   | `\{`     | 左花括号       |
| \}   | `\}`     | 右花括号       |
| \|   | `\|`     | 管道符（表格） |
| \\   | `\\`     | 反斜线本身     |

---

## 15. 自动链接 Autolinks

### 尖括号自动链接

<https://github.com>

<mailto:user@example.com>

<ftp://files.example.com>

### GFM 扩展自动链接（无需尖括号）

在 GFM 中，以下格式会被自动识别为链接：

- URL：https://github.com/github/cmark-gfm
- www 链接：www.github.com
- 邮箱：user@example.com

---

## 16. 脚注 Footnotes

GFM 支持脚注[^1]。脚注可以有较长的描述[^long]，也支持行内脚注^[这是一个行内脚注示例]。

脚注引用可以在文中多次使用[^1]。

[^1]: 这是第一个脚注，显示在文档底部。

[^long]: 这是一个较长的脚注说明。

    脚注内容可以包含多个段落，只需要保持缩进。

    ```python
    # 甚至可以包含代码块
    print("脚注中的代码")
    ```

---

## 17. 定义链接 Link Reference Definitions

链接定义可以放在文档任意位置（通常集中放在底部），定义本身不会渲染为可见内容。

这是一个[示例链接][example]，这是[另一个链接][docs]。

[example]: https://example.com "示例网站"
[docs]: https://docs.github.com "GitHub 文档"

---

## 18. 数学公式 Math（扩展）

部分 GFM 渲染器（如 GitHub）支持 LaTeX 数学公式。

### 行内公式

质能方程：$E = mc^2$，欧拉恒等式：$e^{i\pi} + 1 = 0$。

### 块级公式

$$
\frac{d}{dx}\left(\int_{a}^{x} f(t)\, dt\right) = f(x)
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

---

## 附录：GFM 规范速查表

| 类别           | 语法                         | CommonMark | GFM 扩展 |
| -------------- | ---------------------------- | :--------: | :------: |
| ATX 标题       | `# H1` ... `###### H6`      | ✅         | —        |
| Setext 标题    | `===` / `---`                | ✅         | —        |
| 粗体 / 斜体    | `**` / `*`                   | ✅         | —        |
| 删除线         | `~~文字~~`                   | —          | ✅       |
| 块引用         | `>`                          | ✅         | —        |
| 有序 / 无序列表 | `1.` / `-` `*` `+`          | ✅         | —        |
| 任务列表       | `- [ ]` / `- [x]`           | —          | ✅       |
| 围栏代码块     | ` ``` ` / `~~~`              | ✅         | —        |
| 表格           | `\| col \| col \|`          | —          | ✅       |
| 链接           | `[text](url)`                | ✅         | —        |
| 图片           | `![alt](url)`                | ✅         | —        |
| 自动链接       | `<url>` / 裸 URL             | 部分       | ✅       |
| 行内 HTML      | `<tag>`                      | ✅         | —        |
| 水平线         | `---` / `***` / `___`       | ✅         | —        |
| 转义字符       | `\*`                         | ✅         | —        |
| 脚注           | `[^1]`                       | —          | ✅       |
| 数学公式       | `$...$` / `$$...$$`         | —          | ✅（部分）|

---

*本文档遵循 [GFM 规范 v0.29.0.gfm.2024](https://github.github.com/gfm/) 编写。*
