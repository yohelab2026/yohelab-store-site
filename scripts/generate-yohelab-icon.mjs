import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function writeModule(outputPath, exportName, value) {
  const output = `export const ${exportName} = ${JSON.stringify(value)};\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
}

const iconBytes = await readFile(resolve("public/yohelab-icon.png"));
await writeModule(
  resolve("functions/generated/yohelab-icon.js"),
  "yohelabIconBase64",
  iconBytes.toString("base64"),
);

const proofSvg = await readFile(resolve("public/proof/research-writer-app.svg"), "utf8");
await writeModule(
  resolve("functions/generated/research-writer-app-svg.js"),
  "researchWriterAppSvg",
  proofSvg,
);

const themeUpdate = await readFile(resolve("public/api/theme-update/bunsirube.json"), "utf8");
await writeModule(
  resolve("functions/generated/theme-update.js"),
  "themeUpdateJson",
  themeUpdate,
);
