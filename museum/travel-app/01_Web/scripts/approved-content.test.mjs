import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  readReview,
  saveReview,
  exportApproved,
  validateSnapshot,
  emptySnapshot,
  copyApprovedMedia,
} from "./approved-content.mjs";
const write = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value));
};
const fixture = async () => {
  const root = await mkdtemp(path.join(tmpdir(), "starmap-publication-test-"));
  const record = {
    id: "test-visit",
    country: "埃及",
    country_en: "Egypt",
    country_code: "EG",
    city: "开罗",
    city_en: "Cairo",
    start_date: "2025-07-01",
    lat: 30.0444,
    lng: 31.2357,
    status: "visited",
    notes: "PRIVATE ORIGINAL NOTE",
    source: "PRIVATE SOURCE",
  };
  await write(path.join(root, "data/travel-map.local.json"), {
    schema_version: 1,
    records: [record],
  });
  return root;
};
const approvedRow = {
  countryConfirmed: true,
  publicApproved: true,
  reviewed: true,
  disclosurePermission: true,
  status: "visited",
  title: "Local test fixture",
  story: "A test story for the publication pipeline.",
  tags: "",
  publicDates: true,
  from: "2025-07",
  to: "",
  publishCity: true,
};
test("unreviewed private record exports no places or private source text", async () => {
  const root = await fixture();
  try {
    const result = await exportApproved({
      privateRoot: root,
      outputRoot: path.join(root, "output"),
    });
    assert.equal(result.summary.countries, 0);
    assert.equal(result.summary.visits, 0);
    assert(!JSON.stringify(result.snapshot).includes("PRIVATE"));
  } finally {
    await rm(root, { recursive: true });
  }
});
test("approval gates require all four explicit decisions", async () => {
  const root = await fixture();
  try {
    for (const key of [
      "countryConfirmed",
      "publicApproved",
      "reviewed",
      "disclosurePermission",
    ]) {
      await saveReview(root, {
        records: { "test-visit": { ...approvedRow, [key]: false } },
      });
      assert.equal(
        (
          await exportApproved({
            privateRoot: root,
            outputRoot: path.join(root, "out"),
            dryRun: true,
          })
        ).summary.visits,
        0,
      );
    }
  } finally {
    await rm(root, { recursive: true });
  }
});
test("approved records publish only reviewed prose, dates preserve month precision and coordinates are rounded", async () => {
  const root = await fixture();
  try {
    await saveReview(root, { records: { "test-visit": approvedRow } });
    const result = await exportApproved({
      privateRoot: root,
      outputRoot: path.join(root, "out"),
    });
    const r = result.snapshot.travelMap.records[0];
    assert.equal(r.start_date, "2025-07");
    assert.equal(r.lat, 30.04);
    assert.equal(r.lng, 31.24);
    assert(!("source" in r));
    assert(!JSON.stringify(result.snapshot).includes("PRIVATE ORIGINAL"));
    assert.equal(r.notes, approvedRow.story);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(root, "out/snapshot.json"))),
      result.snapshot,
    );
  } finally {
    await rm(root, { recursive: true });
  }
});
test("wishlist does not enter visited-country count or map records", async () => {
  const root = await fixture();
  try {
    await saveReview(root, {
      records: { "test-visit": { ...approvedRow, status: "wishlist" } },
    });
    const result = await exportApproved({
      privateRoot: root,
      outputRoot: path.join(root, "out"),
      dryRun: true,
    });
    assert.equal(result.summary.countries, 0);
    assert.equal(result.summary.wishlist, 1);
    assert.equal(result.snapshot.travelMap.records.length, 0);
  } finally {
    await rm(root, { recursive: true });
  }
});
test("approved ordinary photo uses sanitized derivatives and omits EXIF, source filename and exact GPS", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "media/user"), { recursive: true });
    const source = path.join(root, "media/user/private-original.jpg");
    await sharp({
      create: { width: 60, height: 40, channels: 3, background: "#3d91f7" },
    })
      .jpeg()
      .withExif({
        IFD0: {
          ImageDescription: "PRIVATE_TEST_PHOTO",
          Artist: "PRIVATE_TEST_NAME",
        },
      })
      .toFile(source);
    assert((await sharp(source).metadata()).exif);
    await write(path.join(root, "data/user-media.local.json"), {
      schemaVersion: 2,
      items: [
        {
          id: "photo-test",
          kind: "photo",
          scope: "city",
          countryId: "egypt",
          countryName: "Egypt",
          cityId: "egypt__cairo",
          cityName: "Cairo",
          src: "/media/user/private-original.jpg",
          originalFileName: "PRIVATE_NAME.jpg",
          position: { lat: 30.044444444, lng: 31.235777777 },
          isCover: true,
          status: "ready",
        },
      ],
    });
    await saveReview(root, {
      records: { "test-visit": approvedRow },
      media: {
        "photo-test": {
          publicApproved: true,
          reviewed: true,
          rightsConfirmed: true,
          alt: "Blue test fixture",
          caption: "Local testing only.",
        },
      },
    });
    const result = await exportApproved({
      privateRoot: root,
      outputRoot: path.join(root, "out"),
    });
    assert.equal(result.summary.photos, 1);
    const item = result.snapshot.mediaCatalog.items[0];
    assert.equal(item.originalFileName, "Reviewed photograph");
    assert(!("position" in item));
    assert(!JSON.stringify(item).includes("PRIVATE"));
    for (const variant of ["thumb", "preview"]) {
      const filename = path.basename(item.variants[variant].src);
      const metadata = await sharp(
        path.join(root, "out/media", filename),
      ).metadata();
      assert.equal(metadata.exif, undefined);
      assert.equal(metadata.xmp, undefined);
      assert.equal(metadata.iptc, undefined);
    }
  } finally {
    await rm(root, { recursive: true });
  }
});
test("photo publication requires individual rights and matching city approval", async () => {
  const root = await fixture();
  try {
    await write(path.join(root, "data/user-media.local.json"), {
      schemaVersion: 2,
      items: [{ id: "photo-test", kind: "photo", cityId: "egypt__cairo" }],
    });
    await saveReview(root, {
      records: { "test-visit": approvedRow },
      media: {
        "photo-test": {
          publicApproved: true,
          reviewed: true,
          rightsConfirmed: false,
          alt: "Test fixture",
        },
      },
    });
    assert.equal(
      (
        await exportApproved({
          privateRoot: root,
          outputRoot: path.join(root, "out"),
          dryRun: true,
        })
      ).summary.photos,
      0,
    );
    await saveReview(root, {
      records: { "test-visit": { ...approvedRow, publishCity: false } },
      media: {
        "photo-test": {
          publicApproved: true,
          reviewed: true,
          rightsConfirmed: true,
          alt: "Test fixture",
        },
      },
    });
    await assert.rejects(
      exportApproved({ privateRoot: root, outputRoot: path.join(root, "out") }),
      /matching visit/,
    );
  } finally {
    await rm(root, { recursive: true });
  }
});
test("public validator rejects private paths, sample fallback and unallowlisted root fields", () => {
  for (const marker of [
    "/Users/private/file",
    "sample_reykjavik",
    "North Atlantic Demo",
  ]) {
    const s = emptySnapshot();
    s.travelMap.records = [{ country_code: "EG", notes: marker }];
    assert.throws(() => validateSnapshot(s));
  }
  const s = emptySnapshot();
  s.credentials = { secret: "x" };
  assert.throws(() => validateSnapshot(s), /Unallowlisted/);
});
test("dry run reports reviewed changes while writing no snapshot", async () => {
  const root = await fixture();
  try {
    await saveReview(root, { records: { "test-visit": approvedRow } });
    const result = await exportApproved({
      privateRoot: root,
      outputRoot: path.join(root, "out"),
      dryRun: true,
    });
    assert.equal(result.summary.visits, 1);
    await assert.rejects(readFile(path.join(root, "out/snapshot.json")), {
      code: "ENOENT",
    });
    assert.equal(
      (await readReview(root)).travelMap.records[0].notes,
      "PRIVATE ORIGINAL NOTE",
    );
  } finally {
    await rm(root, { recursive: true });
  }
});

