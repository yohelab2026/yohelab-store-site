import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const src = resolve(root, "shared/arcade-game.js");
const dest = resolve(root, "public/shared/arcade-game.js");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);

console.log(`Copied game script to ${dest}`);
