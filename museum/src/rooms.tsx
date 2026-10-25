import React, { useState } from "react";
import {
  projects,
  notes,
  timeline,
  flagshipSlugs,
  type Project,
  type Note,
} from "./content";
import "./rooms.css";

type Navigate = (path: string) => void;
const art: Record<string, string> = {
  "ai-experiments": "ai",
  "things-i-built": "built",
  "collected-light": "light",
  "visual-lab": "visual",
  "notes-from-elsewhere": "notes",
  "world-cabinet": "world",
};
export function RoomLink({
  to,
  nav,
  children,
  className = "",
  label,
}: {
  to: string;
  nav: Navigate;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a
      className={className}
      aria-label={label}
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        nav(to);
      }}
    >
      {children}
    </a>
  );
}
export function RoomNav({ nav, current }: { nav: Navigate; current?: string }) {
  return (
    <nav className="room-nav" aria-label="Museum rooms">
      {[
        ["/explore", "Collection"],
        ["/work", "Workshop"],
        ["/world", "World"],
        ["/notes", "Notebook"],
        ["/timeline", "Timeline"],
      ].map(([to, label]) => (
        <RoomLink
          to={to}
          nav={nav}
          key={to}
          className={current === to ? "current" : ""}
        >
          {label}
        </RoomLink>
      ))}
    </nav>
  );
}
function Back({
  nav,
  to = "/explore",
  label = "Collection",
}: {
  nav: Navigate;
  to?: string;
  label?: string;
}) {
  return (
    <RoomLink nav={nav} to={to} className="room-back">
      ← {label}
    </RoomLink>
  );
}
export function WorkIndex({ nav }: { nav: Navigate }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "AI & data", "Research", "Creative & tools"];
  const group=(p:Project)=>['ai-experiments','visual-lab'].includes(p.exhibit)?'AI & data':['pansegai','elsewhere-archive'].includes(p.slug)?'Research':'Creative & tools';
  const ordered = [...projects].sort((a, b) => {
    const ai = flagshipSlugs.indexOf(a.slug),
      bi = flagshipSlugs.indexOf(b.slug);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return (
    <section className="room editorial-room work-index">
      <RoomNav nav={nav} current="/work" />
      <header className="editorial-intro">
        <h1>The things I make.</h1>
        <p>
          Some start with an image. Some start with a question.
          <br />
          These are the systems, experiments and decisions behind the objects.
        </p>
      </header>
      <div className="room-filters" role="group" aria-label="Filter projects">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="work-list">
        {ordered
          .filter((p) => filter === "All" || group(p) === filter)
          .map((p) => (
            <article key={p.slug}>
              <RoomLink nav={nav} to={"/work/" + p.slug} className="work-art" label={"Open "+p.title}>
                <img
                  src={"/assets/" + (art[p.exhibit] || "built") + ".webp"}
                  alt=""
                  loading="lazy"
                  width="300"
                  height="300"
                />
              </RoomLink>
              <div>
                <p className="work-meta">
                  {p.category} · {p.timeRange}
                </p>
                <h2>
                  <RoomLink nav={nav} to={"/work/" + p.slug}>
                    {p.title} <span aria-hidden="true">↗</span>
                  </RoomLink>
                </h2>
                <p>{p.summary}</p>
                <small>{p.status}</small>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
export function Architecture({ project }: { project: Project }) {
  const [active, setActive] = useState(0);
  const steps = project.architecture;
  return (
    <figure className="architecture">
      <figcaption>How it works</figcaption>
      <div
        className="architecture-steps"
        role="group"
        aria-label={project.title + " workflow"}
      >
        {steps.map((step, i) => (
          <React.Fragment key={step.title}>
            <button onClick={() => setActive(i)} aria-pressed={i === active}>
              <span>{step.title}</span>
              <small>{i === active ? "Selected" : "Explore"}</small>
            </button>
            {i < steps.length - 1 && (
              <span className="flow-arrow" aria-hidden="true">
                →
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="architecture-explanation" aria-live="polite">
        {steps[active]?.description}
      </p>
      <details>
        <summary>Read the complete workflow</summary>
        <ol>
          {steps.map((s) => (
            <li key={s.title}>
              <strong>{s.title}.</strong> {s.description}
            </li>
          ))}
        </ol>
      </details>
    </figure>
  );
}
function PansegFigure() {
  const [metric, setMetric] = useState<"dice" | "hd95">("dice");
  const dice = metric === "dice",
    values = dice ? [0.762, 0.7771] : [36.06, 13.33],
    max = dice ? 1 : 40;
  return (
    <figure className="research-figure">
      <figcaption>A closer look at the comparison</figcaption>
      <div
        className="metric-toggle"
        role="group"
        aria-label="Evaluation metric"
      >
        <button aria-pressed={dice} onClick={() => setMetric("dice")}>
          Dice · higher is better
        </button>
        <button aria-pressed={!dice} onClick={() => setMetric("hd95")}>
          HD95 · lower is better
        </button>
      </div>
      <div className="metric-bars">
        {values.map((v, i) => (
          <div key={i}>
            <span>{i ? "Soft Attachment" : "Raw prediction"}</span>
            <div className="metric-track">
              <div style={{ width: (v / max) * 100 + "%" }} />
            </div>
            <strong>
              {dice ? v.toFixed(4) : v.toFixed(2)}
              {!dice ? " mm" : ""}
            </strong>
          </div>
        ))}
      </div>
      <p>
        Frozen 56-case CT comparison · same model predictions · retrospective
        research.
      </p>
      <p className="figure-caveat">
        Averages improved. A safety review also found harmful removal of genuine
        tissue. The research therefore retains a review-first path and calls for
        locked, unseen validation.
      </p>
      <a
        href="/media/approved/panseg-aggregate.svg"
        target="_blank"
        rel="noreferrer"
      >
        Open the aggregate figure ↗
      </a>
    </figure>
  );
}
function RenderFigure() {
  const [revision, setRevision] = useState(false);
  return (
    <figure className="render-figure">
      <figcaption>A revision, without starting over</figcaption>
      <div className="render-proof">
        <strong>25 seconds</strong>
        <span>1920 × 1080 · H.264 · 30 fps</span>
      </div>
      <div
        className="segment-strip"
        aria-label={
          revision
            ? "15 reused segments and one encoded segment"
            : "16 segments in the verified edit"
        }
      >
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className={revision && i === 11 ? "changed" : ""}
            aria-label={
              "Segment " +
              (i + 1) +
              (revision ? (i === 11 ? " encoded" : " reused") : "")
            }
          >
            {i + 1}
          </span>
        ))}
      </div>
      <button className="text-button" onClick={() => setRevision(!revision)}>
        {revision ? "Show the whole edit" : "Inspect the one-field revision"} →
      </button>
      <p>
        {revision
          ? "In the recorded 16-shot revision, 15 segments were reused and one was encoded. The changed field was a shot note."
          : "The selected landscape master passed metadata and full-decode checks. Separate validation also produced a portrait master."}
      </p>
      <p className="figure-caveat">
        This diagram visualizes the recorded segment identities and counts. Cell
        widths are schematic; it contains no private footage or soundtrack.
      </p>
    </figure>
  );
}
function Contribution({ project }: { project: Project }) {
  return (
    <section className="case-contribution">
      <h2>My part in it</h2>
      <p className="case-role">{project.role}</p>
      <ul>
        {project.contribution.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  );
}
export function CaseStudy({
  project,
  nav,
}: {
  project: Project;
  nav: Navigate;
}) {
  return (
    <article className="room editorial-room case-room">
      <RoomNav nav={nav} current="/work" />
      <Back
        nav={nav}
        to={"/exhibit/" + project.exhibit}
        label="Back to the exhibit"
      />
      <header className="case-opening">
        <div>
          <p className="case-meta">
            {project.timeRange} · {project.status}
          </p>
          <h1>{project.title}</h1>
          <p className="case-lead">{project.lead}</p>
          <p>{project.summary}</p>
          <a className="case-jump" href="#case-story">
            Open the case study ↓
          </a>
        </div>
        <img
          src={"/assets/" + (art[project.exhibit] || "built") + ".webp"}
          alt=""
          width="480"
          height="480"
        />
      </header>
      <div id="case-story" className="case-body">
        <section className="case-question">
          <h2>The question</h2>
          <p>{project.problem}</p>
        </section>
        <Architecture project={project} />
        <Contribution project={project} />
        {project.slug === "pansegai" && <PansegFigure />}
        {project.slug === "travel-reel-studio" && <RenderFigure />}
        {project.sections.map((section, i) => (
          <section
            className={"case-story-section section-" + (i % 3)}
            key={section.title}
          >
            <h2>{section.title}</h2>
            <div>
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        {project.media?.map((m) => (
          <figure className="case-media" key={m.src}>
            <>
              {m.src.endsWith(".mp4") ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={m.alt}
                >
                  <source src={m.src} type="video/mp4" />
                </video>
              ) : (
                <a href={m.src} target="_blank" rel="noreferrer">
                  <img src={m.src} alt={m.alt} loading="lazy" />
                </a>
              )}
            </>
            {m.caption && <figcaption>{m.caption}</figcaption>}
          </figure>
        ))}
        {project.metrics.length > 0 && (
          <section className="case-results">
            <h2>What the evidence says</h2>
            <dl>
              {project.metrics.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>
                    {m.value ||
                      (typeof m.before === "number" &&
                      m.label.toLowerCase().includes("dice")
                        ? m.before.toFixed(4)
                        : String(m.before)) +
                        " → " +
                        (typeof m.after === "number" &&
                        m.label.toLowerCase().includes("dice")
                          ? m.after.toFixed(4)
                          : String(m.after)) +
                        (m.unit ? " " + m.unit : "")}
                  </dd>
                  {m.context && <p>{m.context}</p>}
                </div>
              ))}
            </dl>
          </section>
        )}
        <section className="case-takeaways">
          <div>
            <h2>What changed</h2>
            <ul>
              {project.results.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>The edges</h2>
            <ul>
              {project.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </section>
        <section className="case-lessons">
          <h2>What I’m taking forward</h2>
          {project.lessons.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </section>
        <footer className="case-source">
          <p>{project.sourceNote}</p>
          <p className="case-tools">{project.tools.join(" · ")}</p>
          {project.links?.length ? (
            <div className="case-links">
              {project.links.map((l) => (
                <a href={l.url} key={l.url} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </div>
          ) : null}
          <Back nav={nav} to="/work" label="Back to the workshop" />
        </footer>
      </div>
    </article>
  );
}
export function WorldRoom({ nav }: { nav: Navigate }) {
  return (
    <section className="room editorial-room world-room">
      <RoomNav nav={nav} current="/world" />
      <div className="world-opening">
        <div>
          <h1>A place leaves things with you.</h1>
          <p>
            Languages you start hearing differently. Questions you bring home. A
            tiny detail that refuses to leave.
          </p>
          <p>
            I’ve travelled to more than twenty countries. This map grows from
            the places I have confirmed for the collection, one memory at a
            time.
          </p>
          <a className="pill" href="/travel/">
            Explore my travel map →
          </a>
          <RoomLink nav={nav} to="/timeline" className="text-button">
            Follow the timeline →
          </RoomLink>
        </div>
        <img
          src="/assets/world.webp"
          alt="Original globe and suitcase sculpture"
          width="500"
          height="500"
        />
      </div>
      <div className="world-chapter">
        <p>From the cabinet</p>
        <h2>Egypt, July 2025.</h2>
        <p>
          A confirmed country-level footprint. There is room here for the
          photographs and stories I choose to share next.
        </p>
        <a href="/travel/">Find Egypt on the globe ↗</a>
      </div>
      <Back
        nav={nav}
        to="/exhibit/world-cabinet"
        label="Back to the World Cabinet"
      />
    </section>
  );
}
export function NotesRoom({ nav, note }: { nav: Navigate; note?: Note }) {
  return (
    <section className="room editorial-room notes-room">
      <RoomNav nav={nav} current="/notes" />
      {note ? (
        <>
          <Back nav={nav} to="/notes" label="Notebook" />
          <article className="note-reading">
            <p className="note-date">
              {note.date} · {note.tags.join(" / ")}
            </p>
            <h1>{note.title}</h1>
            <p className="note-summary">{note.summary}</p>
            {note.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </article>
        </>
      ) : (
        <>
          <header className="editorial-intro">
            <h1>Things I’m turning over.</h1>
            <p>
              A notebook about images, research, culture, and the way a
              different viewpoint changes the question.
            </p>
          </header>
          <div className="notes-list">
            {notes.map((n) => (
              <article key={n.slug}>
                <p>{n.tags.join(" · ")}</p>
                <h2>
                  <RoomLink nav={nav} to={"/notes/" + n.slug}>
                    {n.title} ↗
                  </RoomLink>
                </h2>
                <p>{n.summary}</p>
              </article>
            ))}
          </div>
          <aside className="notebook-foot">
            <img
              src="/assets/notes.webp"
              alt=""
              loading="lazy"
              width="240"
              height="240"
            />
            <p>
              Part technical notebook, part room for a wandering thought.
              <br />
              The collection is deliberately open-ended.
            </p>
          </aside>
        </>
      )}
    </section>
  );
}
export function TimelineRoom({ nav }: { nav: Navigate }) {
  const [kind, setKind] = useState("All");
  const kinds = ["All", ...new Set(timeline.map((t) => t.kind))];
  return (
    <section className="room editorial-room timeline-room">
      <RoomNav nav={nav} current="/timeline" />
      <header className="editorial-intro">
        <h1>Along the way.</h1>
        <p>Places, studies, and the things taking shape between them.</p>
      </header>
      <div
        className="room-filters"
        role="group"
        aria-label="Timeline categories"
      >
        {kinds.map((k) => (
          <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k}
          </button>
        ))}
      </div>
      <ol className="personal-timeline">
        {timeline
          .filter((t) => kind === "All" || t.kind === kind)
          .map((t) => (
            <li key={t.id}>
              <div className="timeline-date">
                <time>{t.date || t.year}</time>
                <small>{t.kind}</small>
              </div>
              <div>
                <h2>{t.title}</h2>
                <p>{t.description}</p>
                {t.projectSlug && (
                  <RoomLink to={"/work/" + t.projectSlug} nav={nav}>
                    Open the project ↗
                  </RoomLink>
                )}
                {t.countryCode && <a href="/travel/">Find it on the map ↗</a>}
              </div>
            </li>
          ))}
      </ol>
      <p className="timeline-note">
        Study completion is expected in December 2026. “Finishing one semester
        ahead of my original schedule” describes my current plan; formal
        completion follows the university’s confirmation.
      </p>
      <Back nav={nav} to="/about" label="About the collection" />
    </section>
  );
}
