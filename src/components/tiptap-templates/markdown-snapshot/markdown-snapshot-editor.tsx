"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { TiptapCollabProvider, WebSocketStatus } from "@tiptap-pro/provider";
import { Snapshot } from "@tiptap-pro/extension-snapshot";
import {
  EditorContent,
  EditorContext,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useStreamingEditor } from "@/hooks/use-streaming-editor";

import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";
import { NodeLock } from "@/components/tiptap-extension/node-lock-extension";
import { MarkdownSnapshotBubbleMenu } from "@/components/tiptap-templates/markdown-snapshot/components/markdown-snapshot-bubble-menu";
import { TiptapDevModal } from "@/components/tiptap-dev-modal";

import { createStreamSimulator } from "@/lib/stream-simulator";
import { MarkdownNodeBuffer } from "@/lib/markdown-node-buffer";
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

import "@/components/tiptap-templates/markdown-snapshot/markdown-snapshot-editor.scss";
import content from "@/components/tiptap-templates/markdown3/data/gfm-simple.md?raw";
import htmlContent from "/mockData/test.html?raw";

interface SnapshotCommands {
  saveVersion?: (name?: string, force?: boolean, metadata?: Record<string, unknown>) => unknown;
  fetchVersions?: () => unknown;
  enableVersioning?: () => unknown;
  disableVersioning?: () => unknown;
  revertToVersion?: (version: number, title?: string) => unknown;
}

interface SnapshotVersion {
  version: number;
  date: number;
  name?: string;
}

interface SnapshotState {
  currentVersion: number;
  latestVersion: number;
  versioningEnabled: boolean;
  status: string;
  synced: boolean;
  versions: SnapshotVersion[];
}

const LOCKABLE_NODE_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "taskList",
  "bulletList",
  "orderedList",
  "codeBlock",
];

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

