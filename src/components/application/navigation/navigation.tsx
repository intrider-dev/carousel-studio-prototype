import type { ReactNode } from "react";
import { LayersTwo01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

const pages = [
  ["/", "Редактор"],
  ["/chat", "Диалог"],
  ["/basic", "Простой шаблон"],
] as const;
export function Navigation({
  currentPath,
  onNavigate,
  children,
}: {
  currentPath: string;
  onNavigate?: (path: string) => void;
  children?: ReactNode;
}) {
  return (
    <header className="studio-header border-b border-secondary">
      <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <LayersTwo01
            className="size-6 text-fg-brand-primary"
            aria-hidden="true"
          />
          <span className="text-lg font-semibold text-primary">Карусель</span>
          <Badge color="brand" size="sm">
            Прототип
          </Badge>
        </div>
        <nav
          className="studio-nav flex max-w-full flex-wrap gap-1"
          aria-label="Разделы"
        >
          {pages.map(([href, label]) => (
            <Button
              key={href}
              href={href}
              color={currentPath === href ? "secondary" : "tertiary"}
              aria-current={currentPath === href ? "page" : undefined}
              onClick={
                onNavigate && href !== "/basic"
                  ? (event) => {
                      event.preventDefault();
                      onNavigate(href);
                    }
                  : undefined
              }
            >
              {label}
            </Button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
