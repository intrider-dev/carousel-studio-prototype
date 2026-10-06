# Project instructions

This repository is a local carousel editor prototype. Keep this status explicit in documentation and public descriptions. Do not claim production readiness, guaranteed image quality, or predicted conversion.

## Working rules

- Read both READMEs and relevant source before editing. Maintain English and Russian documentation together.
- Preserve unrelated changes. Do not modify external chat projects without explicit authorization.
- Use neutral functional names and professional authorship. Do not label artifacts by the tools used.
- Keep Russian interface copy short and consistent. Keep model prompts separate from interface copy; do not replace saved user content to shorten the interface.
- Compose the interface from the official Untitled UI React components and default theme. Keep app layout compositions small; preserve native validation and accessible labels when adapting fields. Do not add a second component kit or restyle the kit controls.
- Do not create parallel contributors unless explicitly requested.

## Implementation constraints

- Keep runtime versions consistent in `.nvmrc`, `package.json`, Dockerfile, and documentation.
- Shared contracts belong in `shared/` and `src/studio/model.ts`.
- Restore generation drafts before initializing catalog defaults. Defer persistence until restoration finishes. Verify saved model choices and missing-picture retries across reload with a fast catalog response.
- Preserve the common drawing path for canvas, previews, and exports.
- Preserve independent layer identities, counters, photo aspect ratios, and manually added layers.
- Persist successful generation stages. Retries must not repurchase successful pictures.
- Apply generated content explicitly; do not silently overwrite projects or layers.
- Bind pending modifications to source IDs and canonical content revisions, including photos. Verify that save/load alone preserves a binding, while real source edits invalidate it.
- Review actual operations before application. Preserve manual layers during redesign and validate the complete result atomically before adding a history entry.
- Keep the external chat optional and preserve bridge origin checks.
- Keep workspace switching independent of canvas dragging and text entry. Preserve focus, selection, and mounted controls when hiding panels.
- Use short, explicit motion properties. Respect reduced motion and keyboard navigation; keep preview dimensions stable while loading.
- Keep visual control order consistent with keyboard order. Hide stale review results until the current document has been checked.
- Validate provider output and imported files. Retain bounds and size limits.

## Secrets and publication

- Keep provider credentials outside the repository. `.env` can contain local paths but must remain ignored.
- Never commit credentials, provider configuration, browser profiles, generated project JSON, logs, or unrelated files.
- Inspect staged files and screenshot contents before publishing. Use verified demonstration assets.
- Keep Docker bound to loopback. Public hosting requires separate authorization and security work.
- Repository publication does not authorize messages or writes to other services.

## Verification

Run checks appropriate to the change:

```sh
npm test
npm run lint
npm run build
docker compose up -d --build
npm run test:browser
```

Browser regressions use controlled provider responses. Live scripts can spend balance and require authorized generation scope.

Inspect actual desktop and mobile pages after visible changes. Verify saved state, recovery, and export when affected. Repeat checks invalidated by the last change. Read actual output before claiming completion.

For generation and style changes, inspect each actual exported image at full size and as a feed thumbnail. Check that the selected medium is visibly recognizable, project directions differ in composition as well as color, and copy reads without clipping or oversized gaps. HTTP success, schema validity, and export checks establish technical behavior only; they do not establish visual quality. Keep the comparison brief and distinguish functional checks from visual judgment.

Maintain a working verification record for substantial work without unsolicited report documents. Reports about personally completed work use first-person singular. When BBCode is requested, deliver reports in chat, use ordinary hyphens, and highlight material facts.
