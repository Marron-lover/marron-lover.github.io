import { defineConfig } from "vite";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { exhibits } from "./src/data/exhibits";
import { site } from "./src/data/site.config";
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
export default defineConfig({
  plugins: [
    {
      name: "static-deep-routes",
      closeBundle() {
        const shell = readFileSync("dist/index.html", "utf8");
        const routes = [
          { path: "", title: site.title, description: site.introduction },
          {
            path: "explore",
            title: "The collection",
            description:
              "Explore eight sculptural rooms of AI, software, images and ideas.",
          },
          {
            path: "about",
            title: "About the collection",
            description: site.about[0],
          },
          {
            path: "contact",
            title: "Contact Yinan Feng",
            description: "CV, email and GitHub for Yinan Feng.",
          },
          ...exhibits.map((e) => ({
            path: "exhibit/" + e.slug,
            title: e.title,
            description: e.oneLiner,
          })),
        ];
        for (const route of routes) {
          const url =
            "https://marron-lover.github.io/" +
            (route.path ? route.path + "/" : "");
          const title = escape(route.title + " — " + site.owner),
            description = escape(route.description);
          const html = shell
            .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
            .replace(
              /<link rel="canonical" href="[^"]*"\s*\/?\s*>/,
              `<link rel="canonical" href="${url}">`,
            )
            .replace(
              /<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/s,
              `<meta name="description" content="${description}">`,
            )
            .replace(
              "</head>",
              `<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="https://marron-lover.github.io/assets/ai.webp"></head>`,
            );
          const target = "dist/" + (route.path ? route.path + "/" : "");
          mkdirSync(target, { recursive: true });
          writeFileSync(target + "index.html", html);
        }
        copyFileSync("dist/index.html", "dist/404.html");
      },
    },
  ],
});
