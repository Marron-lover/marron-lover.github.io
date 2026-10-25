# The World Cabinet — Gallery travel room

Reused from [StarMap](https://github.com/Aisland-SJL/StarMap), commit `17eebdf8f6e942906041f6b1069acba7d559f76e`, MIT Copyright2026 Aisland-SJL. The original LICENSE is retained. The actual globe, local editor, photo pipeline and journey interface remain upstream implementations.

The runnable source is `01_Web/`. Root npm commands wrap the existing application. `npm run build:approved` writes `travel-app/dist/` with `/travel/` base. `npm run setup` installs locked dependencies when needed. `npm run release:check` checks privacy, lint, publication tests and the approved build sequentially. This fork verifies its curated public snapshot rather than archiving the containing Gallery repository as a standalone StarMap repository.

Read [the next-trip guide](01_Web/GALLERY_INTEGRATION.md). Personal editing uses external `STARMAP_PRIVATE_ROOT`; reviewed public data is in `01_Web/approved-public/`. `npm run dev:personal` starts the editor on127.0.0.1:5173; review is `/__travelatlas/review`. Personal source media and approval ledgers stay outside this source tree.

Production contains only owner-confirmed Egypt, July2025, at country level. The separate `fixture` command creates local-only synthetic story/photo tests and is excluded from production.
