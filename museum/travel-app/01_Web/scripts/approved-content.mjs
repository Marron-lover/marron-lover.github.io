import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rename,
  realpath,
  stat,
} from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import worldCountries from "world-countries";
import { getPrivatePaths } from "./private-profile.mjs";
const virtualId = "virtual:starmap-private-data",
  resolved = "\0" + virtualId;
const emptyEditor = {
  schemaVersion: 1,
  addedCountries: [],
  countryOrder: [],
  hiddenCountryIds: [],
  cityOrderByCountry: {},
  hiddenCityIds: [],
  mediaOrderByCity: {},
  hiddenMediaIds: [],
  coverMediaByCity: {},
  droneOrderByCity: {},
  hiddenDroneMediaIds: [],
};
export const emptySnapshot = () => ({
  schemaVersion: 1,
  visibility: "public",
  reviewed: true,
  travelMap: {
    schema_version: 1,
    generated_at: "",
    privacy_level: "reviewed-public",
    records: [],
  },
  editorState: structuredClone(emptyEditor),
  mediaCatalog: { schemaVersion: 2, items: [] },
  wishlist: [],
});
const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
};
const atomicWrite = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await copyFile(file, file + ".bak");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const temp = file + ".tmp";
  await writeFile(temp, JSON.stringify(data, null, 2) + "\n");
  await rename(temp, file);
};
const cleanText = (value, max = 5000) => {
  const text = String(value ?? "")
    .trim()
    .slice(0, max);
  if (
    /(?:\/Users\/|file:\/\/|127\.0\.0\.1|localhost|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]|(?:oss|s3):\/\/)/i.test(
      text,
    )
  )
    throw new Error(
      "Public text contains a private location, contact address or credential marker.",
    );
  return text;
};
const slug = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
const countries = new Map(
  worldCountries.filter((c) => c.cca2).map((c) => [c.cca2, c]),
);
const approved = (row) =>
  row?.publicApproved === true &&
  row?.reviewed === true &&
  row?.disclosurePermission === true &&
  row?.countryConfirmed === true;
