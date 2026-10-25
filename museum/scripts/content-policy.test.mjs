import test from "node:test";
import assert from "node:assert/strict";
import { validateSnapshot } from "./content-policy.mjs";
const snapshot = () => ({
  schemaVersion: 1,
  projects: [],
  notes: [
    {
      slug: "a-note",
      title: "A note",
      summary: "Public thought",
      body: ["A source-backed observation."],
      date: "2026-10-25",
      tags: ["Research"],
    },
  ],
  timeline: [],
});
const project = () => ({
  slug:"test-project",title:"A verified project",category:"Research",status:"Research prototype",timeRange:"2026",summary:"A measured study.",lead:"A source-backed study.",role:"Contributor",problem:"An observed problem.",sourceNote:"Reviewed report.",exhibit:"ai-experiments",confidence:"high",
  tools:["Python"],contribution:["Implemented evaluation."],approach:[],challenges:[],results:[],limitations:[],lessons:[],architecture:[{title:"Evaluate",description:"Compare the fixed cohort."}],sections:[{title:"Evidence",body:["An inspected report."]}],metrics:[]
});
test("accepts a limited public snapshot", () =>
  assert.deepEqual(validateSnapshot(snapshot()).counts, {
    projects: 0,
    notes: 1,
    timeline: 0,
  }));
test("excludes source evidence and raw mail fields", () => {
  for (const key of ["evidencePaths", "messages", "credentials", "private"]) {
    const s = snapshot();
    s.notes[0][key] = [];
    assert.throws(() => validateSnapshot(s));
  }
});
test("rejects machine paths and credentials in text", () => {
  for (const text of [
    ["", "Users", "owner", "private.txt"].join("/"),
    "refresh_token = hidden",
    "https://localhost/private",
  ]) {
    const s = snapshot();
    s.notes[0].body = [text];
    assert.throws(() => validateSnapshot(s));
  }
});
test("rejects script-bearing prose", () => {
  const s = snapshot();
  s.notes[0].body = ["<script>alert(1)</script>"];
  assert.throws(() => validateSnapshot(s));
});
test("rejects a private storage supporting link", () => {
  const s = snapshot();
  s.projects = [{...project(),links:[{label:"Original",url:"https://drive.google.com/private-file"}]}];
  assert.throws(() => validateSnapshot(s));
});
test("rejects unreviewed image namespaces and traversal", () => {
  for (const src of ["/private/photo.jpg", "/media/approved/../photo.jpg"]) {
    const s = snapshot();
    s.projects = [{...project(),media:[{src,alt:"Image"}]}];
    assert.throws(() => validateSnapshot(s));
  }
});
test("requires real timeline destinations", () => {
  const s = snapshot();
  s.timeline = [{ id: "missing", title: "Project", description:"An event",kind:"Making",precision:"month",date:"2026-10",projectSlug: "absent" }];
  assert.throws(() => validateSnapshot(s));
});
test("rejects duplicate identities", () => {
  const s = snapshot();
  s.notes.push({ ...s.notes[0] });
  assert.throws(() => validateSnapshot(s));
});

test("accepts a renderer-ready project and display-date timeline", () => {
  const s=snapshot();s.projects=[project()];s.timeline=[{id:"study",title:"Study",description:"Expected completion",kind:"Study",precision:"month",date:"Expected 2026-12",projectSlug:"test-project"}];
  assert.equal(validateSnapshot(s).counts.projects,1);
});
test("requires complete project structures before publication", () => {
  for(const key of ["tools","architecture","sections","metrics","exhibit","confidence","timeRange"]) {
    const s=snapshot();const p=project();delete p[key];s.projects=[p];assert.throws(()=>validateSnapshot(s),key);
  }
});
test("rejects malformed nested data and incomplete metric pairs", () => {
  for(const patch of [{architecture:[]},{sections:[{title:"Evidence",body:[]}]},{tools:[null]},{metrics:[{label:"Dice",before:.76}]},{metrics:[{label:"Dice",before:".76",after:.77}]},{media:[{src:"/media/approved/image.webp"}]},{links:[{label:"Evidence"}]}]){
    const s=snapshot();s.projects=[{...project(),...patch}];assert.throws(()=>validateSnapshot(s));
  }
});
test("rejects partial notes, placeholders and timeline precision", () => {
  for(const patch of [{body:[]},{tags:"Research"},{title:"Untitled note"},{date:null}]){const s=snapshot();Object.assign(s.notes[0],patch);assert.throws(()=>validateSnapshot(s));}
  for(const patch of [{precision:"approximate"},{year:26},{countryCode:"egypt"},{countryCode:["EG"]},{date:null}]){const s=snapshot();s.timeline=[{id:"trip",title:"A trip",description:"A confirmed visit",kind:"Places",precision:"month",date:"2025-07",...patch}];assert.throws(()=>validateSnapshot(s));}
});
