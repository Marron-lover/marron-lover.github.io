import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { exhibits, findExhibit, type Exhibit } from "./data/exhibits";
import { site } from "./data/site.config";
import "./museum.css";
import {
  WorkIndex,
  CaseStudy,
  WorldRoom,
  NotesRoom,
  TimelineRoom,
  RoomLink,
} from "./rooms";
import { projects, findProject, findNote } from "./content";

const cleanPath = () => location.pathname.replace(/\/$/, "") || "/";
const asset = (name: string) => `/assets/${name}.webp`;
type Nav = (path: string, image?: HTMLImageElement | null) => void;
function Arrow({ left = false }: { left?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={left ? "m14 6-6 6 6 6M8 12h12" : "m10 6 6 6-6 6M4 12h12"} />
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}
function Speaker({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5 5 9H2v6h3l5 4V5Z" />
      {on ? (
        <path d="M14 8c3 2 3 6 0 8M17 5c5 4 5 10 0 14" />
      ) : (
        <path d="m15 9 6 6m0-6-6 6" />
      )}
    </svg>
  );
}
function useSound() {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const toggle = () => {
    if (!audio.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      gain.connect(filter);
      filter.connect(ctx.destination);
      [130.81, 196, 293.66].forEach((frequency, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.detune.value = i * 3;
        osc.connect(gain);
        osc.start();
      });
      audio.current = { ctx, gain };
    }
    const a = audio.current;
    a.ctx.resume();
    a.gain.gain.setTargetAtTime(playing ? 0 : 0.045, a.ctx.currentTime, 0.35);
    setPlaying(!playing);
  };
  useEffect(
    () => () => {
      audio.current?.ctx.close();
    },
    [],
  );
  return { playing, toggle };
}
function Footer({
  reduced,
  toggle,
  system,
}: {
  reduced: boolean;
  toggle: () => void;
  system: boolean;
}) {
  return (
    <footer className="footer">
      <div>
        <span>© 2026 Yinan Feng</span>
        <a href={site.cv} target="_blank" rel="noreferrer">
          CV
        </a>
        <a href={`mailto:${site.email}`}>Email</a>
      </div>
      <div>
        <button onClick={toggle} aria-pressed={reduced} disabled={system}>
          {system ? "Reduced motion" : reduced ? "Motion off" : "Motion on"}
        </button>
        <a href={site.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/privacy.html">Privacy</a>
      </div>
    </footer>
  );
}
function Header({
  nav,
  home = false,
  playing,
  toggleSound,
}: {
  nav: Nav;
  home?: boolean;
  playing: boolean;
  toggleSound: () => void;
}) {
  return (
    <header className="header">
      <a
        className="wordmark"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          nav("/");
        }}
      >
        {home ? (
          "Yinan Feng"
        ) : (
          <>
            {site.titleLead} <strong>{site.titleEmphasis}</strong>
          </>
        )}
      </a>
      {!home && (
        <div className="header-actions">
          <button
            className="circle white"
            onClick={toggleSound}
            aria-label={playing ? "Pause gallery sound" : "Play gallery sound"}
            aria-pressed={playing}
          >
            <Speaker on={playing} />
          </button>
          <button
            className="circle blue"
            onClick={() => nav("/")}
            aria-label="Return to landing"
          >
            <Cross />
          </button>
        </div>
      )}
    </header>
  );
}
const positions = [
  { id: "ai", x: 14, y: 47, w: 19, depth: 20 },
  { id: "built", x: 45, y: 0, w: 23, depth: 17 },
  { id: "about", x: 68, y: 20, w: 9, depth: 8 },
  { id: "world", x: 76, y: 77, w: 24, depth: 24 },
  { id: "visual", x: 103, y: 43, w: 20, depth: 25 },
  { id: "notes", x: -3, y: 78, w: 15, depth: 6 },
  { id: "sound", x: 30, y: 96, w: 17, depth: 15 },
];
function Home({ nav, reduced }: { nav: Nav; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (reduced) return;
    const root = ref.current!;
    let move: (e: PointerEvent) => void = () => {};
    let leave: () => void = () => {};
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sculpture-reveal",
        { autoAlpha: 0, scale: 0.86 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1.05,
          stagger: 0.065,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".home-copy > *",
        { y: 10, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: "power2.out",
        },
      );
      root.querySelectorAll(".sculpture-drift").forEach((el, i) =>
        gsap.to(el, {
          y: i % 2 ? 6 : -6,
          duration: 5 + i * 0.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        }),
      );
      if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
        const controls = [
          ...root.querySelectorAll<HTMLElement>(".sculpture-parallax"),
        ].map((el, i) => ({
          x: gsap.quickTo(el, "x", { duration: 0.95, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
          depth: positions[i].depth,
        }));
        move = (e) => {
          const x = (e.clientX / innerWidth) * 2 - 1,
            y = (e.clientY / innerHeight) * 2 - 1;
          controls.forEach((c) => {
            c.x(x * c.depth);
            c.y(y * c.depth);
          });
        };
        leave = () =>
          controls.forEach((c) => {
            c.x(0);
            c.y(0);
          });
        root.addEventListener("pointermove", move);
        root.addEventListener("pointerleave", leave);
      }
    }, root);
    return () => {
      ctx.revert();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);
  return (
    <section
      className="room home"
      ref={ref}
      aria-label={`Welcome to ${site.title}`}
    >
      {positions.map((p, i) => (
        <div
          className={`sculpture-anchor sculpture-${p.id}`}
          key={p.id}
          style={
            {
              "--x": p.x + "%",
              "--y": p.y + "%",
              "--w": p.w + "vw",
            } as React.CSSProperties
          }
        >
          <div className="sculpture-parallax">
            <div className="sculpture-drift">
              <div className="sculpture-reveal">
                <img
                  src={asset(p.id)}
                  alt=""
                  width="1024"
                  height="1024"
                  fetchPriority={i < 4 ? "high" : "auto"}
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="home-copy">
        <h1>
          {site.titleLead} <strong>{site.titleEmphasis}.</strong>
        </h1>
        <p>{site.introduction}</p>
        <button className="pill" onClick={() => nav("/explore")}>
          Enter <Arrow />
        </button>
      </div>
    </section>
  );
}
function Gallery({
  nav,
  active,
  setActive,
  reduced,
}: {
  nav: Nav;
  active: number;
  setActive: (i: number) => void;
  reduced: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const latest = useRef(active);
  const dragging = useRef<{
    x: number;
    scroll: number;
    index: number;
    distance: number;
  } | null>(null);
  const wheelAt = useRef(0);
  const current = exhibits[active];
  const select = (i: number, smooth = true) => {
    i = Math.max(0, Math.min(exhibits.length - 1, i));
    latest.current = i;
    setActive(i);
    const el = rail.current?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    if (el && rail.current)
      rail.current.scrollTo({
        left: el.offsetLeft + el.offsetWidth / 2 - rail.current.clientWidth / 2,
        behavior: smooth && !reduced ? "smooth" : "instant",
      });
  };
  useLayoutEffect(() => {
    select(active, false);
  }, []);
  useEffect(() => {
    const el = rail.current!;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        if (Date.now() - wheelAt.current > 450 && Math.abs(e.deltaY) > 4) {
          wheelAt.current = Date.now();
          select(latest.current + Math.sign(e.deltaY));
        }
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const resize = () => select(latest.current, false);
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);
  const updatePosition = () => {
    const el = rail.current!;
    let best = 0,
      dist = Infinity;
    el.querySelectorAll<HTMLElement>("[data-index]").forEach((card, i) => {
      const d = Math.abs(
        card.offsetLeft +
          card.offsetWidth / 2 -
          el.scrollLeft -
          el.clientWidth / 2,
      );
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    latest.current = best;
    setActive(best);
  };
  const open = (index: number) => {
    const image = rail.current?.querySelector<HTMLImageElement>(
      `[data-index="${index}"] img`,
    );
    latest.current = index;
    setActive(index);
    nav("/exhibit/" + exhibits[index].slug, image);
  };
  return (
    <section className="room gallery">
      <h1 className="sr-only">Explore the collection</h1>
      <div
        className="gallery-rail"
        ref={rail}
        role="region"
        aria-label="Exhibits; swipe or use arrow keys"
        tabIndex={0}
        onScroll={updatePosition}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            select(latest.current + (e.key === "ArrowRight" ? 1 : -1));
            e.currentTarget.focus({ preventScroll: true });
          } else if (e.key === "Home") {
            e.preventDefault();
            select(0);
          } else if (e.key === "End") {
            e.preventDefault();
            select(exhibits.length - 1);
          } else if (e.key === "Enter" && e.target === rail.current) {
            open(latest.current);
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          const card = (e.target as HTMLElement).closest<HTMLElement>(
            "[data-index]",
          );
          dragging.current = {
            x: e.clientX,
            scroll: e.currentTarget.scrollLeft,
            index: card ? Number(card.dataset.index) : -1,
            distance: 0,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.classList.add("dragging");
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          const d = dragging.current;
          if (!d) return;
          d.distance = Math.max(d.distance, Math.abs(e.clientX - d.x));
          e.currentTarget.scrollLeft = d.scroll - (e.clientX - d.x);
        }}
        onPointerUp={(e) => {
          const d = dragging.current;
          if (!d) return;
          dragging.current = null;
          e.currentTarget.classList.remove("dragging");
          e.currentTarget.releasePointerCapture(e.pointerId);
          if (d.distance < 7 && d.index >= 0) open(d.index);
          else select(latest.current);
        }}
        onPointerCancel={() => {
          dragging.current = null;
          rail.current?.classList.remove("dragging");
        }}
      >
        {exhibits.map((exhibit, i) => (
          <article
            className={`exhibit-card ${active === i ? "is-active" : ""}`}
            key={exhibit.slug}
            data-index={i}
            style={
              {
                "--card-color": exhibit.color,
                "--angle": Math.max(-7, Math.min(7, (i - active) * -3)) + "deg",
              } as React.CSSProperties
            }
          >
            <button
              className="card-button"
              aria-label={`View ${exhibit.title}`}
              onClick={(e) => {
                if (e.detail === 0 || !matchMedia("(pointer:fine)").matches)
                  open(i);
              }}
            >
              <span className="card-art">
                <img
                  src={asset(exhibit.asset)}
                  alt={`Original ${exhibit.title.toLowerCase()} sculpture`}
                  loading={Math.abs(i - active) < 3 ? "eager" : "lazy"}
                  data-art={exhibit.asset}
                  width="1024"
                  height="1024"
                  draggable="false"
                />
                <span className="card-plus" aria-hidden="true">
                  +
                </span>
              </span>
              <span className="card-caption">
                <span>{exhibit.title}</span>
                <small>{exhibit.category}</small>
              </span>
            </button>
          </article>
        ))}
      </div>
      <button
        className="circle gallery-arrow previous"
        onClick={() => select(latest.current - 1)}
        aria-label="Previous exhibit"
        disabled={active === 0}
      >
        <Arrow left />
      </button>
      <button
        className="circle gallery-arrow next"
        onClick={() => select(latest.current + 1)}
        aria-label="Next exhibit"
        disabled={active === exhibits.length - 1}
      >
        <Arrow />
      </button>
      <div className="gallery-bottom">
        <div className="gallery-current" aria-live="polite">
          <span>
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(exhibits.length).padStart(2, "0")}
          </span>
          <strong>{current.title}</strong>
        </div>
        <button className="about-stone" onClick={() => nav("/about")}>
          About
        </button>
        <span className="browse-hint">Drag to explore</span>
      </div>
    </section>
  );
}
function Pipeline() {
  const [index, setIndex] = useState(0);
  const stages = [
    [
      "Collect",
      "Resumable collection keeps the workflow moving when sources change.",
    ],
    [
      "Filter",
      "Quality checks identify material that is useful for the intended task.",
    ],
    [
      "Deduplicate",
      "Perceptual comparisons identify visually repeated material.",
    ],
    [
      "Review",
      "Vision-language screening, coverage checks and review samples support classification.",
    ],
    [
      "Store",
      "Cloud storage and stage tracking connect records to their workflow state.",
    ],
  ];
  return (
    <div className="pipeline-study">
      <div role="group" aria-label="Explore the visual pipeline">
        {stages.map(([title], i) => (
          <button
            key={title}
            className={i === index ? "selected" : ""}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {title}
          </button>
        ))}
      </div>
      <p aria-live="polite">{stages[index][1]}</p>
    </div>
  );
}
function Detail({
  exhibit,
  nav,
  playing,
  toggleSound,
  reduced,
}: {
  exhibit: Exhibit;
  nav: Nav;
  playing: boolean;
  toggleSound: () => void;
  reduced: boolean;
}) {
  const [more, setMore] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const i = exhibits.indexOf(exhibit);
  useEffect(() => {
    if (more)
      document.getElementById("exhibit-information")?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "start",
      });
  }, [more]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLAnchorElement
      )
        return;
      if (e.key === "ArrowLeft")
        nav(
          "/exhibit/" +
            exhibits[(i + exhibits.length - 1) % exhibits.length].slug,
        );
      if (e.key === "ArrowRight")
        nav("/exhibit/" + exhibits[(i + 1) % exhibits.length].slug);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i]);
  return (
    <section className="room detail">
      <div className="detail-hero">
        <button
          className="text-button detail-back"
          onClick={() => nav("/explore", image.current)}
        >
          <Arrow left /> Collection
        </button>
        <div
          className="detail-stage"
          style={{ "--exhibit-color": exhibit.color } as React.CSSProperties}
        >
          <div className="plinth" />
          <img
            className="detail-art"
            ref={image}
            data-art={exhibit.asset}
            src={asset(exhibit.asset)}
            alt={`Original sculptural interpretation of ${exhibit.title}`}
            width="1024"
            height="1024"
          />
        </div>
        <div className="detail-caption">
          <span className="detail-meta">
            {exhibit.category} <span>{exhibit.year}</span>
          </span>
          <h1>{exhibit.title}</h1>
          <p>{exhibit.oneLiner}</p>
          <div className="detail-actions">
            {exhibit.destination &&
              (exhibit.destination.path === "/travel/" ? (
                <a className="pill" href="/travel/">
                  {exhibit.destination.label} →
                </a>
              ) : (
                <RoomLink
                  className="pill"
                  to={exhibit.destination.path}
                  nav={nav}
                >
                  {exhibit.destination.label} →
                </RoomLink>
              ))}
            {exhibit.interaction === "sound" && (
              <button className="pill" onClick={toggleSound}>
                {playing ? "Pause sound" : "Play sound"}
                <Speaker on={playing} />
              </button>
            )}
            <button
              className="text-button"
              aria-expanded={more}
              aria-controls="exhibit-information"
              onClick={() => setMore(!more)}
            >
              {more ? "Less" : "More"}{" "}
              <span aria-hidden="true">{more ? "−" : "+"}</span>
            </button>
          </div>
        </div>
        <div className="detail-pagination">
          <button
            className="circle white"
            aria-label="Previous exhibit"
            onClick={() =>
              nav(
                "/exhibit/" +
                  exhibits[(i + exhibits.length - 1) % exhibits.length].slug,
              )
            }
          >
            <Arrow left />
          </button>
          <button
            className="circle white"
            aria-label="Next exhibit"
            onClick={() =>
              nav("/exhibit/" + exhibits[(i + 1) % exhibits.length].slug)
            }
          >
            <Arrow />
          </button>
        </div>
      </div>
      {more && (
        <div className="exhibit-more" id="exhibit-information">
          <h2>Inside the exhibit</h2>
          {exhibit.description.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {exhibit.media?.map((item) => (
            <figure className="exhibit-media" key={item.src}>
              <img src={item.src} alt={item.alt} loading="lazy" />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
          {exhibit.facts && (
            <dl className="exhibit-facts">
              {exhibit.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {exhibit.slug === "things-i-built" && (
            <p className="source-note">
              PanSegAI figures are from a retrospective 56-case CT evaluation,
              raw prediction versus Soft Attachment.
            </p>
          )}
          {exhibit.interaction === "pipeline" && <Pipeline />}
          {projects.some((p) => p.exhibit === exhibit.slug) && (
            <div
              className="exhibit-destinations"
              aria-label="Project case studies"
            >
              {projects
                .filter((p) => p.exhibit === exhibit.slug)
                .map((p) => (
                  <RoomLink key={p.slug} to={"/work/" + p.slug} nav={nav}>
                    {p.title} ↗
                  </RoomLink>
                ))}
            </div>
          )}
          {exhibit.slug === "world-cabinet" && (
            <div className="exhibit-destinations">
              <RoomLink to="/world" nav={nav}>
                Places and stories ↗
              </RoomLink>
              <RoomLink to="/timeline" nav={nav}>
                Along the way ↗
              </RoomLink>
            </div>
          )}
          {exhibit.links && (
            <div className="exhibit-links">
              {exhibit.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
          <p className="source-note">
            Original digital sculpture created for this collection.
          </p>
        </div>
      )}
    </section>
  );
}
function About({ nav }: { nav: Nav }) {
  return (
    <section className="room about">
      <button
        className="text-button about-back"
        onClick={() => nav("/explore")}
      >
        <Arrow left /> Collection
      </button>
      <div className="about-layout">
        <div className="about-sculpture">
          <img
            src={asset("about")}
            alt="Original green sculptural collectible"
            width="1024"
            height="1024"
          />
        </div>
        <div className="about-copy">
          <span className="about-label">About the collection</span>
          <h1>
            Ideas to keep.
            <br />
            Things to make.
          </h1>
          {site.about.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <p>{site.education}</p>
          <h2>Selected work</h2>
          <div className="selected-work">
            {exhibits
              .filter((e) =>
                [
                  "ai-experiments",
                  "things-i-built",
                  "collected-light",
                  "notes-from-elsewhere",
                ].includes(e.slug),
              )
              .map((e) => (
                <a
                  key={e.slug}
                  href={"/exhibit/" + e.slug}
                  onClick={(event) => {
                    event.preventDefault();
                    nav("/exhibit/" + e.slug);
                  }}
                >
                  {e.title}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
          </div>
          <div className="about-rooms">
            <RoomLink to="/work" nav={nav}>
              The workshop ↗
            </RoomLink>
            <RoomLink to="/world" nav={nav}>
              Places ↗
            </RoomLink>
            <RoomLink to="/notes" nav={nav}>
              Notebook ↗
            </RoomLink>
            <RoomLink to="/timeline" nav={nav}>
              Timeline ↗
            </RoomLink>
          </div>
          <div className="about-contact">
            <a className="pill" href={site.cv} target="_blank" rel="noreferrer">
              View CV <Arrow />
            </a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
function App() {
  const [path, setPath] = useState(cleanPath);
  const [active, setActive] = useState(2);
  const [systemReduced, setSystemReduced] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [manualReduced, setManualReduced] = useState(() => {
    try {
      return localStorage.getItem("museum-reduced-motion") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("museum-reduced-motion", String(manualReduced));
    } catch {}
  }, [manualReduced]);
  const reduced = systemReduced || manualReduced;
  const sound = useSound();
  const busy = useRef(false);
  const ghost = useRef<HTMLImageElement | null>(null);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const exhibit = path.startsWith("/exhibit/")
    ? findExhibit(path.split("/")[2])
    : undefined;
  useEffect(() => {
    if (exhibit) setActive(exhibits.indexOf(exhibit));
  }, [exhibit]);
  const project = path.startsWith("/work/")
    ? findProject(path.split("/")[2])
    : undefined;
  const note = path.startsWith("/notes/")
    ? findNote(path.split("/")[2])
    : undefined;
  const isWork = path === "/work";
  const isWorld = path === "/world";
  const isNotes = path === "/notes" || !!note;
  const isTimeline = path === "/timeline";
  const isHome = path === "/";
  const isGallery = path === "/explore";
  const isAbout = ["/about", "/contact"].includes(path);
  const navigate: Nav = (next, image) => {
    if (busy.current || next === path) return;
    busy.current = true;
    if (image && !reduced) {
      const box = image.getBoundingClientRect();
      const clone = image.cloneNode() as HTMLImageElement;
      clone.className = "transition-ghost";
      clone.removeAttribute("data-art");
      Object.assign(clone.style, {
        left: box.left + "px",
        top: box.top + "px",
        width: box.width + "px",
        height: box.height + "px",
      });
      document.body.appendChild(clone);
      ghost.current = clone;
    }
    const change = () => {
      history.pushState({}, "", next);
      setPath(next);
      window.scrollTo(0, 0);
    };
    if (reduced) change();
    else {
      const tl = gsap.timeline({ onComplete: change });
      transition.current = tl;
      if (isHome)
        tl.to(".home-copy", { autoAlpha: 0, y: -8, duration: 0.22 }).to(
          ".sculpture-reveal",
          {
            x: (i: number) => (i % 2 ? 1 : -1) * innerWidth * 0.06,
            autoAlpha: 0,
            scale: 0.93,
            duration: 0.45,
            stagger: 0.025,
          },
          0,
        );
      else tl.to(".room", { autoAlpha: 0, duration: 0.2 });
    }
  };
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(mq.matches);
    mq.addEventListener("change", change);
    const pop = () => {
      transition.current?.kill();
      busy.current = false;
      ghost.current?.remove();
      ghost.current = null;
      setPath(cleanPath());
      window.scrollTo(0, 0);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (project) navigate("/exhibit/" + project.exhibit);
        else if (note) navigate("/notes");
        else if (isWorld) navigate("/exhibit/world-cabinet");
        else if (isTimeline) navigate("/about");
        else if (exhibit) navigate("/explore");
        else if (!isHome) navigate("/");
      }
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("keydown", escape);
    return () => {
      mq.removeEventListener("change", change);
      window.removeEventListener("popstate", pop);
      window.removeEventListener("keydown", escape);
    };
  }, [path, reduced]);
  useLayoutEffect(() => {
    const title =
      project?.title ||
      note?.title ||
      (isWork
        ? "The workshop"
        : isWorld
          ? "The World Cabinet"
          : isNotes
            ? "The notebook"
            : isTimeline
              ? "Along the way"
              : undefined) ||
      exhibit?.title ||
      (isGallery
        ? "The collection"
        : isAbout
          ? "About the collection"
          : site.title);
    document.title = title + " — Yinan Feng";
    setAnnouncement(title);
    (isGallery
      ? document.querySelector<HTMLElement>(".gallery-rail")
      : document.getElementById("main")
    )?.focus({ preventScroll: true });
    const clone = ghost.current;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(".room", { autoAlpha: 1 });
        clone?.remove();
        ghost.current = null;
        busy.current = false;
        return;
      }
      gsap.fromTo(
        ".room",
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.45,
          ease: "power2.out",
          onComplete: () => {
            if (!clone) busy.current = false;
          },
        },
      );
      if (clone) {
        const slug = clone
          .getAttribute("src")
          ?.split("/")
          .pop()
          ?.replace(".webp", "");
        const target = document.querySelector<HTMLImageElement>(
          `[data-art="${slug}"]`,
        );
        if (target) {
          const rect = target.getBoundingClientRect(),
            from = clone.getBoundingClientRect();
          gsap.set(target, { autoAlpha: 0 });
          gsap.to(clone, {
            x: rect.left - from.left,
            y: rect.top - from.top,
            scaleX: rect.width / from.width,
            scaleY: rect.height / from.height,
            transformOrigin: "0 0",
            duration: 0.8,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.set(target, { autoAlpha: 1 });
              clone.remove();
              ghost.current = null;
              busy.current = false;
            },
          });
        } else {
          clone.remove();
          ghost.current = null;
          busy.current = false;
        }
      }
      if (isGallery)
        gsap.fromTo(
          ".exhibit-card",
          { y: 12, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.65,
            stagger: 0.035,
            ease: "power3.out",
          },
        );
    });
    return () => {
      ctx.revert();
      clone?.remove();
    };
  }, [path, reduced]);
  return (
    <div
      className={`museum ${isHome ? "is-home" : isGallery ? "is-gallery" : exhibit ? "is-detail" : "is-about"}`}
      data-reduced={reduced}
    >
      <a className="skip" href="#main">
        Skip to collection
      </a>
      <Header
        nav={navigate}
        home={isHome}
        playing={sound.playing}
        toggleSound={sound.toggle}
      />
      <main id="main" tabIndex={-1}>
        {isHome ? (
          <Home nav={navigate} reduced={reduced} />
        ) : isGallery ? (
          <Gallery
            nav={navigate}
            active={active}
            setActive={setActive}
            reduced={reduced}
          />
        ) : exhibit ? (
          <Detail
            key={exhibit.slug}
            exhibit={exhibit}
            nav={navigate}
            reduced={reduced}
            playing={sound.playing}
            toggleSound={sound.toggle}
          />
        ) : project ? (
          <CaseStudy key={project.slug} project={project} nav={navigate} />
        ) : isWork ? (
          <WorkIndex nav={navigate} />
        ) : isWorld ? (
          <WorldRoom nav={navigate} />
        ) : isNotes ? (
          <NotesRoom key={path} note={note} nav={navigate} />
        ) : isTimeline ? (
          <TimelineRoom nav={navigate} />
        ) : isAbout ? (
          <About nav={navigate} />
        ) : (
          <section className="room missing">
            <h1>This room is elsewhere.</h1>
            <button className="pill" onClick={() => navigate("/explore")}>
              Return to the collection
            </button>
          </section>
        )}
      </main>
      <Footer
        reduced={reduced}
        toggle={() => setManualReduced((v) => !v)}
        system={systemReduced}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
