# Carousel Studio - prototype

[English](README.md) | [Русский](README.ru.md)

**A local prototype, not a production service.** Create carousel slides from a prompt, review the plan, generate pictures, and edit the result as separate layers.

![Carousel editor with a generated four-slide series](docs/screenshots/editor.png)

## Features

- Project size, audience, goal, scenario, and call to action.
- Review slide text, layouts, and picture prompts before generating images.
- Five visual directions, six layouts, twelve built-in fonts, and uploaded fonts.
- Brand colors, heading/body fonts, logo, and contact details.
- Move, resize, rotate, reorder, hide, and lock text, photos, and shapes.
- Multiple photos per slide, cropping, and editable graphic layers.
- Consistent fonts across a series, gradient text, and curved arrows.
- Rebuild a group's design into a new group while keeping the original layers.
- Analyze references or a whole group; rewrite text or change the topic.
- Edit existing slides and groups from a prompt: text, fonts, colors, geometry, layer order, and group structure.
- Preview exact operations, apply explicitly, undo, and reject stale responses.
- Local project library, saved generation drafts, partial-image retries, and JSON transfer.
- Technical checks for text overflow, bounds, contrast, and image resolution.
- PNG and ZIP export in project, square, portrait, story, or landscape sizes.

## Screenshots

The interface currently uses Russian. FORM is a fictional demonstration collection.

![Brand and brief settings](docs/screenshots/brand.png)

![Technical review](docs/screenshots/review.png)

<img src="docs/screenshots/slide.png" alt="Exported demonstration slide" width="360" />

![Redesign an existing slide from the dialogue](docs/screenshots/dialog.png)

## Run with Docker

Requires Docker with Compose. The image pins **Node.js 26.10.0**.

```sh
git clone https://github.com/intrider-dev/carousel-studio-prototype.git
cd carousel-studio-prototype
mkdir ../carousel-studio-config
cp provider.env.example ../carousel-studio-config/provider.env
cp .env.example .env
```

On PowerShell, use `New-Item -ItemType Directory` and `Copy-Item` if needed.

Set `CHAT_API_KEY`, `CHAT_BASE_URL`, and `CHAT_MODEL` in `provider.env` **outside the repository**. The template uses an OpenAI-compatible provider. Text, vision, structured output, and image support depend on the provider and model. Requests can incur charges.

```sh
docker compose up -d --build
```

Open **http://localhost:3080**. The port is bound to loopback only.

| Route | Purpose |
| --- | --- |
| `/` | Editor, brand settings, technical review, and project library |
| `/chat` | Prompt-driven creation and optional chat integration |
| `/basic` | Manual six-slide checklist |

The legacy chat is **not included**. Set `LEGACY_URL` in `.env` for a compatible external chat. The editor and direct generation connector work separately; the collapsed chat panel reports a connection error when that service is unavailable.

For manual editing without a provider, keep the external configuration file present with empty values. Generation will be unavailable.

## Main flow

1. Create a project: size, topic, visual direction, and optional brand.
2. Open the dialogue, choose available models in settings, and describe the series.
3. Review the plan. Edit headings, body text, layouts, and picture prompts.
4. Generate pictures, preview the series, and add it as a group.
5. Edit layers, run review, and export PNG or ZIP.
6. Reload and reopen the project. Export JSON for transfer or backup.

For existing content, choose **Изменить по запросу** and the current slide or group. Describe the changes, review the operation list and previews, then apply. **Переделать дизайн** rebuilds compositions in place while preserving added layers; pictures can be reused or regenerated. **Переписать текст** keeps the visual layers. **Сменить тему** replaces the selected content rather than appending a group. Picture replacement sends the current picture as a reference when the selected model supports image input.

## Prototype limitations

- Projects live in the current browser's IndexedDB. No accounts, cloud sync, shared projects, or collaboration.
- No durable job queue, billing, or production authentication. Do not expose the local server publicly without further security work.
- Generated pictures can change product details between slides. Use original photos when exact identity matters.
- Technical checks do not verify facts or predict conversion. Review content and images before publishing.
- New export aspect ratios need visual review. Modified compositions preserve layers through scaling.
- Digital PNG exports only; no print-ready CMYK/PDF, social publishing, or scheduler.
- Compatibility with arbitrary chat applications is not guaranteed. Only the documented local environment has been verified.
- Structured redesign and rewriting accept up to twelve slides per request. Operation plans accept up to eighty operations, within the editor's twelve-group, twenty-slide, and forty-layer limits. There is no unrestricted command execution or guaranteed interpretation of every prompt.

## Development

Use the Node version in `.nvmrc`.

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:browser
```

Browser checks require the Docker service, a browser, and npm access for Playwright CLI. The regression suite uses controlled responses and does not purchase generation requests. Live scripts are separate and can incur charges.

Current baseline: **35 unit tests and 95 browser assertions**. See [development and manual checks](docs/DEVELOPMENT.md), [architecture](docs/ARCHITECTURE.md), and [project instructions](AGENTS.md).

Standard shadcn/ui components are used without theme redesign. The vendored stylesheet retains its [MIT notice](src/styles/vendor/shadcn.LICENSE.md); dependency and font licenses remain with their packages.
