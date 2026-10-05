import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MotionRegion({
  children,
  changeKey,
  className = "",
  hidden = false,
}: {
  children: ReactNode;
  changeKey: string;
  className?: string;
  hidden?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (
      hidden ||
      document.documentElement.dataset.inputMode === "keyboard" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const animation = ref.current?.animate(
      [
        { opacity: 0.7, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 160, easing: "cubic-bezier(.23,1,.32,1)" },
    );
    return () => animation?.cancel();
  }, [changeKey, hidden]);
  return (
    <div ref={ref} hidden={hidden} className={className} data-motion-region>
      {children}
    </div>
  );
}
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className = "",
  description,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  description?: ReactNode;
}) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className={className}
      data-slot="disclosure"
    >
      <Collapsible.Trigger
        render={<Button variant="ghost" />}
        className="group h-auto min-h-9 w-full justify-between gap-3 whitespace-normal px-2 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block">{title}</span>
          {description && (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="disclosure-chevron size-4 group-data-open:rotate-180"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="disclosure-panel">
        <div className="pt-4">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
export function Pending({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderCircle
        className="pending-spinner size-4 shrink-0"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
