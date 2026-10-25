export type Exhibit = {
  destination?: { path: string; label: string };
  slug: string;
  title: string;
  category: string;
  year: string;
  oneLiner: string;
  color: string;
  asset: string;
  description: string[];
  links?: { label: string; url: string }[];
  facts?: { label: string; value: string }[];
  media?: { src: string; alt: string; caption?: string }[];
  interaction?: "sound" | "pipeline";
};
export const exhibits: Exhibit[] = [
  {
    slug: "ai-experiments",
    destination: {
      path: "/work/visual-data-foundry",
      label: "Follow the pipeline",
    },
    title: "AI Experiments",
    category: "AI & image making",
    year: "2025–26",
    oneLiner: "A very large collection of very small decisions.",
    color: "#DCE8FF",
    asset: "ai",
    description: [
      "Image creation and search work spanning nearly ten million images. The engineering lives in the decisions around them: collection, quality review, perceptual deduplication and reliable storage.",
      "I lead a small technical team while staying hands-on with pipeline development. Work runs from requirements and prompt design through processing, review and delivery.",
    ],
    facts: [
      { label: "Creation & search activity", value: "Nearly 10M images" },
      { label: "Practice", value: "Python · visual data · cloud storage" },
    ],
  },
  {
    slug: "world-cabinet",
    destination: { path: "/travel/", label: "Explore my travel map" },
    title: "The World Cabinet",
    category: "Places & perspectives",
    year: "A growing collection",
    oneLiner: "A place to keep the things a place leaves with you.",
    color: "#DAEBD6",
    asset: "world",
    description: [
      "My confirmed travel map begins with Egypt in July 2025. Other parts of this cabinet connect documented study and work: the University of Sydney, an AI engineering internship with Cloudsway Technology in Shanghai, and University College London’s Summer School in International Trade and Migration.",
      "Elsewhere Archive brings another perspective: a research prototype about migration, international student stories and practical questions of belonging. The cabinet is structured to hold personal photographs and travel notes as they are added.",
    ],
    links: [
      {
        label: "Explore Elsewhere Archive",
        url: "https://github.com/Marron-lover/elsewhere-archive",
      },
    ],
  },
  {
    slug: "things-i-built",
    destination: { path: "/work", label: "Open the workshop" },
    title: "Things I Built",
    category: "Engineering & research",
    year: "2025–26",
    oneLiner: "Ideas become useful when they survive being built.",
    color: "#DCD8F5",
    asset: "built",
    description: [
      "PanSegAI began as a project I initiated and led for a University of Sydney capstone. It connects CT and MRI baselines, model training, evaluation and failure analysis. Probability-aware Soft Attachment improved a 56-case CT evaluation using the same model predictions.",
      "Atlas Careers is a personal, local-first system built with Codex: employer ATS discovery, source-backed resumes, read-only Gmail and application tracking. It runs on the Mac with SQLite and a private responsive workspace.",
      "Tradish was a UNSW AI Hackathon project combining semantic search, computer vision and NLP for cultural recipe discovery, with React Native app development.",
    ],
    facts: [
      { label: "PanSegAI Dice", value: "0.7620 → 0.7771" },
      { label: "PanSegAI HD95", value: "36.06 → 13.33 mm" },
    ],
    links: [
      { label: "About Atlas Careers", url: "/atlas.html" },
      {
        label: "Tradish repository",
        url: "https://github.com/Marron-lover/tradish-site",
      },
    ],
  },
  {
    slug: "collected-light",
    destination: {
      path: "/work/travel-reel-studio",
      label: "Inside the studio",
    },
    title: "Collected Light",
    category: "Moving images",
    year: "2026",
    oneLiner: "A creative brief, translated into a moving picture.",
    color: "#EFE7DA",
    asset: "light",
    description: [
      "Travel Reel Studio connects AI-assisted edit planning with a native FFmpeg renderer. A creative brief becomes a reviewable timeline and verified local film, with landscape and portrait support.",
      "The workflow preserves source media and verifies the resulting output. It is a way of making model decisions concrete: a clip selection, a cut, a render you can inspect.",
    ],
    facts: [
      { label: "Verified export", value: "1920 × 1080" },
      { label: "Video", value: "H.264 · 30 fps" },
    ],
  },
  {
    slug: "visual-lab",
    destination: {
      path: "/work/visual-taxonomy-lab",
      label: "Explore the visual systems",
    },
    title: "Visual Lab",
    category: "Visual systems",
    year: "2025–26",
    oneLiner: "An image is the beginning of a system.",
    color: "#F9E1EC",
    asset: "visual",
    interaction: "pipeline",
    description: [
      "Visual-data workflows connect collection, quality filtering, perceptual deduplication, vision-language screening and cloud storage. Resumable execution and stage-level tracking make long-running work inspectable.",
      "At Cloudsway Technology, I deployed multimodal generation pipelines producing 50,000+ ID photos and images on Alibaba Cloud and Volcengine. The work also included speech-to-text, text normalisation and automated HTML presentations.",
    ],
    facts: [{ label: "Internship image pipelines", value: "50,000+ images" }],
  },
  {
    slug: "notes-from-elsewhere",
    destination: { path: "/notes", label: "Read the notebook" },
    title: "Notes From Elsewhere",
    category: "Research & belonging",
    year: "2026",
    oneLiner: "Questions you carry from one place to another.",
    color: "#E8E9EB",
    asset: "notes",
    description: [
      "Elsewhere Archive is a FASS3999 research prototype connecting international student stories, stage-specific peer questions and migration research.",
      "It explores how research can become something people can navigate: a story, a practical question, an entry point into an unfamiliar experience. This room connects that work with the digital-cultures side of my studies.",
    ],
    links: [
      {
        label: "Open the research prototype repository",
        url: "https://github.com/Marron-lover/elsewhere-archive",
      },
    ],
  },
  {
    slug: "soundtrack",
    title: "Soundtrack",
    category: "An original sound study",
    year: "2026",
    oneLiner: "A small sound for a quiet room.",
    color: "#D4EDF0",
    asset: "sound",
    interaction: "sound",
    description: [
      "This room contains an original ambient sound made for the gallery. Three softly voiced tones are synthesized in your browser when you press Play.",
      "Sound starts with your action. You can pause it here or use the sound control at the top of the gallery. The sound belongs to this exhibition.",
    ],
  },
  {
    slug: "about-me",
    destination: { path: "/about", label: "About the collection" },
    title: "About Me",
    category: "Yinan Feng",
    year: "Sydney",
    oneLiner: "A few things about the person collecting all this.",
    color: "#EAE4DC",
    asset: "about",
    description: [
      "I’m a University of Sydney undergraduate working across applied AI, visual data and research software. My Bachelor of Arts combines Computer Science and Digital Cultures, with graduation expected in December 2026.",
      "Previous AI internships include Cloudsway Technology and Reexen. At Reexen, speech-data preparation, deployment and fine-tuning work contributed to a 15% reduction in word error rate.",
      "The collection is a way to keep engineering, images and broader questions together. For the professional version of the story, my one-page CV is below.",
    ],
    links: [
      { label: "View my CV", url: "/resume.pdf" },
      { label: "GitHub", url: "https://github.com/Marron-lover" },
      { label: "Get in touch", url: "mailto:b2692901@gmail.com" },
    ],
  },
];
export const findExhibit = (slug: string) =>
  exhibits.find((e) => e.slug === slug);
