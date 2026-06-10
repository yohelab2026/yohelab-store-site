import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildRobotsTxt } from "../functions/lib/site-seo.js";

const root = resolve(process.cwd());
const robots = buildRobotsTxt();

writeTextFile(resolve(root, "robots.txt"), robots);
writeTextFile(resolve(root, "public", "robots.txt"), robots);
copyTextFile("feed.xml");
copyTextFile("llms.txt");
copyTextFile("site.webmanifest");

function writeTextFile(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, "utf8");
}

function copyTextFile(name) {
  const source = resolve(root, name);
  const target = resolve(root, "public", name);
  writeTextFile(target, readFileSync(source, "utf8"));
}
