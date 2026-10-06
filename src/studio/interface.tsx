import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { ChevronDown } from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";

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
    <AriaDisclosure
      defaultExpanded={defaultOpen}
      className={className}
      data-slot="disclosure"
    >
      <Heading>
        <Button
          slot="trigger"
          color="tertiary"
          className="h-auto w-full justify-between whitespace-normal text-left"
          iconTrailing={
            <ChevronDown
              data-icon="trailing"
              className="disclosure-chevron size-5 shrink-0"
            />
          }
        >
          <span className="min-w-0">
            <span className="block">{title}</span>
            {description && (
              <span className="mt-1 block text-xs font-normal text-tertiary">
                {description}
              </span>
            )}
          </span>
        </Button>
      </Heading>
      <DisclosurePanel className="disclosure-panel">
        <div className="pt-4">{children}</div>
      </DisclosurePanel>
    </AriaDisclosure>
  );
}
export function Pending({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 text-sm text-tertiary"
    >
      <span aria-hidden="true">
        <LoadingIndicator size="sm" />
      </span>
      {children}
    </div>
  );
}
