import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/tiptap-ui-primitive/button";
import type { PageId } from "@/hooks/use-page-route";
import { PAGES } from "./pages-config";
import "./prototype-layout.scss";

interface PrototypeLayoutProps {
  currentPage: PageId;
  onNavigate: (id: PageId) => void;
  children: React.ReactNode;
}

export function PrototypeLayout({
  currentPage,
  onNavigate,
  children,
}: PrototypeLayoutProps) {
  const currentLabel = PAGES.find((p) => p.id === currentPage)?.label ?? "";

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            variant="primary"
            className="proto-switcher__trigger"
            title="切换原型页面"
            aria-label="切换原型页面"
          >
            <GridIcon className="tiptap-button-icon" />
            <span className="tiptap-button-text">{currentLabel}</span>
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="proto-switcher__content"
            side="bottom"
            align="start"
            sideOffset={6}
          >
            {PAGES.map((page) => (
              <DropdownMenu.Item
                key={page.id}
                className={`proto-switcher__item${currentPage === page.id ? " proto-switcher__item--active" : ""}`}
                onSelect={() => onNavigate(page.id)}
              >
                <span className="proto-switcher__item-label">{page.label}</span>
                {currentPage === page.id && (
                  <span className="proto-switcher__item-check">✓</span>
                )}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {children}
    </>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}
