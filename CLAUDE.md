# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project implementing a rich text editor using Tiptap with a **3-layer streaming markdown pipeline**. The editor receives markdown content incrementally (simulating LLM streaming), buffers it into block-level nodes, heals incomplete syntax via `remend`, and renders incrementally into the Tiptap editor.

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production (runs TypeScript compiler + Vite build)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Run unit tests (vitest)
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

### Streaming Pipeline (3 Layers)

```
Layer 1: createStreamSimulator          src/lib/stream-simulator.ts
  → AsyncGenerator, random chunk size (3–25 chars), configurable delay
  → for-await loop feeds chunks to Layer 2

Layer 2: MarkdownNodeBuffer             src/lib/markdown-node-buffer.ts
  ├── splitMarkdownNodes()              src/lib/markdown-node-splitter.ts
  │   (detects \n\n block boundaries, code-fence aware)
  ├── Receive: accumulate chunks, remend() to heal incomplete syntax
  └── Send: emit BufferMessage { nodeId, actualContent, completedContent, status }

Layer 3: useStreamingEditor             src/hooks/use-streaming-editor.ts
  → start:    insertContentAt(pos, completedContent)
  → updating: insertContentAt({from,to}, completedContent)
  → end:      insertContentAt({from,to}, actualContent)
  → scrollToBottom via requestAnimationFrame + Element.scrollIntoView
```

Shared types: `src/lib/streaming-types.ts` — `NodeStatus`, `BufferMessage`, `MarkdownNodeBufferOptions`

### Component Structure

The codebase follows a modular architecture organized into distinct layers:

- **`src/components/tiptap-ui-primitive/`** - Base UI components (Button, Toolbar, Popover, Dropdown, etc.) that are editor-agnostic
- **`src/components/tiptap-ui/`** - Editor-specific UI components that integrate with Tiptap (HeadingDropdownMenu, MarkButton, LinkPopover, etc.)
- **`src/components/tiptap-node/`** - Custom Tiptap node extensions and their styling (ImageUploadNode, HorizontalRule, etc.)
- **`src/components/tiptap-extension/`** - Custom Tiptap extensions (NodeBackground, etc.)
- **`src/components/tiptap-icons/`** - SVG icon components
- **`src/components/tiptap-templates/`** - Complete editor implementations (SimpleEditor, MarkdownEditor)
- **`src/hooks/`** - Reusable React hooks for editor functionality
- **`src/lib/`** - Utility functions and streaming pipeline

### Key Patterns

1. **Component Co-location**: Each UI component follows a pattern of having its own directory with:
   - Main component file (`component-name.tsx`)
   - Index file for exports (`index.tsx`)
   - Hook file for logic (`use-component-name.ts`)

2. **Editor Context**: The editor uses Tiptap's `EditorContext` to provide editor instance to child components. Components can access the editor via `useTiptapEditor()` hook.

3. **Responsive Design**: The editor adapts between mobile and desktop layouts. Mobile view uses a state-based toolbar that switches between main/highlighter/link views. Desktop shows all controls simultaneously.

4. **Path Aliases**: Uses `@/` alias for `./src/` (configured in tsconfig.json and vite.config.ts)

5. **Streaming Buffer**: Layer 2 is a pure TypeScript class (no React dependency) for testability. It uses `\n\n` as block-level node boundaries (code-fence aware) and `remend` for incomplete markdown syntax healing. Known limitation: loose lists (`- a\n\n- b`) are split into separate nodes.

## Tiptap Extensions

### SimpleEditor

- StarterKit (basic formatting)
- Custom HorizontalRule node
- TextAlign, TaskList, TaskItem
- Highlight (multicolor), Image, Typography
- Superscript, Subscript, Selection
- ImageUploadNode (custom with upload handling)

### MarkdownEditor

- StarterKit (basic formatting)
- Markdown (with GFM mode via `markedOptions: { gfm: true }`)
- Table, TableRow, TableCell, TableHeader
- TaskList, TaskItem

## Styling

- Uses SCSS for styling
- Node-specific styles are in `src/components/tiptap-node/*/` directories
- SimpleEditor styles in `src/components/tiptap-templates/simple/simple-editor.scss`
- MarkdownEditor styles in `src/components/tiptap-templates/markdown/markdown-editor.scss` (includes GFM table styles)

## Testing

- Test framework: Vitest (node environment)
- Test files: `src/lib/__tests__/*.test.ts`
- Coverage: stream-simulator (5), markdown-node-splitter (48), markdown-node-buffer (36) = 89 tests
- Layer 2 tests cover all GFM block types: paragraphs, headings, code blocks, blockquotes, lists, tables, thematic breaks, and inline syntax healing via remend

## External Dependencies

- **`remend`** (v1.2.2) — Self-healing markdown preprocessor for streaming. Closes unclosed `**`, `*`, `` ` ``, `~~`, `[](`, etc. Used in Layer 2 to generate safe-to-render `completedContent` from partial markdown chunks.
