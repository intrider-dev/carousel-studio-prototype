# Architecture

A single-user local prototype: React 19, TypeScript, Vite, standard shadcn/ui, Konva, Zod, IndexedDB, and a small Node HTTP server.

```mermaid
flowchart LR
  Brief[Size, brief, brand] --> Plan[Editable plan]
  Plan --> Pictures[Picture generation]
  Pictures --> Layers[Editable layers]
  Layers --> Review[Technical review]
  Review --> Export[PNG / ZIP]
  Layers <--> Store[IndexedDB]
  Plan <--> Store
```

## Source map

| File | Responsibility |
| --- | --- |
| `src/studio/Studio.tsx` | Project state, history, workspace, controls, imports, exports |
| `shared/design.ts` | Brief, brand, and visual directions |
| `shared/proposal.ts` | Generation contract and visual vocabulary |
| `src/studio/model.ts` | Document validation, identities, groups, counters |
| `src/studio/connector.tsx` | Models, generation, plan review, analysis, application |
| `src/studio/illustrations.ts` | Frame-aware pictures and partial retries |
| `src/studio/art-direction.ts`, `layouts.ts` | Brand rules and editable compositions |
| `src/studio/drawing.ts`, `canvas.tsx` | Common drawing path for canvas and PNG |
| `src/studio/text-layout.ts`, `fonts.ts` | Fonts, measurements, fitting |
| `src/studio/storage.ts` | Documents, shared assets, project index, backup |
| `src/studio/generation-state.ts` | Generation drafts keyed by project |
| `src/studio/quality.ts`, `quality-panel.tsx` | Geometry, contrast, image checks |
| `src/studio/resize.ts` | Reflow standard layouts or scale modified ones |
| `provider.mjs`, `server.mjs` | Provider API, validation, limits, static files, chat proxy |
| `src/App.tsx` | Independent manual checklist at `/basic` |

## Persistence

The `carousel-studio` database separates metadata from data URLs. Assets are deduplicated by hash. Project summaries support the local library. The last healthy document is retained as a recovery copy. Generation drafts include successful pictures and history.

JSON transfer includes images and uploaded fonts. Clearing browser data removes local projects; cloud backup is not provided.

## Generation and export

The default flow stops after a plan. Pictures start after review; retries skip existing pictures. Full-group analysis sends rendered slides in batches of three. Cancellation is best effort: a provider may have accepted or billed a request already.

Text, pictures, and graphics remain separate layers. The shared renderer rejects overflowing or out-of-bounds text during export. Technical review is heuristic: contrast uses known underlays rather than full pixel analysis and does not validate meaning or product identity.

Standard layouts can reflow. Added or repositioned layers trigger scaling to preserve them. Export leaves the original document unchanged.

## Configuration and external services

Credentials are loaded from an external read-only file and never sent to the client. Provider endpoints must expose compatible discovery and completion/image capabilities; text compatibility alone does not ensure image support.

The optional legacy chat and its bridge are not included. A compatible service must handle the origin-checked message exchange used by `Studio.tsx` and run at `LEGACY_URL`.
