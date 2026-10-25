import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { validateSnapshot } from "./content-policy.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2),
  source = args.find((a) => a !== "--apply");
if (!source)
  throw new Error(
    "Pass the reviewed Atlas export JSON path. Default is a dry run; add --apply to import.",
  );
const snapshot = JSON.parse(readFileSync(resolve(source), "utf8")),
  result = validateSnapshot(snapshot);
const assetReceipt = result.assets.map((src) => {
  const file = resolve(root, "public", src.slice(1));
  if (!existsSync(file))
    throw new Error(
      "Approved media has not been added to the public asset directory: " + src,
    );
  const bytes = readFileSync(file);
  if (bytes.length > 8_000_000)
    throw new Error("An approved asset exceeds the 8 MB budget.");
  return {
    src,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
});
const target = resolve(root, "src/content/editorial.snapshot.json");
const old = existsSync(target)
  ? JSON.parse(readFileSync(target, "utf8"))
  : null;
const index = (x) =>
  new Map(
    ["projects", "notes", "timeline"].flatMap((g) =>
      (x?.[g] || []).map((p) => [
        g + "/" + (p.slug || p.id),
        JSON.stringify(p),
      ]),
    ),
  );
const before = index(old),
  after = index(snapshot),
  diff = {
    added: [...after.keys()].filter((k) => !before.has(k)),
    changed: [...after.keys()].filter(
      (k) => before.has(k) && before.get(k) !== after.get(k),
    ),
    removed: [...before.keys()].filter((k) => !after.has(k)),
  };
console.log(
  JSON.stringify(
    {
      mode: args.includes("--apply") ? "import" : "dry-run",
      ...result,
      diff,
      media: assetReceipt,
    },
    null,
    2,
  ),
);
if (args.includes("--apply")) {
  writeFileSync(target, JSON.stringify(snapshot, null, 2) + "\n");
  writeFileSync(
    resolve(root, "src/content/review-receipt.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        reviewed: true,
        source: "Atlas reviewed editorial export",
        contentSha256: result.sha256,
        counts: result.counts,
        media: assetReceipt,
      },
      null,
      2,
    ) + "\n",
  );
}
