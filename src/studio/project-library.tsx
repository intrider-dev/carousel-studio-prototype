import { useEffect, useState } from "react";
import { Heading } from "react-aria-components";
import {
  Dialog,
  Modal,
  ModalOverlay,
} from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { listProjects, openProject } from "./storage";
import type { ProjectSummary } from "./storage";
import type { Doc } from "./model";
import { Pending } from "./interface";
export function ProjectLibrary({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: (doc: Doc) => void;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!open) return;
    let active = true;
    listProjects()
      .then((value) => {
        if (active) setProjects(value);
      })
      .catch(() => {
        if (active) setError("Не удалось прочитать список проектов.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);
  function close() {
    setLoading(true);
    setError("");
    onClose();
  }
  return (
    <ModalOverlay
      data-studio-overlay
      isOpen={open}
      isDismissable={!busy}
      onOpenChange={(value) => {
        if (!value && !busy) close();
      }}
    >
      <Modal className="max-w-3xl" data-studio-modal>
        <Dialog className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <Heading
              slot="title"
              className="text-lg font-semibold text-primary"
            >
              Проекты
            </Heading>
            <Button color="secondary" onClick={close} isDisabled={busy}>
              Закрыть
            </Button>
          </div>
          <p className="text-sm text-tertiary">Сохранены в этом браузере.</p>
          <div className="max-h-[65dvh] space-y-4 overflow-y-auto overscroll-contain">
            {loading && <Pending>Открываю библиотеку…</Pending>}
            {!loading && projects.length === 0 && !error && (
              <p className="text-sm text-tertiary">Нет сохранённых проектов.</p>
            )}
            <div
              hidden={loading}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((project) => (
                <Button
                  key={project.id}
                  color="secondary"
                  isDisabled={busy}
                  className="h-auto justify-start whitespace-normal p-4 text-left"
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const projectDoc = await openProject(project.id);
                      setLoading(true);
                      onOpen(projectDoc);
                    } catch {
                      setError(
                        "Не удалось открыть проект. Проверьте сохранённый JSON или резервную копию.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <span className="min-w-0 space-y-2">
                    <span className="block font-semibold">{project.title}</span>
                    <span className="block text-xs font-normal text-tertiary">
                      {project.width}×{project.height} · Групп: {project.groups}{" "}
                      · Слайдов: {project.slides}
                    </span>
                    <span className="block text-xs font-normal text-tertiary">
                      {new Date(project.updatedAt).toLocaleString()}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-error-primary">
                {error}
              </p>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
