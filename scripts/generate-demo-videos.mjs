import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import ffmpegPath from "ffmpeg-static";

const rootDir = process.cwd();
const recordingDir = path.join(rootDir, "tmp", "demo-video-recordings");
const outputDir = path.join(rootDir, "public", "demo-videos");
const previewPort = 4173;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const meiryFontPath = "C\\:/Windows/Fonts/meiryo.ttc";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const isWindows = process.platform === "win32";

const scenarios = [
  {
    slug: "takehome-demo",
    url: `${baseUrl}/demo-preview.html`,
    captions: [
      { start: 0.4, end: 3.2, text: "売上と経費を入れるだけで 手取り感がすぐ見える" },
      { start: 3.2, end: 6.4, text: "年間売上を変えると 税金と手取りがその場で動く" },
      { start: 6.4, end: 9.8, text: "経費も反映して 残る金額の目安をすぐ確認" },
      { start: 9.8, end: 13.2, text: "消費税の方式も切り替えられる" },
      { start: 13.2, end: 17.0, text: "業種まで変えて 自分に近い条件で試せる" },
    ],
    async run(page) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
      await page.waitForTimeout(1000);

      await typeInto(page, "#annualSales", "12500000");
      await page.waitForTimeout(1200);
      await typeInto(page, "#expenses", "2600000");
      await page.waitForTimeout(1200);
      await selectOption(page, "#consumptionTaxMethod", "simplified");
      await page.waitForTimeout(1000);
      await selectOption(page, "#industryKey", "retail");
      await page.waitForTimeout(2200);
    },
  },
  {
    slug: "legal-docs-demo",
    url: `${baseUrl}/legal-docs-preview.html`,
    captions: [
      { start: 0.4, end: 3.0, text: "販売者情報を入れるだけで 3文書のたたき台ができる" },
      { start: 3.0, end: 6.2, text: "サイト名や連絡先を埋めれば まず公開に必要な形になる" },
      { start: 6.2, end: 9.4, text: "ボタンを押すと 特商法表記をすぐ確認できる" },
      { start: 9.4, end: 12.8, text: "プライバシーポリシーへ切り替え" },
      { start: 12.8, end: 16.2, text: "利用規約まで その場で見比べられる" },
    ],
    async run(page) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(900);
      await typeInto(page, "#sellerName", "よへラボ");
      await page.waitForTimeout(300);
      await typeInto(page, "#representative", "加古洋平");
      await page.waitForTimeout(300);
      await typeInto(page, "#email", "yohelab2026@gmail.com");
      await page.waitForTimeout(300);
      await typeInto(page, "#productName", "フリーランス手取りシミュレーター");
      await page.waitForTimeout(1000);
      await clickLocator(page, "#generateButton");
      await page.waitForTimeout(1200);
      await clickLocator(page, '[data-doc="privacy"]');
      await page.waitForTimeout(1200);
      await clickLocator(page, '[data-doc="terms"]');
      await page.waitForTimeout(2200);
    },
  },
  {
    slug: "yakki-demo",
    url: `${baseUrl}/yakki-checker-preview.html`,
    captions: [
      { start: 0.4, end: 3.0, text: "広告文を貼るだけで 危ない表現を先に拾える" },
      { start: 3.0, end: 6.4, text: "強すぎる訴求を入れて 実際にチェック" },
      { start: 6.4, end: 9.6, text: "厳しめモードにすると 赤く出る表現が増える" },
      { start: 9.6, end: 12.8, text: "チェック結果に 言い換えの方向も出る" },
      { start: 12.8, end: 16.8, text: "スクロールすると 指摘一覧まで確認できる" },
    ],
    async run(page) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(900);
      await typeInto(page, "#copyText", "このサプリならたった3日で痩せる。医師推奨で副作用なし。業界No.1の実力で、誰でも確実に理想の体型へ。");
      await page.waitForTimeout(900);
      await selectOption(page, "#strictness", "strict");
      await page.waitForTimeout(300);
      await clickLocator(page, "#analyzeButton");
      await page.waitForTimeout(1400);
      await page.evaluate(() => window.scrollTo({ top: 420, behavior: "smooth" }));
      await page.waitForTimeout(2600);
    },
  },
  {
    slug: "pricing-demo",
    url: `${baseUrl}/pricing-simulator-preview.html`,
    captions: [
      { start: 0.4, end: 3.2, text: "工数と条件を入れるだけで 提案額の軸が出る" },
      { start: 3.2, end: 6.2, text: "職種と工数を変えて まず相場感をつかむ" },
      { start: 6.2, end: 9.2, text: "利益率まで入れて 安売りを防ぐ" },
      { start: 9.2, end: 12.6, text: "利用範囲を変えると 価格もその場で動く" },
      { start: 12.6, end: 16.8, text: "守る下限と基準提案額を見ながら 判断できる" },
    ],
    async run(page) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(900);
      await selectOption(page, "#role", "web");
      await page.waitForTimeout(300);
      await typeInto(page, "#hours", "24");
      await page.waitForTimeout(300);
      await typeInto(page, "#revisions", "2");
      await page.waitForTimeout(300);
      await typeInto(page, "#profit", "28");
      await page.waitForTimeout(900);
      await selectOption(page, "#rights", "ad");
      await page.waitForTimeout(400);
      await clickLocator(page, "#calcButton");
      await page.waitForTimeout(1400);
      await page.evaluate(() => window.scrollTo({ top: 280, behavior: "smooth" }));
      await page.waitForTimeout(2600);
    },
  },
  {
    slug: "contract-demo",
    url: `${baseUrl}/contract-generator-preview.html`,
    captions: [
      { start: 0.4, end: 3.2, text: "商談メモを入れるだけで 契約書ドラフトになる" },
      { start: 3.2, end: 6.4, text: "委託者名と受託者名を入れて ベースを作る" },
      { start: 6.4, end: 9.6, text: "報酬額も反映して 条文の中身を固める" },
      { start: 9.6, end: 12.8, text: "著作権の条件も選べる" },
      { start: 12.8, end: 17.0, text: "生成ボタンで 契約書ドラフトをすぐ確認" },
    ],
    async run(page) {
      await page.goto(this.url, { waitUntil: "networkidle" });
      await page.setViewportSize({ width: 1280, height: 840 });
      await page.waitForTimeout(900);
      await typeInto(page, "#clientName", "株式会社サンプル");
      await page.waitForTimeout(300);
      await typeInto(page, "#freelancerName", "加古洋平");
      await page.waitForTimeout(300);
      await typeInto(page, "#fee", "220000");
      await page.waitForTimeout(900);
      await selectOption(page, "#copyright", { label: "納品・入金後に委託者へ移転" });
      await page.waitForTimeout(400);
      await clickLocator(page, "#generateButton");
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.scrollTo({ top: 320, behavior: "smooth" }));
      await page.waitForTimeout(2400);
    },
  },
];

