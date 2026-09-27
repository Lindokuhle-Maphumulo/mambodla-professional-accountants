import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const copy = async (source, destination = source) => {
  await cp(join(root, source), join(dist, destination), { recursive: true });
};

const rootEntries = await readdir(root, { withFileTypes: true });

for (const entry of rootEntries) {
  if (entry.isFile() && entry.name.endsWith(".html")) {
    await copy(entry.name);
  }
}

await copy("robots.txt");
await copy("sitemap.xml");
await copy("css");
await copy("js");
await copy("insights");

await mkdir(join(dist, "assets"), { recursive: true });

for (const assetDirectory of [
  "data",
  "documents",
  "icons",
  "images",
  "logo",
  "social",
]) {
  await copy(`assets/${assetDirectory}`);
}

console.log("Mambodla production site built in dist/.");
console.log("Development-only assets/brand-book-source is intentionally excluded.");
