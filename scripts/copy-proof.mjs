import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const src = resolve(root, "public", "proof");
const dest = resolve(root, "dist", "proof");

if (!existsSync(src)) {
  throw new Error(`Missing proof source folder: ${src}`);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied proof assets to ${dest}`);
