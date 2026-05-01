import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const from = resolve(root, "sitemap.xml");
const to = resolve(root, "public", "sitemap.xml");

// LPは個別HTMLで管理している。ビルド前は公開用sitemapだけ同期する。
mkdirSync(dirname(to), { recursive: true });
writeFileSync(to, readFileSync(from, "utf8"), "utf8");
