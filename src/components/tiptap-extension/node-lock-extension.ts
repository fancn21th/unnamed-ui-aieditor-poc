import type { NodeWithPos } from "@tiptap/core"
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, type EditorState, type Transaction } from "@tiptap/pm/state"
import type { Node as PMNode } from "@tiptap/pm/model"
import { getSelectedNodesOfType, updateNodesAttr } from "@/lib/tiptap-utils"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    nodeLock: {
      setCurrentNodeLock: (locked: boolean) => ReturnType
      lockCurrentNode: () => ReturnType
      unlockCurrentNode: () => ReturnType
      toggleCurrentNodeLock: () => ReturnType
    }
  }
}

export interface NodeLockOptions {
  types: string[]
}

const NODE_LOCK_PLUGIN_KEY = new PluginKey("nodeLock")
const NODE_LOCK_BYPASS_META = "nodeLockBypass"

function intersects(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return Math.max(aFrom, bFrom) < Math.min(aTo, bTo)
}

function getLockedRanges(doc: PMNode, types: string[]) {
  const ranges: Array<{ from: number; to: number }> = []
  const allowed = new Set(types)
  doc.descendants((node, pos) => {
    if (!allowed.has(node.type.name)) return true
    if (node.attrs?.locked) {
      ranges.push({ from: pos, to: pos + node.nodeSize })
    }
    return true
  })
  return ranges
}

function resolveTargetNode(state: EditorState, types: string[]): NodeWithPos | null {
  const selected = getSelectedNodesOfType(state.selection, types)
  if (selected.length > 0) return selected[0]
  const typeSet = new Set(types)
  for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) {
    const node = state.selection.$from.node(depth)
    if (!node.isBlock) continue
    if (!typeSet.has(node.type.name)) continue
    return { node, pos: state.selection.$from.before(depth) }
  }
  return null
}

export const NodeLock = Extension.create<NodeLockOptions>({
  name: "nodeLock",

  addOptions() {
    return {
      types: [
        "paragraph",
        "heading",
        "blockquote",
        "taskList",
        "bulletList",
        "orderedList",
        "codeBlock",
      ],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          locked: {
            default: false,
            parseHTML: (element: HTMLElement) => {
              const attr = element.getAttribute("data-locked")
              return attr === "true"
            },
            renderHTML: (attributes) => {
              const locked = Boolean(attributes.locked)
              if (!locked) return {}
              return {
                "data-locked": "true",
                "data-node-locked": "true",
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    const execute =
      (nextLocked: boolean | ((current: boolean) => boolean)) =>
      ({ state, tr }: { state: EditorState; tr: Transaction }) => {
        const target = resolveTargetNode(state, this.options.types)
        if (!target) return false
        const current = Boolean(target.node.attrs?.locked)
        const resolved =
          typeof nextLocked === "function" ? nextLocked(current) : nextLocked
        const changed = updateNodesAttr(tr, [target], "locked", resolved)
        if (!changed) return false
        tr.setMeta(NODE_LOCK_BYPASS_META, true)
        return true
      }

    return {
      setCurrentNodeLock:
        (locked: boolean) =>
        ({ state, tr }) =>
          execute(locked)({ state, tr }),
      lockCurrentNode:
        () =>
        ({ state, tr }) =>
          execute(true)({ state, tr }),
      unlockCurrentNode:
        () =>
        ({ state, tr }) =>
          execute(false)({ state, tr }),
      toggleCurrentNodeLock:
        () =>
        ({ state, tr }) =>
          execute((current) => !current)({ state, tr }),
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: NODE_LOCK_PLUGIN_KEY,
        filterTransaction: (tr, state) => {
          if (tr.getMeta(NODE_LOCK_BYPASS_META)) return true
          if (!tr.docChanged) return true

          const lockedRanges = getLockedRanges(state.doc, this.options.types)
          if (lockedRanges.length === 0) return true

          const selectionFrom = state.selection.from
          const selectionTo = state.selection.to
          const selectionTouchesLocked = lockedRanges.some(({ from, to }) =>
            intersects(selectionFrom, selectionTo, from, to),
          )

          if (selectionTouchesLocked) return false

          let blocked = false
          tr.steps.forEach((step) => {
            if (blocked) return
            const stepMap = step.getMap()
            stepMap.forEach((oldStart, oldEnd) => {
              if (blocked) return
              const normalizedEnd = oldEnd > oldStart ? oldEnd : oldStart + 1
              const touchesLocked = lockedRanges.some(({ from, to }) =>
                intersects(oldStart, normalizedEnd, from, to),
              )
              if (touchesLocked) blocked = true
            })
          })

          return !blocked
        },
      }),
    ]
  },
})
