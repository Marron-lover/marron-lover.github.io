import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readReview, saveReview, exportApproved } from "./approved-content.mjs";
const exec = promisify(execFile),
  webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePrefix="/__travelatlas/fixture/";
const prefix = "/__travelatlas/review",
  previewPrefix = "/__travelatlas/preview/";
const json = (res, status, value) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(value));
};
const local = (req) => {
  const address = req.socket.remoteAddress || "";
  return (
    (address === "::1" ||
      address === "127.0.0.1" ||
      address.startsWith("::ffff:127.")) &&
    /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || "")
  );
};
const authorized = (req) =>
  local(req) &&
  req.headers["x-travelatlas-local-editor"] === "1" &&
  req.headers.origin === `http://${req.headers.host}`;
const body = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw Error("Review request exceeds 1MB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
};
const html = String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Travel publication review — Atlas</title><style>*{box-sizing:border-box}body{margin:0;background:#f8f8f9;color:#202126;font:16px/1.5 'Helvetica Neue',Arial,sans-serif}header,main{max-width:1060px;margin:auto;padding:30px 24px}header{display:flex;align-items:center;gap:22px;flex-wrap:wrap}a{color:#247beb}h1{font-size:34px;line-height:1.1;font-weight:500;letter-spacing:-1px}h2{font-size:25px;font-weight:500}h3{margin:0 0 10px;font-size:20px;font-weight:500}p{max-width:720px}button{font:inherit;cursor:pointer;border:0;border-radius:30px;padding:11px 18px;background:#3d91f7;color:white}button:disabled{opacity:.5;cursor:wait}button.secondary{background:#e8edf5;color:#202126}.actions{position:sticky;top:0;background:#f8f8f9;padding:18px 0;z-index:2;display:flex;gap:12px;flex-wrap:wrap}.record{padding:26px;margin:24px 0;background:white}.fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}label{display:block;margin:12px 0;font-size:14px}input[type=text],textarea,select{display:block;margin-top:7px;width:100%;font:inherit;color:inherit;background:#f1f2f4;border:1px solid #dfe1e5;border-radius:5px;padding:10px}textarea{min-height:100px;resize:vertical}input[type=checkbox]{width:18px;height:18px;vertical-align:middle;margin-right:9px;accent-color:#3d91f7}.approval{background:#eaf2ff;padding:14px}small{color:#656872}.photo{width:220px;height:180px;object-fit:contain;background:#f1f2f4}#notice{min-height:30px}#report{white-space:pre-wrap;overflow-wrap:anywhere;background:#e8edf5;padding:20px}#report:empty{display:none}details{margin:15px 0}summary{cursor:pointer;color:#247beb}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #247beb;outline-offset:3px}@media(max-width:600px){.fields{grid-template-columns:1fr}.record{padding:20px}.actions{top:0}h1{font-size:29px}}</style></head><body><header><a href="/">← Local travel editor</a><span>Atlas / Private editorial workspace</span></header><main><h1>Travel, ready to share.</h1><p>Add countries, cities and photographs in the existing map editor. Use this room to confirm the visit and choose the exact words and pictures that may appear publicly. Original media and source metadata stay in your private library.</p><div class="actions"><button id="save" class="secondary">Save review</button><button id="preview">Preview public map</button><button id="export">Export approved</button><button id="dry" class="secondary">Dry run</button></div><p id="notice" role="status" aria-live="polite">Loading private records…</p><pre id="report"></pre><h2>Visits and places</h2><div id="records"></div><h2>Photographs</h2><p>Approve an individual photo after inspecting it. Only photos connected to an approved city visit are exported. The export creates WebP copies and removes embedded metadata.</p><div id="media"></div><p><a href="/">Return to the local map editor</a></p></main><script>
let state; const endpoint='/__travelatlas/review';const headers={'content-type':'application/json','x-travelatlas-local-editor':'1'};const notice=document.getElementById('notice'),report=document.getElementById('report');
function element(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el}
function check(parent,label,key,value){const l=element('label');const i=element('input');i.type='checkbox';i.dataset.key=key;i.checked=!!value;l.append(i,document.createTextNode(label));parent.append(l);return i}
function field(parent,label,key,value,tag='input'){const l=element('label',label);const i=element(tag);if(tag==='input')i.type='text';i.dataset.key=key;i.value=value||'';l.append(i);parent.append(l);return i}
function collect(){const records={},media={};for(const card of document.querySelectorAll('[data-record]')){const row={};for(const input of card.querySelectorAll('[data-key]'))row[input.dataset.key]=input.type==='checkbox'?input.checked:input.value;row.publicApproved=row.approve;row.reviewed=row.approve;row.disclosurePermission=row.approve;records[card.dataset.record]=row}for(const card of document.querySelectorAll('[data-media]')){const row={};for(const input of card.querySelectorAll('[data-key]'))row[input.dataset.key]=input.type==='checkbox'?input.checked:input.value;row.publicApproved=row.approve;row.reviewed=row.approve;media[card.dataset.media]=row}return {records,media}}
function render(){const records=document.getElementById('records');records.replaceChildren();const places=[...(state.travelMap.records||[]).map(r=>({...r,key:r.id})),...(state.editorState.addedCountries||[]).map(r=>({...r,key:'country:'+r.id,country_en:r.nameEn,country_code:r.countryCode}))];if(!places.length)records.append(element('p','Your private travel collection is ready for its first place. Add a country in the map editor, then return here.'));for(const place of places){const row=state.review.records?.[place.key]||{};const card=element('section',undefined,'record');card.dataset.record=place.key;card.append(element('h3',[place.country_en,place.city_en||place.city].filter(Boolean).join(' / ')),element('small','Country code: '+(place.country_code||'Choose the country again in the editor')));check(card,'I confirm this is the correct country and place.', 'countryConfirmed',row.countryConfirmed);const fields=element('div',undefined,'fields');const l=element('label','My relationship to this place');const select=element('select');select.dataset.key='status';for(const [value,label]of [['visited','Visited'],['lived','Lived'],['wishlist','Wishlist — separate from visited count']]){const o=element('option',label);o.value=value;select.append(o)}select.value=row.status||'visited';l.append(select);fields.append(l);field(fields,'Public title','title',row.title);card.append(fields);field(card,'Public story — only the words in this box are shared','story',row.story,'textarea');field(card,'Tags (optional)','tags',row.tags);if(place.city_en||place.city)check(card,'Publish this city and its approximate location (rounded to about 1 km).','publishCity',row.publishCity);check(card,'Publish the dates below. Leave this unchecked when dates are private or unknown.','publicDates',row.publicDates);const dates=element('div',undefined,'fields');field(dates,'From — YYYY, YYYY-MM or YYYY-MM-DD','from',row.from);field(dates,'To (optional)','to',row.to);card.append(dates);const approval=element('div',undefined,'approval');check(approval,'I reviewed this visit and text and approve their public disclosure.','approve',row.publicApproved&&row.reviewed&&row.disclosurePermission);card.append(approval);records.append(card)}const media=document.getElementById('media');media.replaceChildren();if(!state.mediaCatalog.items?.length)media.append(element('p','Add your own photographs from a city’s photo controls. Unreviewed images remain private.'));for(const item of state.mediaCatalog.items||[]){const row=state.review.media?.[item.id]||{};const card=element('section',undefined,'record');card.dataset.media=item.id;card.append(element('h3',(item.cityName||'Photograph')+' — '+item.kind));const img=element('img',undefined,'photo');img.src=item.variants?.thumb?.src||item.src;img.alt='Private preview to review';img.loading='lazy';card.append(img);field(card,'Factual description (required for a published photo)','alt',row.alt);field(card,'Public caption','caption',row.caption,'textarea');check(card,'I own this image or have permission to publish it, including permission for identifiable people.','rightsConfirmed',row.rightsConfirmed);check(card,'I inspected this picture and approve it for public sharing.','approve',row.publicApproved&&row.reviewed);media.append(card)}}
async function request(action){document.querySelectorAll('button').forEach(b=>b.disabled=true);notice.textContent='Saving your review…';report.textContent='';try{let r=await fetch(endpoint+'/state',{method:'PUT',headers,body:JSON.stringify(collect())});let data=await r.json();if(!r.ok)throw Error(data.error||'Could not save review.');state=data.state;if(action==='save'){notice.textContent='Review saved locally.';return}notice.textContent=action==='preview'?'Building your reviewed map preview…':'Checking approved content…';r=await fetch(endpoint+'/'+action,{method:'POST',headers,body:'{}'});data=await r.json();if(!r.ok)throw Error(data.error||'Export failed.');notice.textContent=action==='dry'?'Dry run complete.':action==='preview'?'Reviewed preview is ready.':'Approved public snapshot exported. Publish it through the Gallery workflow.';report.textContent=JSON.stringify(data.summary,null,2);if(data.url){const a=element('a','Open reviewed map preview →');a.href=data.url;a.target='_blank';a.rel='noreferrer';report.append(document.createTextNode('\n'),a)}}catch(e){notice.textContent=e.message}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
for(const action of ['save','preview','export','dry'])document.getElementById(action).onclick=()=>request(action);fetch(endpoint+'/state',{cache:'no-store'}).then(r=>r.json()).then(data=>{state=data.state;render();notice.textContent='Private review loaded. Only explicit approvals enter the public snapshot.'}).catch(e=>notice.textContent=e.message);
</script></body></html>`;
export function travelReviewEditor({ profile, privateRoot }) {
  let busy = false;
  const previewRoot = path.join(privateRoot, "preview-build"),
    approvedRoot = path.join(privateRoot, "approved-public"),
    previewData = path.join(privateRoot, "preview-public");
  return {
    name: "starmap-publication-review",
    configureServer(server) {
      if (profile !== "personal") return;
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://127.0.0.1");
        if (/^\/exhibit\/world-cabinet\/?$/.test(url.pathname)) {if(!local(req)){res.statusCode=403;return res.end()}const origin=new URL(process.env.STARMAP_GALLERY_ORIGIN||'http://127.0.0.1:8950').origin;res.statusCode=302;res.setHeader('Location',origin+'/exhibit/world-cabinet/');res.end();return}
        if (
          url.pathname.startsWith(previewPrefix) || url.pathname.startsWith(fixturePrefix) ||
          url.pathname.startsWith("/travel/media/")
        ) {
          if (!local(req)) {
            res.statusCode = 403;
            return res.end();
          }
          let relative = url.pathname.startsWith("/travel/media/")
            ? "media/" + url.pathname.slice("/travel/media/".length)
            : url.pathname.slice(url.pathname.startsWith(fixturePrefix)?fixturePrefix.length:previewPrefix.length);
          if (!relative || relative.endsWith("/")) relative += "index.html";
          const servedRoot = url.pathname.startsWith(fixturePrefix) ? path.join(privateRoot,'fixture-build') : previewRoot;
          const file = path.resolve(servedRoot, relative);
          if (!file.startsWith(path.resolve(servedRoot) + path.sep)) {
            res.statusCode = 403;
            return res.end();
          }
          try {
            if (!(await stat(file)).isFile()) throw Error("Missing");
            const types = {
              ".html": "text/html; charset=utf-8",
              ".js": "application/javascript",
              ".css": "text/css",
              ".json": "application/json",
              ".webp": "image/webp",
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".svg": "image/svg+xml",
              ".wasm": "application/wasm",
              ".xml": "application/xml",
            };
            res.setHeader(
              "Content-Type",
              types[path.extname(file)] || "application/octet-stream",
            );
            res.setHeader("Cache-Control", "no-store");
            res.end(await readFile(file));
          } catch {
            res.statusCode = 404;
            res.end(
              "Create a reviewed preview from the publication screen first.",
            );
          }
          return;
        }
        if (!url.pathname.startsWith(prefix)) return next();
        if (!local(req))
          return json(res, 403, { error: "Loopback access required." });
        try {
          if (
            req.method === "GET" &&
            (url.pathname === prefix || url.pathname === prefix + "/")
          ) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            return res.end(html);
          }
          if (req.method === "GET" && url.pathname === prefix + "/state")
            return json(res, 200, { state: await readReview(privateRoot) });
          if (!authorized(req))
            return json(res, 403, {
              error: "Same-origin local editor confirmation required.",
            });
          if (req.method === "PUT" && url.pathname === prefix + "/state")
            return json(res, 200, {
              state: await saveReview(privateRoot, await body(req)),
            });
          if (
            req.method === "POST" &&
            ["export", "dry", "preview"].some(
              (a) => url.pathname === prefix + "/" + a,
            )
          ) {
            if (busy)
              return json(res, 409, {
                error: "A preview/export is already running.",
              });
            busy = true;
            try {
              const action = url.pathname.slice(prefix.length + 1);
              const result = await exportApproved({
                privateRoot,
                outputRoot: action === "preview" ? previewData : approvedRoot,
                dryRun: action === "dry",
              });
              if (action === "preview") {
                await exec(
                  process.platform === "win32" ? "npm.cmd" : "npm",
                  ["run", "build:approved"],
                  {
                    cwd: webRoot,
                    env: {
                      ...process.env,
                      NODE_ENV: "production",
                      STARMAP_APPROVED_ROOT: previewData,
                      STARMAP_BUILD_OUTDIR: previewRoot,
                      STARMAP_APPROVED_BASE: previewPrefix,
                    },
                    maxBuffer: 1024 * 1024,
                  },
                );
                return json(res, 200, {
                  summary: result.summary,
                  url: previewPrefix,
                });
              }
              return json(res, 200, {
                summary: result.summary,
                changes: result.changes,
              });
            } finally {
              busy = false;
            }
          }
          return json(res, 404, { error: "Unknown review operation." });
        } catch (e) {
          return json(res, 400, { error: e.message });
        }
      });
    },
  };
}
