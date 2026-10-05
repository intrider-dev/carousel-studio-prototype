import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  function close() {setLoading(true);setError("");onClose()}
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) close();
      }}
    >
      <DialogContent
        finalFocus={() => document.getElementById("project-library-trigger")}
        className="max-w-3xl"
      >
        <div className="flex items-center justify-between gap-3">
          <DialogTitle>Проекты</DialogTitle>
          <Button variant="outline" onClick={close} disabled={busy}>
            Закрыть
          </Button>
        </div>
        <DialogDescription>Сохранены в этом браузере.</DialogDescription>
        <div className="max-h-[65dvh] space-y-4 overflow-y-auto overscroll-contain">
          {loading && <Pending>Открываю библиотеку…</Pending>}
          {!loading && projects.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              Нет сохранённых проектов.
            </p>
          )}
          <div hidden={loading} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                disabled={busy}
                className="h-auto justify-start whitespace-normal p-4 text-left"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const projectDoc=await openProject(project.id);setLoading(true);onOpen(projectDoc);
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
                  <span className="block text-xs font-normal text-muted-foreground">
                    {project.width}×{project.height} · Групп: {project.groups} ·
                    Слайдов: {project.slides}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleString()}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
