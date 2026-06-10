import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildRobotsTxt } from "../functions/lib/site-seo.js";

const root = resolve(process.cwd());
const robots = buildRobotsTxt();

writeTextFile(resolve(root, "robots.txt"), robots);
writeTextFile(resolve(root, "public", "robots.txt"), robots);

function writeTextFile(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, "utf8");
}