const validDate = (value) => {
  if (!value) return "";
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value))
    throw new Error("Use a year, month, or ISO date for public dates.");
  const [year, month, day] = value.split("-").map(Number);
  if (
    year < 1900 ||
    year > 2100 ||
    (month !== undefined && (month < 1 || month > 12)) ||
    (day !== undefined &&
      (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()))
  )
    throw new Error("Public date is outside the calendar.");
  return value;
};
export async function readReview(privateRoot) {
  const p = getPrivatePaths({ STARMAP_PRIVATE_ROOT: privateRoot });
  const [travelMap, editorState, mediaCatalog, review] = await Promise.all([
    readJson(p.localTravelMapPath, { schema_version: 1, records: [] }),
    readJson(p.editorStatePath, emptyEditor),
    readJson(p.mediaCatalogPath, { schemaVersion: 2, items: [] }),
    readJson(path.join(p.dataRoot, "publication-review.local.json"), {
      schemaVersion: 1,
      records: {},
      media: {},
    }),
  ]);
  return { travelMap, editorState, mediaCatalog, review };
}
export async function saveReview(privateRoot, body) {
  const data = await readReview(privateRoot);
  const entries = {};
  for (const [id, row] of Object.entries(body.records ?? {})) {
    if (!/^[\p{L}\p{N}_.:-]{1,200}$/u.test(id))
      throw new Error("Invalid record identifier.");
    entries[id] = {
      countryConfirmed: row.countryConfirmed === true,
      publicApproved: row.publicApproved === true,
      reviewed: row.reviewed === true,
      disclosurePermission: row.disclosurePermission === true,
      status: ["visited", "lived", "wishlist"].includes(row.status)
        ? row.status
        : "visited",
      title: cleanText(row.title, 200),
      story: cleanText(row.story),
      tags: cleanText(row.tags, 300),
      publicDates: row.publicDates === true,
      from: validDate(row.from),
      to: validDate(row.to),
      publishCity: row.publishCity === true,
    };
  }
  const media = {};
  for (const [id, row] of Object.entries(body.media ?? {})) {
    media[id] = {
      publicApproved: row.publicApproved === true,
      reviewed: row.reviewed === true,
      rightsConfirmed: row.rightsConfirmed === true,
      alt: cleanText(row.alt, 500),
      caption: cleanText(row.caption, 1000),
    };
  }
  const review = {
    schemaVersion: 1,
    records: entries,
    media,
    updatedAt: new Date().toISOString(),
  };
  await atomicWrite(
    path.join(
      getPrivatePaths({ STARMAP_PRIVATE_ROOT: privateRoot }).dataRoot,
      "publication-review.local.json",
    ),
    review,
  );
  return { ...data, review };
}
function publicCountry(record, row) {
  const code = String(
    record.country_code ?? record.countryCode ?? "",
  ).toUpperCase();
  const c = countries.get(code);
  if (!c)
    throw new Error(
      "Choose and confirm a valid ISO country code before export.",
    );
  return {
    code,
    c,
    id: slug(c.name.common),
    date: row.publicDates ? validDate(row.from) : "",
  };
}
export async function exportApproved({
  privateRoot,
  outputRoot,
  dryRun = false,
}) {
  const p = getPrivatePaths({ STARMAP_PRIVATE_ROOT: privateRoot });
  const { travelMap, editorState, mediaCatalog, review } =
    await readReview(privateRoot);
  const snapshot = emptySnapshot();
  const cityIds = new Set();
  const allowedCountries = new Set();
  const changes = [];
  for (const record of travelMap.records ?? []) {
    const row = review.records?.[record.id];
    if (!approved(row)) continue;
    const { code, c, id, date } = publicCountry(record, row);
    if (row.status === "wishlist") {
      snapshot.wishlist.push({
        id: record.id,
        countryCode: code,
        countryName: c.name.common,
        story: cleanText(row.story),
      });
      continue;
    }
    allowedCountries.add(id);
    const city = row.publishCity
      ? cleanText(record.city_en || record.city, 150)
      : "";
    if (
      city &&
      (!Number.isFinite(record.lat) ||
        !Number.isFinite(record.lng) ||
        record.lat === null ||
        record.lng === null ||
        Math.abs(record.lat) > 90 ||
        Math.abs(record.lng) > 180)
    )
      throw new Error("Confirm city coordinates in the local editor.");
    if (city) cityIds.add(id + "__" + slug(city));
    const from = date,
      to = row.publicDates ? validDate(row.to) : "";
    snapshot.travelMap.records.push({
      id: cleanText(record.id, 200),
      country: c.translations?.zho?.common || c.name.common,
      country_en: c.name.common,
      country_code: code.toLowerCase(),
      city: city ? cleanText(record.city || city, 150) : c.name.common,
      city_en: city || c.name.common,
      start_date: from,
      ...(to ? { end_date: to } : {}),
      ...(from ? { year: Number(from.slice(0, 4)) } : {}),
      trip_title: cleanText(row.title || "A visit to " + c.name.common, 200),
      notes: cleanText(row.story),
      region: c.region || "",
      type: "visit",
      status: row.status,
      lat: city
        ? Math.round(Number(record.lat) * 100) / 100
        : Number(c.latlng[0]),
      lng: city
        ? Math.round(Number(record.lng) * 100) / 100
        : Number(c.latlng[1]),
      travelCategory: "destination",
      journeyId: "visit-" + cleanText(record.id, 200),
    });
    changes.push({
      kind: "visit",
      id: record.id,
      country: code,
      city: city || undefined,
    });
  }
  for (const record of editorState.addedCountries ?? []) {
    const key = "country:" + record.id;
    const row = review.records?.[key];
    if (!approved(row)) continue;
    const { code, c, id, date } = publicCountry(record, row);
    if (row.status === "wishlist") {
      snapshot.wishlist.push({
        id: key,
        countryCode: code,
        countryName: c.name.common,
        story: cleanText(row.story),
      });
      continue;
    }
    if (allowedCountries.has(id)) continue;
    allowedCountries.add(id);
    snapshot.editorState.addedCountries.push({
      id,
      nameZh: c.translations?.zho?.common || c.name.common,
      nameEn: c.name.common,
      countryCode: code,
      centerLat: Number(c.latlng[0]),
      centerLng: Number(c.latlng[1]),
      region: c.region || "",
      visitedDate: date,
      status: row.status,
      story: cleanText(row.story),
    });
    changes.push({ kind: "country", id: key, country: code });
  }
  let bytes = 0;
  const writes = [];
  for (const item of mediaCatalog.items ?? []) {
    const row = review.media?.[item.id];
    if (
      !(
        row?.publicApproved === true &&
        row?.reviewed === true &&
        row?.rightsConfirmed === true
      )
    )
      continue;
    if (item.kind !== "photo" || !cityIds.has(item.cityId))
      throw new Error(
        "Approve the matching visit with its city before publishing an ordinary photo.",
      );
    if (!row.alt)
      throw new Error("Every public photo needs a factual alt description.");
    const src = item.variants?.original?.src || item.src;
    if (!src?.startsWith("/media/user/") || src.includes(".."))
      throw new Error(
        "Media source must be inside the private imported library.",
      );
    const physical = await realpath(path.join(p.root, src.slice(1)));
    const mediaRoot = await realpath(p.userMediaRoot);
    if (!physical.startsWith(mediaRoot + path.sep))
      throw new Error(
        "Media source resolves outside the private imported library.",
      );
    if ((await stat(physical)).size > 60 * 1024 * 1024)
      throw new Error("Review a smaller source photo (60MB limit).");
    const id = crypto
      .createHash("sha256")
      .update(await readFile(physical))
      .digest("hex")
      .slice(0, 20);
    const thumb = await sharp(physical)
      .rotate()
      .resize({
        width: 640,
        height: 640,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer();
    const preview = await sharp(physical)
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    for (const buffer of [thumb, preview]) {
      const meta = await sharp(buffer).metadata();
      if (meta.exif || meta.xmp || meta.iptc)
        throw new Error("Metadata survived photo export.");
    }
    bytes += thumb.length + preview.length;
    if (bytes > 25 * 1024 * 1024)
      throw new Error("Approved media exceeds the 25MB snapshot budget.");
    const publicSrc = "/travel/media/" + id + "-preview.webp";
    const thumbSrc = "/travel/media/" + id + "-thumb.webp";
    const dimensions = await sharp(preview).metadata();
    snapshot.mediaCatalog.items.push({
      id,
      kind: "photo",
      scope: "city",
      countryId: item.countryId,
      countryName: cleanText(item.countryName, 150),
      cityId: item.cityId,
      cityName: cleanText(item.cityName, 150),
      src: publicSrc,
      width: dimensions.width,
      height: dimensions.height,
      variants: {
        thumb: { src: thumbSrc },
        preview: { src: publicSrc },
        original: { src: publicSrc },
      },
      originalFileName: "Reviewed photograph",
      titleEn: cleanText(row.alt, 500),
      description: cleanText(row.caption, 1000),
      isCover: !!item.isCover,
      status: "ready",
    });
    writes.push([id + "-thumb.webp", thumb], [id + "-preview.webp", preview]);
    changes.push({
      kind: "photo",
      id: item.id,
      bytes: thumb.length + preview.length,
    });
  }
  snapshot.editorState.countryOrder = (editorState.countryOrder ?? []).filter(
    (id) => allowedCountries.has(id),
  );
  snapshot.travelMap.generated_at = new Date().toISOString().slice(0, 10);
  validateSnapshot(snapshot);
  if (!dryRun) {
    await mkdir(path.join(outputRoot, "media"), { recursive: true });
    for (const [name, buffer] of writes)
      await writeFile(path.join(outputRoot, "media", name), buffer);
    await atomicWrite(path.join(outputRoot, "snapshot.json"), snapshot);
  }
  return {
    snapshot,
    changes,
    summary: {
      countries: allowedCountries.size,
      visits: snapshot.travelMap.records.length,
      wishlist: snapshot.wishlist.length,
      photos: snapshot.mediaCatalog.items.length,
      mediaBytes: bytes,
    },
    dryRun,
  };
}
const onlyKeys = (object, allowed, label) => {
  if (!object || typeof object !== "object" || Array.isArray(object))
    throw new Error("Invalid " + label);
  for (const key of Object.keys(object))
    if (!allowed.includes(key))
      throw new Error("Unallowlisted " + label + " field: " + key);
};
const mediaFiles = (snapshot) => [
  ...new Set(
    snapshot.mediaCatalog.items
      .flatMap((item) => [
        item.src,
        ...Object.values(item.variants || {}).map((v) => v.src),
      ])
      .map((src) => {
        if (!/^\/travel\/media\/[a-f0-9]{20}-(thumb|preview)\.webp$/.test(src))
          throw new Error("Invalid public media URL.");
        return path.basename(src);
      }),
  ),
];
export async function copyApprovedMedia(snapshot, sourceRoot, destination) {
  await mkdir(destination, { recursive: true });
  for (const filename of mediaFiles(snapshot)) {
    const source = path.join(sourceRoot, "media", filename);
    const metadata = await sharp(source).metadata();
    if (metadata.exif || metadata.xmp || metadata.iptc)
      throw new Error("Public media contains embedded private metadata.");
    await copyFile(source, path.join(destination, filename));
  }
}
export function validateSnapshot(snapshot) {
  if (
    snapshot?.schemaVersion !== 1 ||
    snapshot.visibility !== "public" ||
    snapshot.reviewed !== true ||
    !Array.isArray(snapshot.travelMap?.records) ||
    !Array.isArray(snapshot.mediaCatalog?.items)
  )
    throw new Error("Only an explicit reviewed-public snapshot can be built.");
  const allowedTop = new Set([
    "schemaVersion",
    "visibility",
    "reviewed",
    "travelMap",
    "editorState",
    "mediaCatalog",
    "wishlist",
    "testingFixture",
  ]);
  if(snapshot.testingFixture && process.env.STARMAP_LOCAL_FIXTURE !== '1')throw new Error('Local test fixtures are excluded from production builds.');
  allowedTop.add('testingFixture');
  for (const key of Object.keys(snapshot))
    if (!allowedTop.has(key))
      throw new Error("Unallowlisted snapshot field: " + key);
  onlyKeys(
    snapshot.travelMap,
    ["schema_version", "generated_at", "privacy_level", "records"],
    "travelMap",
  );
  onlyKeys(snapshot.editorState, Object.keys(emptyEditor), "editorState");
  for (const c of snapshot.editorState.addedCountries || [])
    onlyKeys(
      c,
      [
        "id",
        "nameZh",
        "nameEn",
        "countryCode",
        "centerLat",
        "centerLng",
        "region",
        "visitedDate",
        "status",
        "story",
      ],
      "country",
    );
  onlyKeys(snapshot.mediaCatalog, ["schemaVersion", "items"], "mediaCatalog");
  for (const item of snapshot.mediaCatalog.items) {
    onlyKeys(
      item,
      [
        "id",
        "kind",
        "scope",
        "countryId",
        "countryName",
        "cityId",
        "cityName",
        "src",
        "width",
        "height",
        "variants",
        "originalFileName",
        "titleEn",
        "description",
        "isCover",
        "status",
      ],
      "media",
    );
    onlyKeys(
      item.variants || {},
      ["thumb", "preview", "original"],
      "media variants",
    );
    for (const variant of Object.values(item.variants || {}))
      onlyKeys(variant, ["src", "width", "height"], "media variant");
  }
  for (const wish of snapshot.wishlist || [])
    onlyKeys(wish, ["id", "countryCode", "countryName", "story"], "wishlist");
  mediaFiles(snapshot);
  const text = JSON.stringify(snapshot);
  if (
    /(?:\/Users\/|file:\/\/|127\.0\.0\.1|localhost|(?:access_token|refresh_token|client_secret|password)\s*[":=]|(?:oss|s3):\/\/|sample_reykjavik|North Atlantic Demo|\/media\/user\/)/i.test(
      text,
    )
  )
    throw new Error("Private/source/demo markers detected in public snapshot.");
  for (const r of snapshot.travelMap.records) {
    for (const key of Object.keys(r))
      if (
        ![
          "id",
          "country",
          "country_en",
          "country_code",
          "city",
          "city_en",
          "start_date",
          "end_date",
          "year",
          "trip_title",
          "notes",
          "region",
          "type",
          "status",
          "lat",
          "lng",
          "travelCategory",
          "journeyId",
        ].includes(key)
      )
        throw new Error("Unallowlisted travel field: " + key);
    if (!countries.has(String(r.country_code).toUpperCase()))
      throw new Error("Unconfirmed country code.");
  }
  return snapshot;
}
export function approvedTravelContent({ approvedRoot }) {
  return {
    name: "starmap-reviewed-content",
    resolveId(id) {
      if (id === virtualId) return resolved;
    },
    async load(id) {
      if (id !== resolved) return;
      const snapshot = validateSnapshot(
        await readJson(path.join(approvedRoot, "snapshot.json"), null),
      );
      return `export const privateTravelMap=${JSON.stringify({ ...snapshot.travelMap, wishlist: snapshot.wishlist })};export const privateEditorState=${JSON.stringify(snapshot.editorState)};export const privateMediaCatalog=${JSON.stringify(snapshot.mediaCatalog).replaceAll('/travel/media/',(process.env.STARMAP_APPROVED_BASE||'/travel/')+'media/')};`;
    },
    async configureServer(server) {
      server.middlewares.use("/travel/media", async (req, res, next) => {
        try {
          const name = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname,
          ).replace(/^\//, "");
          if (!/^[a-f0-9]{20}-(thumb|preview)\.webp$/.test(name)) return next();
          const snapshot = validateSnapshot(
            await readJson(path.join(approvedRoot, "snapshot.json"), null),
          );
          if (!mediaFiles(snapshot).includes(name)) {
            res.statusCode = 404;
            return res.end();
          }
          res.setHeader("Content-Type", "image/webp");
          res.end(await readFile(path.join(approvedRoot, "media", name)));
        } catch {
          res.statusCode = 404;
          res.end();
        }
      });
    },
    async closeBundle() {
      const snapshot = validateSnapshot(
        await readJson(path.join(approvedRoot, "snapshot.json"), null),
      );
      const output = process.env.STARMAP_BUILD_OUTDIR || "dist";
      if (snapshot.mediaCatalog.items.length)
        await copyApprovedMedia(
          snapshot,
          approvedRoot,
          path.join(output, "media"),
        );
      await writeFile(
        path.join(output, "published-travel.json"),
        JSON.stringify(snapshot, null, 2) + "\n",
      );
    },
  };
}
