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
- `tests/run-browser.mjs` creates and closes an isolated Playwright CLI session. Controlled responses avoid provider charges.
- Verification output goes to ignored `output/playwright/`.
- Older `*-flow.js` files describe previous interface states. The supported regression entry point is `npm run test:browser`.

## Live checks

`production-live-start.js`, `production-live-pictures.js`, and `production-live-finish.js` run staged generation in a dedicated browser session. They require configured models and **can incur charges**. They are not part of the default suite.

`node tests/verify-production-export.mjs` verifies local sample output: document contract, PNG dimensions, ZIP CRC, and equality of archived and individual files. Generated output is not shipped. README screenshots are documentation assets, not test fixtures.

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
