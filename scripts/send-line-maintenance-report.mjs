const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const to = process.env.LINE_TO || process.env.LINE_USER_ID || process.env.LINE_GROUP_ID || "";

const buildStatus = process.env.BUILD_STATUS || "unknown";
const smokeStatus = process.env.SMOKE_STATUS || "unknown";
const repo = process.env.GITHUB_REPOSITORY || "yohelab-store-site";
const runId = process.env.GITHUB_RUN_ID || "";
const refName = process.env.GITHUB_REF_NAME || "";
const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
const runUrl = runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : "";

function label(status) {
  return status === "success" ? "OK" : "要確認";
}

function overallStatus() {
  return buildStatus === "success" && smokeStatus === "success" ? "OK" : "要確認";
}

const message = [
  "よへラボ 日次メンテ結果",
  "",
  `状態: ${overallStatus()}`,
  `build: ${label(buildStatus)}`,
  `smoke-test: ${label(smokeStatus)}`,
  `branch: ${refName || "-"}`,
  `commit: ${sha || "-"}`,
  "",
  overallStatus() === "OK"
    ? "必要な対応はありません。"
    : "GitHub Actionsで落ちた項目があります。差分とログを確認してください。",
  runUrl ? `\nGitHubで確認:\n${runUrl}` : "",
].filter(Boolean).join("\n");

if (!token || !to) {
  console.log("LINE notification skipped: LINE_CHANNEL_ACCESS_TOKEN and LINE_TO/LINE_USER_ID are not configured.");
  console.log(message);
  process.exit(0);
}

const response = await fetch("https://api.line.me/v2/bot/message/push", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to,
    messages: [
      {
        type: "text",
        text: message.slice(0, 5000),
      },
    ],
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`LINE push failed: ${response.status} ${body}`);
}

console.log("LINE maintenance report sent.");
