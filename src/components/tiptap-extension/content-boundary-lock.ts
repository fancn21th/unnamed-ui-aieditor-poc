import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

/**
 * ContentBoundaryLockStore
 *
 * 可变对象，由外部持有引用（React useRef）。
 * Plugin 闭包捕获此对象，每次 filterTransaction 时动态读取 lockUntil，
 * 避免重建 editor 或 extension。
 */
export interface ContentBoundaryLockStore {
  /** 锁定范围：文档中 pos < lockUntil 的所有内容不可修改。0 = 未启用。 */
  lockUntil: number
}

export interface ContentBoundaryLockOptions {
  store: ContentBoundaryLockStore
}

/** 携带此 meta 的事务可绕过锁定检查（用于初始化内容写入等内部操作）。 */
export const CONTENT_BOUNDARY_BYPASS_META = "contentBoundaryBypass"

const PLUGIN_KEY = new PluginKey("contentBoundaryLock")

/**
 * ContentBoundaryLock
 *
 * 基于文档位置的范围锁定扩展。
 * 所有涉及 pos < lockUntil 的文档变更事务均被过滤丢弃，
 * 实现「初始化内容只读、后续追加内容可编辑」的混合文档模式。
 *
 * 用法：
 *   const lockStore = useRef({ lockUntil: 0 })
 *   ContentBoundaryLock.configure({ store: lockStore.current })
 *
 *   // setContent 后立即设置边界
 *   lockStore.current.lockUntil = editor.state.doc.content.size - 2
 */
export const ContentBoundaryLock = Extension.create<ContentBoundaryLockOptions>({
  name: "contentBoundaryLock",

  addOptions() {
    return {
      store: { lockUntil: 0 },
    }
  },

  addProseMirrorPlugins() {
    const { store } = this.options

    return [
      new Plugin({
        key: PLUGIN_KEY,

        filterTransaction: (tr) => {
          // 非文档变更（光标移动等）：允许
          if (!tr.docChanged) return true
          // 初始化内容写入：允许
          if (tr.getMeta(CONTENT_BOUNDARY_BYPASS_META)) return true

          const lockUntil = store.lockUntil
          if (lockUntil <= 0) return true

          let blocked = false

          tr.steps.forEach((step) => {
            if (blocked) return
            const map = step.getMap()
            map.forEach((oldStart, _oldEnd) => {
              if (blocked) return
              // oldStart < lockUntil：步骤起点在锁定区域内，直接阻止
              if (oldStart < lockUntil) blocked = true
            })
          })

          return !blocked
        },
      }),
    ]
  },
})
