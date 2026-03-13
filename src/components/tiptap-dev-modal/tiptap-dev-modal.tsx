"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Code2Icon } from "@/components/tiptap-icons/code2-icon";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";
import "@/components/tiptap-dev-modal/tiptap-dev-modal.scss";

interface TiptapDevModalProps {
  editor: Editor | null;
}

export function TiptapDevModal({ editor }: TiptapDevModalProps) {
  const [open, setOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState("{}");

  const syncJsonContent = useCallback(() => {
    if (!editor) {
      setJsonContent("{}");
      return;
    }
    setJsonContent(JSON.stringify(editor.getJSON(), null, 2));
  }, [editor]);

  useEffect(() => {
    if (!editor || !open) return;

    syncJsonContent();
    editor.on("transaction", syncJsonContent);

    return () => {
      editor.off("transaction", syncJsonContent);
    };
  }, [editor, open, syncJsonContent]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="primary"
          className="tiptap-dev-modal-trigger"
          tooltip="查看当前 JSON"
          aria-label="查看当前 JSON"
          disabled={!editor}
        >
          <Code2Icon className="tiptap-button-icon" />
          <span className="tiptap-button-text">JSON</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={12}
        className="tiptap-dev-modal-content bg-white"
      >
        <div className="tiptap-dev-modal-header">
          <span className="tiptap-dev-modal-title">Tiptap JSON</span>
          <Button
            type="button"
            size="small"
            variant="ghost"
            onClick={syncJsonContent}
          >
            刷新
          </Button>
        </div>
        <pre className="tiptap-dev-modal-json">{jsonContent}</pre>
      </PopoverContent>
    </Popover>
  );
}
