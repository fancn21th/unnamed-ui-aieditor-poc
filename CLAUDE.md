# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project implementing a rich text editor using Tiptap. The editor features a comprehensive toolbar with formatting options, image uploads, and responsive mobile/desktop layouts.

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
```

## Architecture

### Component Structure

The codebase follows a modular architecture organized into distinct layers:

- **`src/components/tiptap-ui-primitive/`** - Base UI components (Button, Toolbar, Popover, Dropdown, etc.) that are editor-agnostic
- **`src/components/tiptap-ui/`** - Editor-specific UI components that integrate with Tiptap (HeadingDropdownMenu, MarkButton, LinkPopover, etc.)
- **`src/components/tiptap-node/`** - Custom Tiptap node extensions and their styling (ImageUploadNode, HorizontalRule, etc.)
- **`src/components/tiptap-extension/`** - Custom Tiptap extensions (NodeBackground, etc.)
- **`src/components/tiptap-icons/`** - SVG icon components
- **`src/components/tiptap-templates/`** - Complete editor implementations (SimpleEditor)
- **`src/hooks/`** - Reusable React hooks for editor functionality
- **`src/lib/`** - Utility functions

### Key Patterns

1. **Component Co-location**: Each UI component follows a pattern of having its own directory with:
   - Main component file (`component-name.tsx`)
   - Index file for exports (`index.tsx`)
   - Hook file for logic (`use-component-name.ts`)

2. **Editor Context**: The editor uses Tiptap's `EditorContext` to provide editor instance to child components. Components can access the editor via `useTiptapEditor()` hook.

3. **Responsive Design**: The editor adapts between mobile and desktop layouts. Mobile view uses a state-based toolbar that switches between main/highlighter/link views. Desktop shows all controls simultaneously.

4. **Path Aliases**: Uses `@/` alias for `./src/` (configured in tsconfig.json and vite.config.ts)

## Tiptap Extensions

The editor is configured with:
- StarterKit (basic formatting)
- Custom HorizontalRule node
- TextAlign, TaskList, TaskItem
- Highlight (multicolor), Image, Typography
- Superscript, Subscript, Selection
- ImageUploadNode (custom with upload handling)

## Styling

- Uses SCSS for styling
- Node-specific styles are in `src/components/tiptap-node/*/` directories
- Main editor styles in `src/components/tiptap-templates/simple/simple-editor.scss`