function exec(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const useCmdWrapper = isWindows && path.basename(command).toLowerCase() === "npm.cmd";
    const child = spawn(
      useCmdWrapper ? "cmd.exe" : command,
      useCmdWrapper ? ["/d", "/s", "/c", `"${command}" ${args.map(quoteArg).join(" ")}`] : args,
      {
        cwd: rootDir,
        stdio: options.stdio ?? "pipe",
        shell: false,
        windowsVerbatimArguments: useCmdWrapper,
      },
    );
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
  if (/[\s"]/u.test(String(value))) {
    return `"${String(value).replaceAll('"', '\\"')}"`;
  }
  return String(value);
}

async function waitForPreview() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Preview server did not start in time.");
}

function startPreviewServer() {
  return spawn(
    isWindows ? "cmd.exe" : npmCommand,
    isWindows
      ? ["/d", "/s", "/c", `"${npmCommand}" run preview -- --host 127.0.0.1 --port ${previewPort}`]
      : ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(previewPort)],
    {
      cwd: rootDir,
      stdio: "ignore",
      shell: false,
      windowsVerbatimArguments: isWindows,
    },
  );
}

async function moveToLocator(page, selector) {
  const locator = page.locator(selector);
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`Could not resolve bounding box for ${selector}`);
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  return locator;
}

async function clickLocator(page, selector) {
  const locator = await moveToLocator(page, selector);
  await page.waitForTimeout(120);
  await locator.click();
}

async function typeInto(page, selector, value) {
  const locator = await moveToLocator(page, selector);
  await locator.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(String(value), { delay: 65 });
}

async function selectOption(page, selector, value) {
  const locator = await moveToLocator(page, selector);
  await locator.selectOption(value);
}

async function recordScenario(browser, scenario) {
  const scenarioDir = path.join(recordingDir, scenario.slug);
  await rm(scenarioDir, { recursive: true, force: true });
  await mkdir(scenarioDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 840 },
    recordVideo: {
      dir: scenarioDir,
      size: { width: 1280, height: 840 },
    },
  });
  const page = await context.newPage();

  try {
    await scenario.run(page);
  } finally {
    await page.close();
    await context.close();
  }

  const files = await readdir(scenarioDir);
  const webmFile = files.find((file) => file.endsWith(".webm"));
  if (!webmFile) {
    throw new Error(`No recording output was created for ${scenario.slug}`);
  }
  return {
    videoPath: path.join(scenarioDir, webmFile),
    scenarioDir,
  };
}

function escapeCaption(text) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("%", "\\%");
}

function buildCaptionFilter(captions) {
  const layers = [
    "scale=960:-2:flags=lanczos",
    "drawbox=x=32:y=ih-118:w=iw-64:h=86:color=black@0.56:t=fill",
  ];

  for (const caption of captions) {
    layers.push(
      `drawtext=fontfile='${meiryFontPath}':text='${escapeCaption(caption.text)}':fontcolor=white:fontsize=34:line_spacing=10:x=(w-text_w)/2:y=h-88:enable='between(t,${caption.start},${caption.end})'`,
    );
  }

  layers.push("format=yuv420p");
  return layers.join(",");
}

async function convertRecording(recordedVideoPath, scenario) {
  const outputPath = path.join(outputDir, `${scenario.slug}.mp4`);
  const filter = buildCaptionFilter(scenario.captions);

  await exec(ffmpegPath, [
    "-y",
    "-i",
    recordedVideoPath,
    "-vf",
    filter,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  await rm(recordingDir, { recursive: true, force: true });
  await mkdir(recordingDir, { recursive: true });

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
        const recorded = await recordScenario(browser, scenario);
        await convertRecording(recorded.videoPath, scenario);
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
