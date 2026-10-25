import snapshot from "./editorial.snapshot.json";

export type Metric = {
  label: string;
  value?: string;
  before?: number;
  after?: number;
  unit?: string;
  context?: string;
};
export type PublicMedia = { src: string; alt: string; caption?: string };
export type Project = {
  slug: string;
  title: string;
  category: string;
  status: string;
  timeRange: string;
  summary: string;
  lead: string;
  role: string;
  tools: string[];
  contribution: string[];
  problem: string;
  approach: string[];
  challenges: string[];
  architecture: { title: string; description: string }[];
  metrics: Metric[];
  sections: { title: string; body: string[] }[];
  results: string[];
  limitations: string[];
  lessons: string[];
  sourceNote: string;
  confidence: "high" | "medium";
  exhibit: string;
  media?: PublicMedia[];
  links?: { label: string; url: string }[];
};
export type Note = {
  slug: string;
  title: string;
  summary: string;
  body: string[];
  date: string;
  tags: string[];
};
export type TimelineEntry = {
  id: string;
  date?: string;
  year?: number;
  title: string;
  description: string;
  kind: string;
  projectSlug?: string;
  countryCode?: string;
  precision: "year" | "month" | "day";
  sourceNote?: string;
};
export const projects = snapshot.projects as Project[];
export const notes = snapshot.notes as Note[];
export const timeline = [...(snapshot.timeline as TimelineEntry[])].sort(
  (a, b) =>
    (a.date?.match(/\d{4}(?:-\d{2})?/)?.[0] || String(a.year)).localeCompare(
      b.date?.match(/\d{4}(?:-\d{2})?/)?.[0] || String(b.year),
    ),
);
export const findProject = (slug: string) =>
  projects.find((p) => p.slug === slug);
export const findNote = (slug: string) => notes.find((n) => n.slug === slug);
export const flagshipSlugs = [
  "visual-data-foundry",
  "pansegai",
  "travel-reel-studio",
  "atlas-careers",
];
export const contentRoutes = [
  {
    path: "work",
    title: "The workshop",
    description: "Engineering, research and creative software, opened up.",
  },
  {
    path: "world",
    title: "The World Cabinet",
    description: "A map, a memory, and the stories between places.",
  },
  {
    path: "notes",
    title: "The notebook",
    description:
      "Notes on images, research, culture and things worth looking at twice.",
  },
  {
    path: "timeline",
    title: "Along the way",
    description: "Places, studies and the things taking shape between them.",
  },
  ...projects.map((p) => ({
    path: "work/" + p.slug,
    title: p.title,
    description: p.summary,
  })),
  ...notes.map((n) => ({
    path: "notes/" + n.slug,
    title: n.title,
    description: n.summary,
  })),
];
