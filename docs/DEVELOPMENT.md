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
- `editorial-prompt.test.ts` verifies shared system guidance across six text actions, unchanged source text, and preserved structured response contracts.
- `visual-style.test.ts` verifies technique guidance through planning and both picture API paths, conflicting scene descriptions, earlier display labels, and requests with no preset.
- Browser regressions cover layers, photos, fonts, persistence, recovery, cancellation, staged generation, analysis, project switching, and exports.
- `components-regression.js` verifies kit checkbox pointer/keyboard behavior, named tab panels, manual tab activation, confirmation focus, long select labels at five widths, file-input label targets, repeat imports, visible error states, and saved model preferences with a fast catalog response.
- `dialog-edits.js` covers in-place edits, rewrite/redesign/retopic, operation preview, draft reload, stale and invalid results, group structure, picture replacement, undo/redo, and ZIP.
- `interface-regression.js` creates its own project and checks focused workspaces, series navigation, control order, widths from 320 to 1600 px, modal focus, interrupted transitions, reduced motion, stable previews, and duplicate application protection.
- `basic-navigation.js` checks the independent checklist flow, heading focus, keyboard slide navigation, narrow screens, saving, and ZIP download. `node tests/verify-basic-export.mjs` verifies its six PNG dimensions, file order, and ZIP CRC.
- `style-regression.js` checks all six selected media through plan approval, reload, picture creation, and application, plus compact poster text and preservation of the starting group. Controlled pictures verify the connector rather than visual quality.
- `node tests/server-smoke.mjs` verifies routes, input rejection, cross-origin blocking, and configuration-file isolation.
- `tests/run-browser.mjs` creates and closes an isolated Playwright CLI session. Controlled responses avoid provider charges.
- Verification output goes to ignored `output/playwright/`.
- Older `*-flow.js` files describe previous interface states. The supported regression entry point is `npm run test:browser`.

## Live checks

`production-live-start.js`, `production-live-pictures.js`, and `production-live-finish.js` run staged generation in a dedicated browser session. They require configured models and **can incur charges**. They are not part of the default suite.

`node tests/verify-production-export.mjs` verifies local sample output: document contract, PNG dimensions, ZIP CRC, and equality of archived and individual files. Generated output is not shipped. README screenshots are documentation assets, not test fixtures.

`design-live-start.js`, `design-live-pictures.js`, and `design-live-finish.js` exercise a six-slide square series with real generated object illustrations. `design-reexport.js` rebuilds its design without repurchasing images; `verify-design-export.mjs` verifies all six PNGs and the ZIP. These scripts require their dedicated session and output files.

`dialog-live-start.js` / `dialog-live-finish.js`, `dialog-redesign-start.js` / `dialog-redesign-finish.js`, and `dialog-photo-start.js` / `dialog-photo-finish.js` exercise real-model edits on an existing six-slide sample. They incur provider charges. `verify-dialog-export.mjs` compares the before/after JSON and ZIP, including unchanged surrounding slides, identities and pictures. Sample input files must already exist in ignored output.

After those runs, `dialog-review.js` uses a controlled deletion response to check the actual-operation disclosure and the 390 px dialogue layout without applying the deletion or purchasing pictures.

`copy-live-start.js` and `copy-live-review.js` create a four-slide desk-organization plan through the available free text router, save its raw JSON, inspect text limits and common stock phrases, and capture the rendered preview. They require a fresh dedicated session. Pictures remain pending approval and are not purchased by these scripts. Text quality also requires reading every slide; phrase matching alone cannot establish natural language quality. Other selected models and image requests **can incur charges**.

`style-gallery.js` creates one real-model example per invocation in a fresh dedicated browser session: all five project directions, followed by all six picture styles. It performs plan approval, image creation, application, technical review, and PNG/ZIP/JSON export through the interface. Successful examples advance the session index; saved phases allow retrying an unfinished example without regenerating a successful plan or picture. Run it eleven times in the same session. It **incurs provider charges** and writes final PNGs to `docs/examples/`; source projects and ZIPs stay in ignored output. The brief and copy stay the same. Direction samples request their recommended compositions; picture styles share a poster layout. The script checks the selected medium in both connector requests. `node tests/verify-style-gallery.mjs` verifies complete catalog coverage, at least three direction compositions, fonts, palettes, compact poster text, preserved starter slides, PNG dimensions, ZIP CRC and equality, and both README galleries. These checks establish technical behavior. Inspect every export at full size and thumbnail size: flat drawing must visibly differ from photography and 3D, paper construction must change the object itself, collage must show cutout layers, and cinematic photography needs a distinct atmosphere. Do not publish indistinguishable samples as proof of style quality.

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
16. Switch between design, brief/brand, and review. Confirm that canvas controls disappear outside design and that switching back preserves text and selection. Open a slide from the series gallery.
17. Select text on the canvas. Verify that text, font, and color precede coordinates and the layer list, including the Tab order. Scroll each desktop sidebar independently.
18. Open Projects and check that the editor does not move. Use Tab, Shift+Tab, and Escape; verify focus returns to Projects. Reopen a saved project.
19. Open and close dialogue settings repeatedly. Enable the system's reduced-motion preference. Check that keyboard actions are immediate and dragging has no transition delay. During image loading, retain the preview and its frame dimensions.
20. At 390 px, confirm the canvas precedes project controls and slides scroll horizontally. Open the simple template, edit its text, navigate with arrows, download ZIP, reload, and return to the editor.
    Use ArrowLeft/ArrowRight to focus workspace tabs and Enter to activate one. Toggle the brand checkbox by its visible label and with Space. Select different text and picture models, reload, and verify both selections and the immediate-image preference remain saved.
21. In dialogue settings, select each of the six picture styles. Request the same one-slide brief, review the plan, reload, create the picture, and apply. Check the actual technique at full size and thumbnail size, text spacing, the unchanged starting group, and PNG/ZIP export. These live requests can incur charges. Project direction and picture technique are separate settings; explicit layout requests take precedence over recommendations.

## Failure cases

- Empty provider settings: manual editing works; generation shows a configuration error.
- Unsupported model: choose a suitable model; do not silently switch paid requests.
- Partial picture failure: retain success and retry only missing pictures.
- Cancellation: controls recover and saved stages remain; accepted requests may still be billed.
- Damaged project: offer recovery/import and preserve the healthy backup.
- Full browser storage: report the save failure and export before closing.
- Missing legacy chat: its panel shows an error while the editor remains usable.

## Documentation screenshots

`tests/repository-screens.js` imports the local `output/playwright/production-project.json` demo and captures editor, selected properties, review, brand, mobile, and dialogue screens without purchasing requests. The dialogue uses a controlled edit preview and leaves source slides unchanged. The demonstration file is needed only for screenshot capture, not the regression suite. Inspect images before replacing `docs/screenshots/` assets.

The build currently warns about an editor JavaScript chunk above 500 kB. This is a known loading-cost limitation; animations do not establish a performance benchmark or commercial readiness.
