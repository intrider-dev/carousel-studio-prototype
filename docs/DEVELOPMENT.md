# Development and testing

Use Node.js **26.10.0**, matching `.nvmrc` and Docker. Install with `npm ci`. Runtime configuration is documented in both READMEs.

```sh
npm run dev
```

Vite serves the interface, not the server API or legacy proxy. Verify integration through Docker at `http://localhost:3080`.

```sh
docker compose up -d --build
docker compose ps
npm test
npm run lint
npm run build
npm run test:browser
```

## Automated coverage

- Unit tests cover contracts, cloning, counters, geometry, branding, and template output.
- Browser regressions cover layers, photos, fonts, persistence, recovery, cancellation, staged generation, analysis, project switching, and exports.
- `dialog-edits.js` covers in-place edits, rewrite/redesign/retopic, operation preview, draft reload, stale and invalid results, group structure, picture replacement, undo/redo, and ZIP.
- `tests/run-browser.mjs` creates and closes an isolated Playwright CLI session. Controlled responses avoid provider charges.
- Verification output goes to ignored `output/playwright/`.
- Older `*-flow.js` files describe previous interface states. The supported regression entry point is `npm run test:browser`.

## Live checks

`production-live-start.js`, `production-live-pictures.js`, and `production-live-finish.js` run staged generation in a dedicated browser session. They require configured models and **can incur charges**. They are not part of the default suite.

`node tests/verify-production-export.mjs` verifies local sample output: document contract, PNG dimensions, ZIP CRC, and equality of archived and individual files. Generated output is not shipped. README screenshots are documentation assets, not test fixtures.

`design-live-start.js`, `design-live-pictures.js`, and `design-live-finish.js` exercise a six-slide square series with real generated object illustrations. `design-reexport.js` rebuilds its design without repurchasing images; `verify-design-export.mjs` verifies all six PNGs and the ZIP. These scripts require their dedicated session and output files.

`dialog-live-start.js` / `dialog-live-finish.js`, `dialog-redesign-start.js` / `dialog-redesign-finish.js`, and `dialog-photo-start.js` / `dialog-photo-finish.js` exercise real-model edits on an existing six-slide sample. They incur provider charges. `verify-dialog-export.mjs` compares the before/after JSON and ZIP, including unchanged surrounding slides, identities and pictures. Sample input files must already exist in ignored output.

After those runs, `dialog-review.js` uses a controlled deletion response to check the actual-operation disclosure and the 390 px dialogue layout without applying the deletion or purchasing pictures.

## Manual acceptance

1. Create a 1080×1350 project with topic, audience, goal, and call to action.
2. Enable branding, upload a wide logo, and choose colors and fonts.
3. Request four slides. Confirm that pictures wait for plan approval.
4. Edit a heading and picture prompt. Wait for saving, reload, and verify both.
5. Generate pictures, review previews, and add the group.
6. Drag/resize text; upload two photos, crop one, and remove the other.
7. Upload a custom font, apply it, reload, and verify it.
8. Move text outside the canvas. Follow its review issue and correct it.
9. Export ZIP; verify dimensions and order. Export landscape and inspect framing and added layers.
10. Download JSON, create another project, reopen the first from the library, and test JSON import.
11. Repeat key controls at 390 px width and with the keyboard.
12. Select a group, choose a visual direction under the brief, and click "Обновить дизайн". Verify that a new group appears and the original retains all its layers. The rebuilt group carries the first heading, body, label and main photo from each slide. Check the full last line of long titles, gradient controls and curved-arrow dragging. Wait for "Сохранено в этом браузере" before reloading.
13. In the dialogue choose "Изменить по запросу" and one slide. Change text, color or coordinates. Review the actual operation list, reload the saved plan, apply, undo and redo. Confirm that neighboring slides and photos remain unchanged.
14. Redesign the current group with image regeneration off, then change one slide's topic with regeneration on. Confirm that source IDs and manual elements survive and that paid image requests start only after approval.
15. Rename/reorder/duplicate a group, add a slide with an existing picture, delete the group and undo. Check counters and limits. Edit a source after requesting a plan and verify that stale application is blocked.

## Failure cases

- Empty provider settings: manual editing works; generation shows a configuration error.
- Unsupported model: choose a suitable model; do not silently switch paid requests.
- Partial picture failure: retain success and retry only missing pictures.
- Cancellation: controls recover and saved stages remain; accepted requests may still be billed.
- Damaged project: offer recovery/import and preserve the healthy backup.
- Full browser storage: report the save failure and export before closing.
- Missing legacy chat: its panel shows an error while the editor remains usable.

## Documentation screenshots

`tests/repository-screens.js` imports the local `output/playwright/production-project.json` demo and captures editor, review, and brand pages without generating pictures. Inspect images before replacing `docs/screenshots/` assets.
