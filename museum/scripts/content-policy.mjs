import { createHash } from "node:crypto";
const fields = {
  projects: new Set(
    "id slug title category status timeRange summary lead role tools contribution problem approach challenges architecture metrics sections results outcome limitations lessons sourceNote confidence exhibit media links".split(
      " ",
    ),
  ),
  notes: new Set("id slug title summary body date tags".split(" ")),
  timeline: new Set(
    "id date year title description kind projectSlug countryCode precision sourceNote".split(
      " ",
    ),
  ),
};
const nested = new Set(
  "id title label value context denominator timeWindow method baseline unit result body type items src alt caption credit url poster width height steps from to inputs outputs description color name detail nodes edges summary date year status sourceNote source before after code text heading paragraphs".split(
    " ",
  ),
);
const privateText =
  /(?:\/Users\/|\/home\/|\/root\/|\/Volumes\/|\/private\/|file:\/\/|localhost|127\.0\.0\.1|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:client_secret|access_token|refresh_token|private_key|gmail_url|message_id|thread_id)\b|\bAIza[\w-]{25,}|\b(?:ghp_|github_pat_|sk-proj-)[\w-]{15,}|<\s*(?:script|iframe|object|embed)\b|javascript:)/i;
const identifier = /^[a-z0-9][a-z0-9-]{0,79}$/;
export const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, canonical(value[k])]),
        )
      : value;