function formatVersionDate(timestamp: number) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function MarkdownSnapshotEditor() {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    currentVersion: 0,
    latestVersion: 0,
    versioningEnabled: false,
    status: "disconnected",
    synced: false,
    versions: [],
  });
  const [actionMessage, setActionMessage] = useState("Snapshot 已就绪");
  const [providerReady, setProviderReady] = useState(false);
  const [providerMessage, setProviderMessage] = useState("协作 Provider 加载中");
  const [providerStatus, setProviderStatus] = useState<WebSocketStatus | "idle">("idle");
  const [providerError, setProviderError] = useState("");
  const [collabProvider, setCollabProvider] = useState<TiptapCollabProvider | null>(
    null,
  );
  const versionsRef = useRef<HTMLDivElement>(null);
  const collabDocument = useMemo(() => new Y.Doc(), []);
  const documentName = useMemo(
    () => `room-snapshot-${getDayOfYear(new Date())}`,
    [],
  );
  const userName = useMemo(
    () => `user-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );
  const appId = (import.meta.env.VITE_TIPTAP_APP_ID as string | undefined) ?? "";
  const token = (import.meta.env.VITE_TIPTAP_TOKEN as string | undefined) ?? "";
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let providerInstance: TiptapCollabProvider | null = null;
    if (!appId || !token) {
      setProviderMessage("未配置 VITE_TIPTAP_APP_ID / VITE_TIPTAP_TOKEN");
      setProviderStatus(WebSocketStatus.Disconnected);
      setProviderError("");
      setProviderReady(true);
      return () => {
        active = false;
      };
    }
    try {
      setProviderReady(false);
      setProviderStatus(WebSocketStatus.Connecting);
      setProviderMessage("协作 Provider 连接中");
      setProviderError("");
      providerInstance = new TiptapCollabProvider({
        appId,
        name: documentName,
        document: collabDocument,
        user: userName,
        token,
      });
      const handleStatus = (payload: { status: WebSocketStatus }) => {
        if (!active) return;
        setProviderStatus(payload.status);
        if (payload.status === WebSocketStatus.Connected) {
          setProviderMessage("协作 Provider 已连接");
          setProviderReady(true);
          return;
        }
        if (payload.status === WebSocketStatus.Connecting) {
          setProviderMessage("协作 Provider 连接中");
          setProviderReady(false);
          return;
        }
        setProviderMessage("协作 Provider 连接已断开");
        setProviderReady(false);
      };
      const handleAuthFailed = (payload: { reason: string }) => {
        if (!active) return;
        setProviderError(`鉴权失败: ${payload.reason}`);
        setProviderReady(false);
      };
      const handleClose = (payload: { event: { code: number; reason: string } }) => {
        if (!active) return;
        const reasonText = payload.event.reason ? ` ${payload.event.reason}` : "";
        setProviderError(`连接关闭: ${payload.event.code}${reasonText}`);
        setProviderReady(false);
      };
      providerInstance.on("status", handleStatus);
      providerInstance.on("authenticationFailed", handleAuthFailed);
      providerInstance.on("close", handleClose);
      setCollabProvider(providerInstance);
    } catch (error) {
      setProviderMessage(
        error instanceof Error ? error.message : "协作 Provider 初始化失败",
      );
      setProviderStatus(WebSocketStatus.Disconnected);
      setProviderReady(true);
    }
    return () => {
      if (providerInstance) {
        providerInstance.removeAllListeners();
      }
      active = false;
      if (providerInstance?.destroy) {
        providerInstance.destroy();
      }
    };
  }, [appId, token, collabDocument, documentName, userName]);

  const configuredSnapshotExtension = useMemo(() => {
    return Snapshot.configure({
      provider: collabProvider ?? undefined,
      onUpdate: (payload: Record<string, unknown>) => {
        setSnapshotState({
          currentVersion: Number(payload.currentVersion ?? 0),
          latestVersion: Number(payload.latestVersion ?? payload.version ?? 0),
          versioningEnabled: Boolean(payload.versioningEnabled),
          status: String(payload.status ?? "disconnected"),
          synced: Boolean(payload.synced),
          versions: Array.isArray(payload.versions)
            ? (payload.versions as SnapshotVersion[])
            : [],
        });
      },
    });
  }, [collabProvider]);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "markdown-snapshot-editor",
      },
    },
    extensions: [
      StarterKit as any,
      Markdown.configure({
        markedOptions: { gfm: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      NodeLock.configure({
        types: LOCKABLE_NODE_TYPES,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      ...(configuredSnapshotExtension ? [configuredSnapshotExtension as any] : []),
    ],
    content: htmlContent,
    contentType: "html",
  }, [configuredSnapshotExtension]);

  const { processMessage, reset } = useStreamingEditor(editor);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!editor) return;
    if (!configuredSnapshotExtension) {
      return;
    }
    const storage = (editor.storage as unknown as Record<string, unknown>).snapshot as
      | Partial<SnapshotState>
      | undefined;
    setSnapshotState({
      currentVersion: Number(storage?.currentVersion ?? 0),
      latestVersion: Number(storage?.latestVersion ?? 0),
      versioningEnabled: Boolean(storage?.versioningEnabled),
      status: String(storage?.status ?? "disconnected"),
      synced: Boolean(storage?.synced),
      versions: Array.isArray(storage?.versions)
        ? (storage?.versions as SnapshotVersion[])
        : [],
    });
  }, [configuredSnapshotExtension, editor]);

  useEffect(() => {
    if (!editor) return;

    let aborted = false;
    const buffer = new MarkdownNodeBuffer({
      onMessage: processMessage,
    });

    const run = async () => {
      const stream = createStreamSimulator(content, {
        minChunkSize: 3,
        maxChunkSize: 25,
        delayMs: 150,
        delayJitter: 30,
      });

      for await (const chunk of stream) {
        if (aborted) break;
        buffer.push(chunk);
      }

      if (!aborted) {
        buffer.done();
      }
    };

    run();

    return () => {
      aborted = true;
      reset();
    };
  }, [editor, processMessage, reset]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  const executeSnapshotCommand = async (
    action: (commands: SnapshotCommands) => unknown,
    successMessage: string,
  ) => {
    if (!editor) return;
    if (!collabProvider) {
      setActionMessage("Snapshot 不可用，请先配置协作 Provider");
      return;
    }
    const commands = editor.commands as unknown as SnapshotCommands;
    try {
      const result = action(commands);
      if (result instanceof Promise) {
        await result;
      }
      setActionMessage(successMessage);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Snapshot 操作失败");
    }
  };

  const handleSaveVersion = () => {
    const nowLabel = new Date().toLocaleString("zh-CN", { hour12: false });
    void executeSnapshotCommand((commands) => {
      return commands.saveVersion?.(`手动版本 ${nowLabel}`);
    }, "已创建新版本");
  };

  const handleFetchVersions = () => {
    void executeSnapshotCommand((commands) => {
      return commands.fetchVersions?.();
    }, "已刷新版本列表");
  };

  const handleToggleAutoVersion = () => {
    if (snapshotState.versioningEnabled) {
      void executeSnapshotCommand((commands) => {
        return commands.disableVersioning?.();
      }, "已关闭自动快照");
      return;
    }
    void executeSnapshotCommand((commands) => {
      return commands.enableVersioning?.();
    }, "已开启自动快照");
  };

  const handleRevertToVersion = (version: number) => {
    void executeSnapshotCommand((commands) => {
      return commands.revertToVersion?.(version, `回滚到版本 ${version}`);
    }, `已回滚到版本 ${version}`);
  };
  const handleScrollToVersions = () => {
    versionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="markdown-snapshot-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <div className="markdown-snapshot-controls">
          <div className="markdown-snapshot-header">
            <span>Snapshot 历史</span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleFetchVersions}
              disabled={!collabProvider || !providerReady}
            >
              刷新
            </Button>
          </div>
          <div className="markdown-snapshot-meta">
            <span>状态: {snapshotState.status}</span>
            <span>同步: {snapshotState.synced ? "是" : "否"}</span>
            <span>当前: v{snapshotState.currentVersion}</span>
            <span>最新: v{snapshotState.latestVersion}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleScrollToVersions}
              disabled={!collabProvider || !providerReady}
            >
              版本列表
            </Button>
          </div>
          <div className="markdown-snapshot-actions">
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveVersion}
              disabled={!collabProvider || !providerReady}
            >
              保存版本
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleToggleAutoVersion}
              disabled={!collabProvider || !providerReady}
            >
              {snapshotState.versioningEnabled ? "关闭自动快照" : "开启自动快照"}
            </Button>
          </div>
          <div className="markdown-snapshot-meta">{actionMessage}</div>
          <div className="markdown-snapshot-meta">
            {providerMessage}
            {providerStatus !== "idle" ? ` (${providerStatus})` : ""}
          </div>
          {providerError ? (
            <div className="markdown-snapshot-meta">{providerError}</div>
          ) : null}
          <div className="markdown-snapshot-versions" ref={versionsRef}>
            {snapshotState.versions.length === 0 ? (
              <div className="markdown-snapshot-meta">暂无版本</div>
            ) : (
              snapshotState.versions
                .slice()
                .reverse()
                .map((item) => (
                  <div className="markdown-snapshot-version" key={item.version}>
                    <div className="markdown-snapshot-version-text">
                      <div className="markdown-snapshot-version-title">
                        v{item.version} {item.name ?? "未命名版本"}
                      </div>
                      <div className="markdown-snapshot-version-date">
                        {formatVersionDate(item.date)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRevertToVersion(item.version)}
                    >
                      回滚
                    </Button>
                  </div>
                ))
            )}
          </div>
        </div>

        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        {editor && (
          <MarkdownSnapshotBubbleMenu
            editor={editor!}
            lockableNodeTypes={LOCKABLE_NODE_TYPES}
          />
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="markdown-snapshot-editor-content"
        />
        <TiptapDevModal editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}
