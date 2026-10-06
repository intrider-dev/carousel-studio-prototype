import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}
function DialogContent({ className, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}
function DialogTitle(props: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className="text-lg font-semibold" {...props} />;
}
function DialogDescription(props: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className="text-sm text-muted-foreground"
      {...props}
    />
  );
}
export { Dialog, DialogContent, DialogTitle, DialogDescription };
