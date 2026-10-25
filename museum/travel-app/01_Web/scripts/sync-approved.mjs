import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSnapshot, copyApprovedMedia } from "./approved-content.mjs";
const index = process.argv.indexOf("--source");
if (index < 0 || !process.argv[index + 1])
  throw new Error(
    "Provide --source pointing to an exported approved-public snapshot folder.",
  );
const source = path.resolve(process.argv[index + 1]);
const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(web, "approved-public");
const snapshot = validateSnapshot(
  JSON.parse(await readFile(path.join(source, "snapshot.json"), "utf8")),
);
await mkdir(destination, { recursive: true });
await rm(path.join(destination, "media"), { recursive: true, force: true });
if (snapshot.mediaCatalog.items.length)
  await copyApprovedMedia(snapshot, source, path.join(destination, "media"));
await writeFile(
  path.join(destination, "snapshot.json"),
  JSON.stringify(snapshot, null, 2) + "\n",
);
console.log(
  "Synced reviewed snapshot:",
  snapshot.editorState.addedCountries.length,
  "country entries,",
  snapshot.travelMap.records.length,
  "visits,",
  snapshot.mediaCatalog.items.length,
  "photos.",
);
