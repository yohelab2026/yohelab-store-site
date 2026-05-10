import { appendFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN || process.env.GITHUB_ISSUE_TOKEN || "";
const repo = process.env.GITHUB_REPOSITORY || "yohelab2026/yohelab-store-site";
const staleDays = Number(process.env.LINE_ISSUE_STALE_DAYS || 10);
const cancelledDays = Number(process.env.LINE_ISSUE_CANCELLED_DAYS || 1);
const dryRun = process.env.DRY_RUN === "1";

const apiBase = "https://api.github.com";

function cutoffDate(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hasLabel(issue, labelName) {
  return (issue.labels || []).some((label) => label.name === labelName);
}

async function github(path, init = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${body}`);
  }
  return response.status === 204 ? null : response.json();
}

async function listIssuesByLabel(label) {
  const issues = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = await github(
      `/repos/${repo}/issues?labels=${encodeURIComponent(label)}&state=open&sort=updated&direction=asc&per_page=100&page=${page}`,
    );
    issues.push(...(batch || []).filter((issue) => !issue.pull_request));
    if (!batch || batch.length < 100) break;
  }
  return issues;
}

async function listLineIssues() {
  const byNumber = new Map();
  for (const issue of await listIssuesByLabel("line-inbox")) {
    byNumber.set(issue.number, issue);
  }
  for (const issue of await listIssuesByLabel("sales-draft")) {
    byNumber.set(issue.number, issue);
  }
  return [...byNumber.values()].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
}

async function issueComments(issueNumber) {
  return github(`/repos/${repo}/issues/${issueNumber}/comments?per_page=100`);
}

async function ensureLabel(name, color, description) {
  const encoded = encodeURIComponent(name);
  try {
    await github(`/repos/${repo}/labels/${encoded}`);
  } catch {
    await github(`/repos/${repo}/labels`, {
      method: "POST",
      body: JSON.stringify({ name, color, description }),
    });
  }
}

async function addLabels(issueNumber, labels) {
  await github(`/repos/${repo}/issues/${issueNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

async function comment(issueNumber, body) {
  await github(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function closeIssue(issueNumber) {
  await github(`/repos/${repo}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed", state_reason: "completed" }),
  });
}

function shouldCloseStale(issue) {
  if (hasLabel(issue, "keep-open")) return false;
  return new Date(issue.updated_at) < cutoffDate(staleDays);
}

async function shouldCloseCancelled(issue) {
  if (new Date(issue.updated_at) >= cutoffDate(cancelledDays)) return false;
  const comments = await issueComments(issue.number);
  return (comments || []).some((item) => (item.body || "").includes("LINEでキャンセルされました。"));
}

const issues = await listLineIssues();
await ensureLabel("line-auto-closed", "6a737d", "LINE Issueの自動整理でクローズ");

const closed = [];
const kept = [];

for (const issue of issues) {
  const closeStale = shouldCloseStale(issue);
  const closeCancelled = !closeStale && await shouldCloseCancelled(issue);

  if (!closeStale && !closeCancelled) {
    kept.push(issue.number);
    continue;
  }

  const reason = closeCancelled
    ? `LINEでキャンセル済みのため、${cancelledDays}日後に自動クローズしました。`
    : hasLabel(issue, "sales-draft")
      ? `営業下書きIssueが${staleDays}日以上更新されていないため、自動クローズしました。`
      : `LINE由来のIssueが${staleDays}日以上更新されていないため、自動クローズしました。`;

  if (!dryRun) {
    await comment(issue.number, [
      reason,
      "",
      "削除ではなくクローズなので、あとから検索して見返せます。",
      "残したいIssueには `keep-open` ラベルを付けてください。",
    ].join("\n"));
    await addLabels(issue.number, ["line-auto-closed"]);
    await closeIssue(issue.number);
  }
  closed.push(issue.number);
}

const result = {
  ok: true,
  dryRun,
  checked: issues.length,
  closed: closed.length,
  closedIssues: closed,
  kept: kept.length,
  staleDays,
  cancelledDays,
};

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, [
    `checked=${result.checked}`,
    `closed=${result.closed}`,
    `kept=${result.kept}`,
    "",
  ].join("\n"));
}

console.log(JSON.stringify(result, null, 2));
