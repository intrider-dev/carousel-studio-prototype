import { useEffect, useState } from "react";
import type { Doc, Proposal } from "./model";
import { makeGroup } from "./model";
import { fitGroup } from "./text-layout";
import { renderSlide } from "./canvas";
import { loadSlideFonts } from "./fonts";
import { blobDataUrl } from "./media";

export function ProposalPreview({
  doc,
  proposal,
}: {
  doc: Doc;
  proposal: Proposal;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    async function render() {
      try {
        const composed = makeGroup(doc, proposal);
        await loadSlideFonts(doc, composed.slides);
        const group = fitGroup(composed, doc.defaultFont, doc.width/doc.height);
        for (const slide of group.slides) {
          const blob = await renderSlide(doc, slide, { width: 500 });
          if (!active) return;
          urls.push(await blobDataUrl(blob));
        }
        if (active) {
          setPreviews([...urls]);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "Не удалось показать предпросмотр. Проверьте текст и изображения.",
          );
      }
    }
    void render();
    return () => {
      active = false;
    };
  }, [doc, proposal]);
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-label="Предпросмотр группы">
      {proposal.slides.map((slide, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg border bg-muted"
          style={{ aspectRatio: `${doc.width} / ${doc.height}` }}
        >
          {previews[i] && (
            <img
              src={previews[i]}
              className="preview-image absolute inset-0 h-full w-full object-contain"
              alt={`Слайд ${i + 1}: ${slide.title}`}
            />
          )}
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