test("repeated exports keep isolated editor state and exclude revoked country approvals", async () => {
  const root = await fixture();
  try {
    await write(path.join(root, "data/editor-state.local.json"), {
      schemaVersion: 1,
      addedCountries: [
        {
          id: "egypt",
          countryCode: "EG",
          nameEn: "Egypt",
          nameZh: "埃及",
          centerLat: 27,
          centerLng: 30,
        },
      ],
      countryOrder: [],
    });
    await saveReview(root, { records: { "country:egypt": approvedRow } });
    assert.equal(
      (
        await exportApproved({
          privateRoot: root,
          outputRoot: path.join(root, "out"),
          dryRun: true,
        })
      ).snapshot.editorState.addedCountries.length,
      1,
    );
    await saveReview(root, { records: {} });
    assert.equal(
      (
        await exportApproved({
          privateRoot: root,
          outputRoot: path.join(root, "out"),
          dryRun: true,
        })
      ).snapshot.editorState.addedCountries.length,
      0,
    );
  } finally {
    await rm(root, { recursive: true });
  }
});

test('normal production validation rejects a local UI fixture',()=>{const snapshot=emptySnapshot();snapshot.testingFixture=true;assert.throws(()=>validateSnapshot(snapshot),/excluded from production/)});
test('a revoked photo file is excluded from copied public assets',async()=>{const root=await mkdtemp(path.join(tmpdir(),'starmap-revocation-test-'));try{await mkdir(path.join(root,'source/media'),{recursive:true});await writeFile(path.join(root,'source/media/previously-reviewed.webp'),'old content');await copyApprovedMedia(emptySnapshot(),path.join(root,'source'),path.join(root,'public-media'));assert.deepEqual(await readdir(path.join(root,'public-media')),[])}finally{await rm(root,{recursive:true})}});
