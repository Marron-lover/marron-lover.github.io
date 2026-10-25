import { cp, rm, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { validateSnapshot } from "./approved-content.mjs";
const output = path.resolve(process.env.STARMAP_BUILD_OUTDIR || "dist");
const base = (process.env.STARMAP_APPROVED_BASE || "/travel/").replace(
  /^\/+|\/+$/g,
  "",
);
const nested = path.join(output, base, "cesium");
try {
  await cp(nested, path.join(output, "cesium"), { recursive: true });
  await rm(path.join(output, base), { recursive: true });
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await mkdir(path.join(output, "vendor"), { recursive: true });
await cp("../LICENSE", path.join(output, "vendor/StarMap-LICENSE.txt"));
await cp(
  "node_modules/cesium/LICENSE.md",
  path.join(output, "vendor/Cesium-LICENSE.md"),
);
let html = await readFile(path.join(output, "index.html"), "utf8");
html = html
  .replace(
    "<title>StarMap</title>",
    "<title>The World Cabinet — Yinan Feng</title>",
  )
  .replace(
    "</head>",
    '<meta name="description" content="An interactive collection of reviewed travel memories in Bobbie’s Gallery."></head>',
  );
const snapshot = validateSnapshot(
  JSON.parse(
    await readFile(
      path.join(
        process.env.STARMAP_APPROVED_ROOT || "approved-public",
        "snapshot.json",
      ),
      "utf8",
    ),
  ),
);
const escape = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const places = [
  ...snapshot.editorState.addedCountries.map((c) => ({
    name: c.nameEn,
    date: c.visitedDate,
  })),
  ...snapshot.travelMap.records.map((r) => ({
    name: [r.country_en, r.city_en !== r.country_en ? r.city_en : ""]
      .filter(Boolean)
      .join(" / "),
    date: r.start_date,
  })),
];
const fallback =
  '<section style="max-width:720px;margin:10vh auto;padding:24px;font:16px/1.6 Helvetica,Arial,sans-serif;color:#202126"><h1>The World Cabinet</h1><p>A collection of reviewed places and memories.</p><ul>' +
  places
    .map(
      (p) =>
        "<li>" +
        escape(p.name) +
        (p.date ? " · " + escape(p.date) : "") +
        "</li>",
    )
    .join("") +
  '</ul><p><a href="/exhibit/world-cabinet/">Back to Gallery</a></p><noscript><p>This is the accessible static view. Enable JavaScript to explore the globe.</p></noscript></section>';
html = html.replace(
  '<div id="root"></div>',
  '<div id="root">' + fallback + "</div>",
);
await writeFile(path.join(output, "index.html"), html);
for (const filename of await readdir(path.join(output, "assets")))
  if (filename.endsWith(".js")) {
    const text = await readFile(path.join(output, "assets", filename), "utf8");
    if (
      /sample_reykjavik|North Atlantic Demo|__travelatlas\/editor|http:\/\/127\.0\.0\.1|\/Users\//.test(
        text,
      )
    )
      throw new Error(
        "Private/demo/write markers found in approved JavaScript: " + filename,
      );
  }
console.log(
  "Approved build verified: read-only data and correctly based Cesium assets.",
);
