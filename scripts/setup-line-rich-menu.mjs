import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const dryRun = process.argv.includes("--dry-run") || process.env.LINE_RICH_MENU_DRY_RUN === "1";
const imagePath = resolve(process.env.LINE_RICH_MENU_IMAGE || "assets/line/rich-menu-bunsirube.png");
const richMenuName = process.env.LINE_RICH_MENU_NAME || "文標メニュー";

const areas = [
  area(0, 0, 833, 843, message("ブログ作成", "ブログ")),
  area(833, 0, 834, 843, message("リライト", "リライト")),
  area(1667, 0, 833, 843, message("X投稿", "X投稿")),
  area(0, 843, 833, 843, message("営業下書き", "営業下書き")),
  area(833, 843, 834, 843, uri("文標LP", "https://yohelab.com/lp/bunsirube/")),
  area(1667, 843, 833, 843, message("相談", "相談")),
];

const richMenuPayload = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: richMenuName,
  chatBarText: "文標メニュー",
  areas,
};

function area(x, y, width, height, action) {
  return { bounds: { x, y, width, height }, action };
}

function message(label, text) {
  return { type: "message", label, text };
}

function uri(label, url) {
  return { type: "uri", label, uri: url };
}

async function lineRequest(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE API failed: ${response.status} ${body}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204 || !contentType.includes("application/json")) return null;
  return response.json();
}

async function deleteOldMenus(keepId) {
  const result = await lineRequest("https://api.line.me/v2/bot/richmenu/list");
  const oldMenus = (result?.richmenus || []).filter((menu) => menu.name === richMenuName && menu.richMenuId !== keepId);
  for (const menu of oldMenus) {
    await lineRequest(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, { method: "DELETE" });
    console.log(`Deleted old rich menu: ${menu.richMenuId}`);
  }
}

async function main() {
  const image = readFileSync(imagePath);
  const imageSize = statSync(imagePath).size;

  if (imageSize > 1024 * 1024) {
    throw new Error(`Rich menu image is too large: ${imageSize} bytes. Keep it under 1MB.`);
  }

  if (dryRun) {
    console.log("Dry run: LINE rich menu payload");
    console.log(JSON.stringify(richMenuPayload, null, 2));
    console.log(`Image: ${imagePath} (${imageSize} bytes)`);
    return;
  }

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured.");
  }

  const created = await lineRequest("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(richMenuPayload),
  });

  const richMenuId = created?.richMenuId;
  if (!richMenuId) throw new Error("LINE rich menu id was not returned.");

  await lineRequest(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: image,
  });

  await lineRequest(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
  });

  await deleteOldMenus(richMenuId);
  console.log(`LINE rich menu is active: ${richMenuId}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
