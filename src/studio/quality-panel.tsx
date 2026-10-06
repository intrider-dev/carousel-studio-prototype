import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Doc, Group } from "./model";
import { inspectSlide } from "./quality";
import type { QualityIssue } from "./quality";
import { textFits } from "./text-layout";
import { loadSlideFonts } from "./fonts";
import { SlideThumbnail } from "./thumbnail";

export function QualityPanel({
  doc,
  group,
  onSelect,
}: {
  doc: Doc;
  group: Group;
  onSelect: (slideId: string, layerId?: string) => void;
}) {
  const [issues, setIssues] = useState<QualityIssue[]>([]),
    [checked, setChecked] = useState<{ doc: Doc; group: Group } | null>(null);
  const loading = checked?.doc !== doc || checked?.group !== group;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        await loadSlideFonts(doc, group.slides);
        const result = group.slides.flatMap((slide) => [
          ...inspectSlide(doc, slide),
          ...slide.elements
            .filter(
              (e) =>
                e.visible && e.type === "text" && !textFits(e, doc.defaultFont),
            )
            .map((e) => ({
              slideId: slide.id,
              layerId: e.id,
              severity: "error" as const,
              code: "overflow",
              message: `«${e.name}»: текст не помещается в слой.`,
            })),
        ]);
        await Promise.all(
          group.slides.flatMap((slide) =>
            slide.elements
              .filter((e) => e.type === "image" && e.visible)
              .map(async (e) => {
                if (e.type !== "image") return;
                try {
                  const image = new Image();
                  image.src = e.src;
                  await image.decode();
                  const scale =
                    e.fit === "cover"
                      ? Math.max(e.width / image.width, e.height / image.height)
                      : Math.min(
                          e.width / image.width,
                          e.height / image.height,
                        );
                  if (scale > 1.25)
                    result.push({
                      slideId: slide.id,
                      layerId: e.id,
                      severity: "warning",
                      code: "resolution",
                      message: `«${e.name}»: изображение увеличено выше исходного разрешения. Проверьте резкость или загрузите более крупный файл.`,
                    });
                } catch {
                  result.push({
                    slideId: slide.id,
                    layerId: e.id,
                    severity: "error",
                    code: "image",
                    message: `«${e.name}»: изображение не открывается.`,
                  });
                }
              }),
          ),
        );
        if (active) {
          setIssues(result);
          setChecked({ doc, group });
        }
      } catch {
        if (active) {
          setIssues([
            {
              slideId: group.slides[0].id,
              severity: "error",
              code: "fonts",
              message: "Не удалось загрузить шрифты для проверки.",
            },
          ]);
          setChecked({ doc, group });
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [doc, group]);
  const errors = issues.filter((i) => i.severity === "error").length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Проверка серии</CardTitle>
        <CardDescription>
          Факты и детали фото проверьте вручную.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={!loading && errors ? "destructive" : "secondary"}>
            {loading
              ? "Проверяю…"
              : errors
                ? `Ошибок: ${errors}`
                : "Критических ошибок нет"}
          </Badge>
          {!loading && <Badge variant="outline">Замечаний: {issues.length - errors}</Badge>}
        </div>
        {!loading && !issues.length && (
          <p className="text-sm text-muted-foreground">
            Серия прошла техническую проверку.
          </p>
        )}
        <div hidden={loading} className="max-h-80 space-y-2 overflow-auto">
          {issues.map((issue, i) => (
            <Button
              key={`${issue.slideId}-${issue.layerId}-${i}`}
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal text-left"
              onClick={() => onSelect(issue.slideId, issue.layerId)}
            >
              <span className="space-y-1">
                <span className="block text-xs text-muted-foreground">
                  Слайд{" "}
                  {group.slides.findIndex((s) => s.id === issue.slideId) + 1} ·{" "}
                  {issue.severity === "error" ? "Исправить" : "Проверить"}
                </span>
                <span className="block">{issue.message}</span>
              </span>
            </Button>
          ))}
        </div>
        <div
          className="grid gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Просмотр серии"
        >
          {group.slides.map((slide, i) => (
            <Button
              key={slide.id}
              variant="ghost"
              className="h-auto min-w-0 flex-col items-stretch justify-start gap-3 whitespace-normal p-2 text-left"
              aria-label={`Проверить слайд ${i + 1}`}
              onClick={() => onSelect(slide.id)}
            >
              <SlideThumbnail doc={doc} slide={slide} large />
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-xs font-normal text-muted-foreground">
                    Слайд {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-2 block pt-1">{slide.title}</span>
                </span>
                {!loading && (
                  <Badge
                    variant={
                      issues.some(
                        (issue) =>
                          issue.slideId === slide.id &&
                          issue.severity === "error",
                      )
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {issues.filter((issue) => issue.slideId === slide.id)
                      .length || "✓"}
                  </Badge>
                )}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
