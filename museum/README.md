# Bobbie’s Gallery

Yinan Feng’s personal digital museum, inspired by the archived 2022 Swell Gallery composition. Eight original sculptural objects connect applied AI, engineering, moving images, research and personal background.

Live site: https://marron-lover.github.io/

## Run locally

Use Node 22.12 or newer and npm. From the personal-site checkout:

```sh
cd museum
npm ci
npm run dev
```

Open http://127.0.0.1:8950/. The loopback preview is separate from the private Atlas Careers service. Build with `npm run build`; inspect the production build with `npm run preview`.

## Edit content

- `src/data/site.config.ts`: gallery title, introduction, About text, CV, email and GitHub.
- `src/data/exhibits.ts`: all eight exhibit titles, captions, facts, descriptions, links and artwork names.
- `public/assets/`: original transparent sculpture WebPs. Preserve filenames to swap artwork without changing layout.
- `public/resume.pdf`: the approved one-page CV.
- `src/museum.css`: spatial composition, responsive layouts and design tokens.
- `src/main.tsx`: gallery behavior, detail rooms, parallax, transitions and original synthesized sound.

To add real photos, put the files in `public/photos/`, then add `media: [{src:'/photos/your-image.webp', alt:'A factual description', caption:'Your caption'}]` to an exhibit. They appear under More. Add images and captions that you intend to publish.

`titleLead` and `titleEmphasis` set the two weights of the landing wordmark. `title` sets the document and sharing title. Bobbie’s Gallery follows the supplied provisional title; Yinan Feng is the verified professional name.

## Build the public files

```sh
npm run prepare:pages
```

This rebuilds the app and copies a fixed list of production files into the parent GitHub Pages checkout. It preserves the CV and Atlas notice pages supplied in `public/`. Review `git diff`, commit and push the parent repository to deploy. Run it from the source folder named `museum` inside the personal-site Git checkout.

The repository root contains deployable static HTML and assets; `museum/` contains the editable Vite source. Vite generates real HTML entry files for `/explore/`, `/about/`, `/contact/` and all eight `/exhibit/:slug/` routes. Direct links work with GitHub Pages, while in-app navigation uses browser history. Future source additions use the same data-driven build.

## Behavior and accessibility

Mouse movement drives depth-based parallax on hover-capable devices. The rail supports mouse dragging, native horizontal touch scrolling, horizontal trackpad scrolling, local wheel navigation, arrow buttons, Left/Right, Home/End and Enter. Esc returns to the collection; another Esc returns home. Detail views have previous/next controls. Returning to the collection selects the current exhibit, including after direct links and detail navigation.

The system reduced-motion preference and the persistent local motion switch suppress movement. Focus rings, a skip link, named buttons and live announcements support keyboard use. Sound begins with a click and can be paused through either sound control. It is synthesized locally with Web Audio.

The public website runs without a server, analytics, mailbox access or credentials. Atlas Careers keeps its private job-search runtime separately on the Mac. Existing `atlas.html`, `privacy.html` and `terms.html` remain accessible.

## Content and visual boundaries

The nearly ten-million-image figure describes creation/search activity confirmed by Yinan. PanSegAI results describe a retrospective 56-case evaluation; the exhibit includes that context. The travel cabinet uses documented study/work anchors. Collected Light describes the real video-rendering workflow. Soundtrack contains an original gallery sound study. Personal photo collections and listening preferences can be added through the data files.

Reference: [UI Coach archive](https://www.uicoach.io/inspirations/award-winning/the-swell-gallery-by-ripple), [Awwwards landing screenshot](https://assets.awwwards.com/awards/sites_of_the_day/2022/01/Swell-gallery-1.jpg), [gallery screenshot](https://assets.awwwards.com/awards/sites_of_the_day/2022/01/Swell-gallery-2.jpg). Historical screenshots informed composition. All eight published sculpture images are newly generated originals. Timing and geometry are implementation choices inferred from the brief and screenshots; they are approximate reconstructions.

Differences from the historical site: original art and personal content; CSS perspective and transparent image layers; a native horizontal rail; original synthesized sound; eight real content rooms and CV/contact links. Real-time rotation and WebGL are available as later extensions if new multi-angle assets call for them.

See `design/ASSET_GENERATION.md` for the generation brief and asset mapping, `DESIGN.md` for visual decisions, and `qa/REPORT.md` in the local checkout for measured verification and screenshots.
