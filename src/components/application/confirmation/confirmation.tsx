import type { ReactNode } from "react";
import { Heading } from "react-aria-components";
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

export function Confirmation({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <ModalOverlay isOpen={open} onOpenChange={onOpenChange} data-studio-overlay>
      <Modal className="max-w-md" data-studio-modal>
        <Dialog role="alertdialog" className="space-y-6 p-6">
          <div className="space-y-2">
            <Heading
              slot="title"
              className="text-lg font-semibold text-primary"
            >
              {title}
            </Heading>
            <p className="text-sm text-tertiary">{children}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              color="secondary"
              autoFocus
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