export const digest = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
const exhibitIds = new Set("ai-experiments world-cabinet things-i-built collected-light visual-lab notes-from-elsewhere soundtrack about-me".split(" "));
const object = (v) => v && typeof v === "object" && !Array.isArray(v);
function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Required public text: " + field);
}
function strings(value, field, minimum = 0) {
  if (!Array.isArray(value) || value.length < minimum) throw new Error("Expected public text array: " + field);
  value.forEach((v) => requireText(v, field));
}
function shape(value, keys, field) {
  if (!object(value) || Object.keys(value).some((k) => !keys.includes(k))) throw new Error("Invalid public structure: " + field);
}
function ready(item, group) {
  if (/^untitled(?: project| note| event)?$/i.test(item.title.trim())) throw new Error("Replace the draft title before publication.");
  if (group === "projects") {
    for (const k of "slug title category status timeRange summary lead role problem sourceNote exhibit".split(" ")) requireText(item[k], k);
    if (!identifier.test(item.slug) || !exhibitIds.has(item.exhibit) || !["high", "medium"].includes(item.confidence)) throw new Error("Invalid project route, exhibition or confidence.");
    for (const k of "tools contribution approach challenges results limitations lessons".split(" ")) strings(item[k], k);
    for (const k of ["architecture", "sections", "metrics"]) if (!Array.isArray(item[k]) || (k !== "metrics" && !item[k].length)) throw new Error("Required project structure: " + k);
    item.architecture.forEach((v) => { shape(v, ["title", "description"], "architecture"); requireText(v.title,"architecture.title"); requireText(v.description,"architecture.description"); });
    item.sections.forEach((v) => { shape(v, ["title", "body"], "section"); requireText(v.title,"section.title"); strings(v.body,"section.body",1); });
    item.metrics.forEach((v) => {
      shape(v,["label","value","before","after","unit","context"],"metric"); requireText(v.label,"metric.label");
      for (const k of ["value","unit","context"]) if (k in v) requireText(v[k],"metric."+k);
      for (const k of ["before","after"]) if (k in v && (typeof v[k] !== "number" || !Number.isFinite(v[k]))) throw new Error("Finite metric numbers required.");
      if (!(typeof v.value === "string" && v.value.trim()) && !(typeof v.before === "number" && typeof v.after === "number")) throw new Error("A metric needs a value or a before/after pair.");
    });
    for (const k of ["media","links"]) if (k in item && !Array.isArray(item[k])) throw new Error("Expected public " + k + " array.");
    item.media?.forEach((v) => { shape(v,["src","alt","caption"],"media"); requireText(v.src,"media.src"); requireText(v.alt,"media.alt"); if("caption" in v)requireText(v.caption,"media.caption"); });
    item.links?.forEach((v) => { shape(v,["label","url"],"link"); requireText(v.label,"link.label"); requireText(v.url,"link.url"); });
  } else if (group === "notes") {
    for (const k of ["slug","title","summary","date"]) requireText(item[k],k);
    if(!identifier.test(item.slug)) throw new Error("Valid note slug required.");
    strings(item.body,"note.body",1); strings(item.tags,"note.tags");
  } else {
    for (const k of ["id","title","description","kind"]) requireText(item[k],k);
    if (!identifier.test(item.id) || !["year","month","day"].includes(item.precision)) throw new Error("Valid timeline identity and precision required.");
    if ("date" in item) requireText(item.date,"timeline.date");
    if ("year" in item && (!Number.isInteger(item.year) || item.year < 1000 || item.year > 9999)) throw new Error("Timeline year must contain four digits.");
    if (!item.date && !item.year) throw new Error("Timeline date or year required.");
    if ("countryCode" in item && (typeof item.countryCode !== "string" || !/^[A-Z]{2}$/.test(item.countryCode))) throw new Error("Valid country code required.");
    if ("projectSlug" in item && (typeof item.projectSlug !== "string" || !identifier.test(item.projectSlug))) throw new Error("Valid timeline project slug required.");
    if ("sourceNote" in item) requireText(item.sourceNote,"timeline.sourceNote");
  }
}
export function validateSnapshot(snapshot) {
  if (
    !snapshot ||
    snapshot.schemaVersion !== 1 ||
    Object.keys(snapshot).some(
      (k) =>
        ![
          "schemaVersion",
          "exportedAt",
          "projects",
          "notes",
          "timeline",
        ].includes(k),
    )
  )
    throw new Error("Expected a sanitized Atlas editorial snapshot.");
  const assets = new Set();
  function walk(value, key = "", depth = 0) {
    if (depth > 9)
      throw new Error("Content nesting exceeds the publication budget.");
    if (typeof value === "string") {
      if (
        privateText.test(value) ||
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)
      )
        throw new Error("Private or unsafe content in public text.");
      if (["src", "poster"].includes(key)) {
        if (
          !/^\/media\/approved\/[a-z0-9-]+\.(webp|png|jpg|jpeg|svg|mp4)$/.test(
            value,
          )
        )
          throw new Error("Media must be an approved static asset.");
        assets.add(value);
      }
      if (key === "url") {
        if (value.startsWith("/")) {
          if (
            !/^\/(?:work|exhibit|notes|world|timeline|travel|about|contact|explore)(?:\/[a-z0-9-]+)*\/?$|^\/(?:resume\.pdf|atlas\.html|privacy\.html|terms\.html)$/.test(
              value,
            )
          )
            throw new Error("Unknown public route.");
        } else {
          const u = new URL(value);
          if (
            u.protocol !== "https:" ||
            u.username ||
            u.password ||
            /localhost|\.local$|\.internal$|^(?:10|127|192\.168)\.|^172\.(?:1[6-9]|2\d|3[01])\.|drive\.google\.com|aliyuncs\.com|amazonaws\.com|storage\.googleapis\.com|^\[/.test(
              u.hostname,
            ) ||
            /(?:token|key|secret|signature|credential|auth)=/i.test(u.search)
          )
            throw new Error(
              "Supporting links must be unauthenticated public URLs.",
            );
        }
      }
    } else if (Array.isArray(value)) {
      if (value.length > 250) throw new Error("Content list exceeds budget.");
      value.forEach((v) => walk(v, key, depth + 1));
    } else if (value && typeof value === "object") {
      if (Object.keys(value).some((k) => !nested.has(k)))
        throw new Error("Unknown nested public fields.");
      Object.entries(value).forEach(([k, v]) => walk(v, k, depth + 1));
    } else if (typeof value === "number" && !Number.isFinite(value))
      throw new Error("Public numbers must be finite.");
  }
  for (const group of Object.keys(fields)) {
    if (!Array.isArray(snapshot[group]) || snapshot[group].length > 100)
      throw new Error("Expected a bounded " + group + " array.");
    const seen = new Set();
    for (const item of snapshot[group]) {
      if (!object(item) || Object.keys(item).some((k) => !fields[group].has(k)))
        throw new Error("Unknown fields in " + group + ".");
      const id = item.slug || item.id;
      if (!identifier.test(id) || seen.has(id) || (typeof item.title !== "string" || !item.title.trim()))
        throw new Error("A unique public identity and title are required.");
      seen.add(id);
      ready(item, group);
      Object.entries(item).forEach(([k, v]) => walk(v, k));

    }
  }
  const slugs = new Set(snapshot.projects.map((p) => p.slug));
  for (const t of snapshot.timeline)
    if (t.projectSlug && !slugs.has(t.projectSlug))
      throw new Error("Timeline points to an absent project.");
  return {
    assets: [...assets],
    counts: Object.fromEntries(
      Object.keys(fields).map((k) => [k, snapshot[k].length]),
    ),
    sha256: digest({
      projects: snapshot.projects,
      notes: snapshot.notes,
      timeline: snapshot.timeline,
    }),
  };
}
