import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { validateSnapshot } from "./content-policy.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(
  readFileSync(resolve(root, "src/content/editorial.snapshot.json"), "utf8"),
);
const result = validateSnapshot(snapshot),
  receipt = JSON.parse(
    readFileSync(resolve(root, "src/content/review-receipt.json"), "utf8"),
  );
if (receipt.reviewed !== true || receipt.contentSha256 !== result.sha256)
  throw new Error(
    "Public content changed. Review and export the exact revision in Atlas before building.",
  );
for (const src of result.assets) {
  const entry = receipt.media.find((m) => m.src === src),
    file = resolve(root, "public", src.slice(1));
  if (
    !entry ||
    !existsSync(file) ||
    entry.sha256 !==
      createHash("sha256").update(readFileSync(file)).digest("hex")
  )
    throw new Error("A reviewed media asset changed: " + src);
}
console.log("Reviewed content check passed: " + JSON.stringify(result.counts));

const mediaReceipt=JSON.parse(readFileSync(resolve(root,'src/content/asset-receipt.json'),'utf8'));
const mediaRoot=resolve(root,'public/media/approved');
const actual=readdirSync(mediaRoot);
if(actual.length!==mediaReceipt.assets.length)throw new Error('Approved media directory contains unreviewed or missing files.');
for(const item of mediaReceipt.assets){
 const file=resolve(root,'public',item.src.slice(1));
 if(item.reviewed!==true||item.rights!=='owner-approved'||!existsSync(file))throw new Error('Asset requires an explicit review receipt.');
 const bytes=readFileSync(file);
 if(bytes.length>8_000_000||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error('Reviewed asset changed: '+item.src);
 if(item.src.endsWith('.svg')&&/<script|foreignObject|onload=|href=["'](?:https?:|file:)/i.test(bytes.toString()))throw new Error('SVG contains active or external content.');
}
console.log('Approved media integrity check passed: '+actual.length+' files.');
