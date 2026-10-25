# Gallery publishing

The public museum is a static GitHub Pages site. Its working source is `museum/`. The local Atlas service is the editorial source of truth, with session authentication and a separate private storage directory. The public browser never connects to Atlas.

## Projects, notes and timeline

1. Open Atlas normally and choose **Editorial workspace**. Save a draft, complete its public fields and review its supporting evidence privately.
2. Set public visibility and confirm disclosure rights. Approve the exact saved revision. Editing the record clears that approval. Incomplete drafts remain editable; approval requires the full renderer contract.
3. Preview the snapshot and inspect its added, changed and removed records. Export the exact preview. Private evidence and private drafts remain local.
4. From `museum/`, run `npm run import:approved -- /path/to/reviewed-export.json`. The default dry run validates fields, routes, media and the diff. Add `--apply` after reviewing it.
5. New proof media needs a separate inspected asset receipt in `src/content/asset-receipt.json`; the build verifies its bytes, rights and size. Use owned artwork, cleared screenshots and aggregate diagrams. Keep client assets and medical images private.

## Trips

Open the travel editor or review link in Atlas. Atlas starts the existing loopback editor on demand and preserves an unrelated service if the port is occupied. Add the next confirmed country or city through the GUI. Dates and stories are optional. Review each public date, place, story and photograph, including image rights and factual alt text. Preview, dry run and export the approved snapshot.

From `museum/travel-app/`, run:

```sh
npm run sync:approved -- --source /path/to/private/travel/approved-public
npm run release:check
```

The approved build is independent of the neutral upstream public demo. Visitors receive one shared static snapshot and no editing API. Photos are published as metadata-stripped derivatives. The original photographs and importer state remain in the external private directory. See `travel-app/01_Web/GALLERY_INTEGRATION.md` for the complete editor workflow and MIT attribution.

## Prepare and publish

From `museum/`:

```sh
npm run test:content
npm run prepare:pages
```

The preparation script builds both rooms and replaces only its named generated directories, preserving unrelated source. This removes revoked files from the current deployed tree. Git history remains separate from current-tree revocation.

Review `git diff --stat` and the actual public changes. Check desktop/mobile navigation, route refreshes, the map, media playback, keyboard focus and motion preferences. Commit the generated Pages output, then push the existing publication branch. Verify the Pages build reaches that commit and inspect the live deep links.

The map uses bundled Natural Earth imagery through Cesium and requires no paid key. Its approximately 14 MB static distribution loads only when the travel room opens; the museum landing page keeps its own lightweight bundle. `?view=list` provides a globe-free view.
