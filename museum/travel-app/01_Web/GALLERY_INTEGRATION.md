# The World Cabinet — StarMap integration

Upstream: https://github.com/Aisland-SJL/StarMap at `17eebdf8f6e942906041f6b1069acba7d559f76e`. MIT, Copyright (c) 2026 Aisland-SJL. Retain the repository LICENSE and the shipped `vendor/StarMap-LICENSE.txt`. Cesium and Natural Earth credits remain visible; Cesium’s package license is included in the build.

This fork retains StarMap’s actual Cesium globe, country/city tools, private media importer, photo lightbox, ordering and journey views. Its third `approved` profile is a read-only room within Bobbie’s Gallery. The original `public` profile retains the upstream fictional demo, and `personal` uses the owner’s external private data. Run the root wrapper commands from `travel-app/`; its approved build writes `travel-app/dist/`. The public demo build is a separate smoke-test profile and the Gallery publisher consumes only the approved output.

## Add the next trip

1. Start the local owner editor with an external private folder:

   ```sh
   STARMAP_PRIVATE_ROOT=/path/to/private/travel npm run dev:personal
   ```

2. Open http://127.0.0.1:5173/. In the country panel use the settings button and plus button, search/select the country, and save. A date is optional. Open the country’s City Cards to add a city; search/select or explicitly enter its name and coordinates. Repeat visits create separate records. Optional exact dates remain private unless selected for public export.
3. Open the city’s photo settings and plus button to select ordinary photos. The upstream importer preserves the source and creates private derivatives. Ordinary photos are supported by the public export; aerial/panorama/video items remain private in this first reviewed workflow.
4. Click **Review & export**, or open `/__travelatlas/review`. Confirm the country/place, select Visited/Lived/Wishlist, write the intended public story, and choose which dates and city location may be shared. Month/year precision is accepted. Approve only text intended for publication.
5. Inspect every photograph. Enter factual alt text, a public caption, and confirm ownership/publication rights and approval. An image requires a matching approved city visit. Export creates 640px thumbnails and 1800px viewer WebPs; originals, EXIF/XMP/IPTC, exact GPS, source filenames and import paths stay private.
6. **Preview public map** creates a private read-only build at `/__travelatlas/preview/`. **Dry run** lists selected changes without writing a public snapshot. **Export approved** writes `<private-root>/approved-public/snapshot.json` and only approved image derivatives.
7. Sync the reviewed snapshot into the app’s source-controlled public data:

   ```sh
   npm run sync:approved -- --source /path/to/private/travel/approved-public
   npm run build:approved
   ```

8. Review the Gallery public diff, then copy `dist/` into the existing GitHub Pages `/travel/` folder using the Gallery preparation script. Publish through the owner’s existing Git workflow.

## Data boundary

Private data lives under `STARMAP_PRIVATE_ROOT`: `data/travel-map.local.json`, `editor-state.local.json`, `user-media.local.json`, `publication-review.local.json`, immutable `MediaInbox/` and the imported media library. Publication requires explicit `countryConfirmed`, `reviewed`, `publicApproved` and `disclosurePermission`; photos additionally require `rightsConfirmed`. Wishlist entries are kept separate from visited counts.

The approved build reads only `STARMAP_APPROVED_ROOT` (or the source-controlled `approved-public/` folder). It never falls back to the upstream sample or imports the personal tree. The write API client is replaced with read-only stubs; editor middleware is never registered in approved mode. Tokens are explicitly empty and imagery defaults to bundled Natural Earth II. Published data is compiled/static and independent of visitor localStorage. LocalStorage retains only presentation choices.

The production app uses `/travel/` asset paths. The finalizer corrects vite-plugin-cesium’s nested copy behavior, writes a static country fallback into the HTML, preserves notices, and rejects private/demo/write markers in the compiled JS. `?view=list` skips globe mounting; ordinary country/journey navigation remains available. Rendering errors in the globe leave the rest of the application usable.

## Verification

```sh
npm run lint
npm run test:publication
npm run privacy:check
npm run build:public
npm run build:approved
```

The local Preview child explicitly uses a production environment, matching the publishing build and excluding development source filenames.

Publication tests use temporary synthetic data and generated test pixels, not personal photos. They verify approval gates, month-precision dates, rounded city coordinates, wishlist exclusion, reviewed prose allowlists, media rights, metadata removal, private/demo markers, dry runs and revocation/isolation.

The initial reviewed snapshot contains only Egypt, July 2025, approved directly by the owner. It contains no city, photograph, personal story, exact date or precise visited location. Country geometry is an approximate geographic overview. Additional countries require individual confirmation.
