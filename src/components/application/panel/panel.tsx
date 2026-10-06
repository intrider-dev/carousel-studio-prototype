import type { ComponentProps } from "react";
import { cx } from "@/utils/cx";

// App layout compositions. Controls inside use the official Untitled UI components.
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-panel
      className={cx(
        "flex flex-col gap-5 rounded-2xl border border-secondary bg-primary py-5 shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
export function PanelHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cx("flex flex-col gap-1 px-5", className)} {...props} />
  );
}
export function PanelTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cx("text-md font-semibold text-primary", className)}
      {...props}
    />
  );
}
export function PanelDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cx("text-sm text-tertiary", className)} {...props} />;
}
export function PanelBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("px-5", className)} {...props} />;
}
export function PanelFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 border-t border-secondary px-5 pt-5",
        className,
      )}
      {...props}
    />
  );
}
