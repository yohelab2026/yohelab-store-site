import { readdir, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const blogAssetDir = join(root, "public", "assets", "blog");
const sourceExtensions = new Set([".png", ".jpg", ".jpeg"]);

if (!existsSync(blogAssetDir)) {
  process.exit(0);
}

const files = await collectFiles(blogAssetDir);
let converted = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!sourceExtensions.has(ext)) continue;

  const outFile = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const input = await stat(file);
  const output = existsSync(outFile) ? await stat(outFile) : null;

  if (!output || output.mtimeMs < input.mtimeMs) {
    await sharp(file)
      .webp({ quality: 86, effort: 5 })
      .toFile(outFile);
    converted += 1;
  }

  await unlink(file);
}

if (converted) {
  console.log(`Converted ${converted} blog image(s) to WebP.`);
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}
