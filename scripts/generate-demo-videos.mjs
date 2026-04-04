import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import ffmpegPath from "ffmpeg-static";

const rootDir = process.cwd();
const frameRoot = path.join(rootDir, "tmp", "demo-video-frames");
const outputDir = path.join(rootDir, "public", "demo-videos");
const previewPort = 4173;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const isWindows = process.platform === "win32";

const scenarios = [
  {
    slug: "takehome-demo",
    url: `${baseUrl}/demo-preview.html`,
    async run(page, capture) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.evaluate(() => window.scrollTo(0, 240));
      await page.waitForTimeout(800);
      await capture(1.0);

      await page.locator("#annualSales").click();
      await page.keyboard.press("Control+A");
      await page.keyboard.type("12500000", { delay: 45 });
      await page.waitForTimeout(250);
      await capture(0.8);

      await page.locator("#expenses").click();
      await page.keyboard.press("Control+A");
      await page.keyboard.type("2600000", { delay: 45 });
      await page.waitForTimeout(250);
      await capture(0.8);

      await page.locator("#consumptionTaxMethod").selectOption("simplified");
      await page.waitForTimeout(350);
      await capture(0.9);

      await page.locator("#industryKey").selectOption("retail");
      await page.waitForTimeout(350);
      await capture(1.2);
    },
  },
  {
    slug: "legal-docs-demo",
    url: `${baseUrl}/legal-docs-preview.html`,
    async run(page, capture) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(700);
      await capture(0.9);

      await page.locator("#sellerName").fill("よへラボ");
      await page.locator("#representative").fill("加古洋平");
      await page.locator("#email").fill("yohelab2026@gmail.com");
      await page.locator("#productName").fill("フリーランス手取りシミュレーター");
      await page.waitForTimeout(300);
      await capture(0.8);

      await page.locator("#generateButton").click();
      await page.waitForTimeout(300);
      await capture(0.8);

      await page.locator('[data-doc="privacy"]').click();
      await page.waitForTimeout(250);
      await capture(0.7);

      await page.locator('[data-doc="terms"]').click();
      await page.waitForTimeout(250);
      await capture(1.2);
    },
  },
  {
    slug: "yakki-demo",
    url: `${baseUrl}/yakki-checker-preview.html`,
    async run(page, capture) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(700);
      await capture(0.9);

      await page.locator("#copyText").fill("このサプリならたった3日で痩せる。医師推奨で副作用なし。業界No.1の実力で、誰でも確実に理想の体型へ。");
      await page.waitForTimeout(300);
      await capture(0.8);

      await page.locator("#strictness").selectOption("strict");
      await page.locator("#analyzeButton").click();
      await page.waitForTimeout(350);
      await capture(0.9);

      await page.evaluate(() => window.scrollTo(0, 420));
      await page.waitForTimeout(300);
      await capture(1.2);
    },
  },
  {
    slug: "pricing-demo",
    url: `${baseUrl}/pricing-simulator-preview.html`,
    async run(page, capture) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(700);
      await capture(0.9);

      await page.locator("#role").selectOption("web");
      await page.locator("#hours").fill("24");
      await page.locator("#revisions").fill("2");
      await page.locator("#profit").fill("28");
      await page.waitForTimeout(300);
      await capture(0.7);

      await page.locator("#rights").selectOption("ad");
      await page.locator("#calcButton").click();
      await page.waitForTimeout(350);
      await capture(0.9);

      await page.evaluate(() => window.scrollTo(0, 280));
      await page.waitForTimeout(300);
      await capture(1.2);
    },
  },
  {
    slug: "contract-demo",
    url: `${baseUrl}/contract-generator-preview.html`,
    async run(page, capture) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(700);
      await capture(0.9);

      await page.locator("#clientName").fill("株式会社サンプル");
      await page.locator("#freelancerName").fill("加古洋平");
      await page.locator("#fee").fill("220000");
      await page.waitForTimeout(300);
      await capture(0.8);

      await page.locator("#copyright").selectOption({ label: "納品・入金後に委託者へ移転" });
      await page.locator("#generateButton").click();
      await page.waitForTimeout(350);
      await capture(0.9);

      await page.evaluate(() => window.scrollTo(0, 320));
      await page.waitForTimeout(300);
      await capture(1.2);
    },
  },
];

function exec(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(isWindows ? "cmd.exe" : command, isWindows ? ["/d", "/s", "/c", `"${command}" ${args.map(quoteArg).join(" ")}`] : args, {
      cwd: rootDir,
      stdio: options.stdio ?? "pipe",
      shell: false,
      windowsVerbatimArguments: isWindows,
    });
    let stderr = "";
    let stdout = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed: ${stderr || stdout}`));
      }
    });
  });
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return value;
}

async function waitForPreview() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Preview server did not start in time.");
}

function startPreviewServer() {
  return spawn(isWindows ? "cmd.exe" : npmCommand, isWindows ? ["/d", "/s", "/c", `"${npmCommand}" run preview -- --host 127.0.0.1 --port ${previewPort}`] : ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(previewPort)], {
    cwd: rootDir,
    stdio: "ignore",
    shell: false,
    windowsVerbatimArguments: isWindows,
  });
}

async function captureScenario(browser, scenario) {
  const page = await browser.newPage();
  const scenarioDir = path.join(frameRoot, scenario.slug);
  await rm(scenarioDir, { recursive: true, force: true });
  await mkdir(scenarioDir, { recursive: true });

  let frameIndex = 0;
  const captures = [];

  const capture = async (seconds = 0.8) => {
    frameIndex += 1;
    const filename = `frame-${String(frameIndex).padStart(3, "0")}.png`;
    const filePath = path.join(scenarioDir, filename);
    await page.screenshot({ path: filePath });
    captures.push({ filename, seconds });
  };

  await scenario.run(page, capture);
  await page.close();

  const concatManifest = captures
    .map((frame) => `file '${frame.filename.replaceAll("\\", "/")}'\nduration ${frame.seconds}`)
    .join("\n");
  const manifestPath = path.join(scenarioDir, "frames.txt");
  await writeFile(manifestPath, `${concatManifest}\nfile '${captures.at(-1).filename.replaceAll("\\", "/")}'\n`, "utf8");

  const outputPath = path.join(outputDir, `${scenario.slug}.mp4`);
  await exec(ffmpegPath, [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    manifestPath,
    "-vf",
    "fps=30,scale=960:-2:flags=lanczos,format=yuv420p",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await rm(frameRoot, { recursive: true, force: true });
  await mkdir(frameRoot, { recursive: true });

  await exec(npmCommand, ["run", "build"], { stdio: "inherit" });
  const previewServer = startPreviewServer();

  try {
    await waitForPreview();
    const browser = await chromium.launch({
      headless: true,
      executablePath: chromePath,
    });
    try {
      for (const scenario of scenarios) {
        await captureScenario(browser, scenario);
      }
    } finally {
      await browser.close();
    }
  } finally {
    previewServer.kill();
  }

  const files = await readdir(outputDir);
  console.log("Generated demo videos:", files.join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
