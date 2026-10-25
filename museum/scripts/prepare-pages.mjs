import { execFileSync } from "node:child_process";
import { cpSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const museum = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(museum, "..");
if (!existsSync(resolve(destination, ".git")))
  throw new Error(
    "Run this script from the museum source inside the personal site Git checkout.",
  );
execFileSync("npm", ["run", "build"], { cwd: museum, stdio: "inherit" });
const entries = [
  "assets",
  "explore",
  "about",
  "contact",
  "exhibit",
  "index.html",
  "404.html",
  "icon.svg",
  "resume.pdf",
  "atlas.html",
  "privacy.html",
  "terms.html",
  "portfolio.css",
  "vendor",
  "robots.txt",
];
for (const entry of entries) {
  const source = resolve(museum, "dist", entry);
  if (!existsSync(source)) throw new Error("Missing build output: " + entry);
}
for (const entry of entries)
  cpSync(resolve(museum, "dist", entry), resolve(destination, entry), {
    recursive: true,
  });
writeFileSync(resolve(destination, ".nojekyll"), "");
console.log(
  "GitHub Pages files prepared. Review git diff, commit, and push to publish.",
);
