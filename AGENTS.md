# Project instructions

This repository is a local carousel editor prototype. Keep this status explicit in documentation and public descriptions. Do not claim production readiness, guaranteed image quality, or predicted conversion.

## Working rules

- Read both READMEs and relevant source before editing. Maintain English and Russian documentation together.
- Preserve unrelated changes. Do not modify external chat projects without explicit authorization.
- Use neutral functional names and professional authorship. Do not label artifacts by the tools used.
- Keep Russian interface copy short and consistent. Keep model prompts separate from interface copy; do not replace saved user content to shorten the interface.
- Use existing shadcn/ui components and theme. Avoid new frameworks or architectural layers for small changes.
- Do not create parallel contributors unless explicitly requested.

## Implementation constraints

- Keep runtime versions consistent in `.nvmrc`, `package.json`, Dockerfile, and documentation.
- Shared contracts belong in `shared/` and `src/studio/model.ts`.
- Preserve the common drawing path for canvas, previews, and exports.
- Preserve independent layer identities, counters, photo aspect ratios, and manually added layers.
- Persist successful generation stages. Retries must not repurchase successful pictures.
- Apply generated content explicitly; do not silently overwrite projects or layers.
- Bind pending modifications to source IDs and canonical content revisions, including photos. Verify that save/load alone preserves a binding, while real source edits invalidate it.
- Review actual operations before application. Preserve manual layers during redesign and validate the complete result atomically before adding a history entry.
- Keep the external chat optional and preserve bridge origin checks.
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

Maintain a working verification record for substantial work without unsolicited report documents. Reports about personally completed work use first-person singular. When BBCode is requested, deliver reports in chat, use ordinary hyphens, and highlight material facts.
