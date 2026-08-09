/**
 * Builds the static CI/CD metrics dashboard published to GitHub Pages.
 * Reads artifacts produced earlier in the pages workflow run: coverage
 * summary, CodeQL/Dependabot/gitleaks metrics JSON files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, "site");

function loadJson(filename, fallback) {
  const filePath = path.join(ROOT, filename);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function coveragePercent() {
  const summary = loadJson("coverage/coverage-summary.json", null);
  if (!summary || !summary.total) return null;
  return Math.round(summary.total.lines.pct * 10) / 10;
}

function severityRows(metrics) {
  const bySeverity = metrics.bySeverity || {};
  const entries = Object.entries(bySeverity);
  if (entries.length === 0) return '<tr><td colspan="2">None found</td></tr>';
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sev, count]) => `<tr><td>${sev}</td><td>${count}</td></tr>`)
    .join("");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  fs.mkdirSync(SITE, { recursive: true });

  const covPct = coveragePercent();
  const codeql = loadJson("codeql-metrics.json", { total: 0, bySeverity: {} });
  const dependabot = loadJson("dependabot-metrics.json", { total: 0, bySeverity: {} });
  const gitleaksFindings = loadJson("gitleaks-report.json", []);
  const gitleaksCount = Array.isArray(gitleaksFindings) ? gitleaksFindings.length : 0;

  copyDir(path.join(ROOT, "coverage"), path.join(SITE, "coverage"));

  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const repo = process.env.GITHUB_REPOSITORY || "";
  const sha = (process.env.GITHUB_SHA || "").slice(0, 7);
  const runId = process.env.GITHUB_RUN_ID || "";
  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;

  const covDisplay = covPct !== null ? `${covPct}%` : "N/A";
  const covClass = (covPct || 0) >= 60 ? "ok" : "warn";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>UserForge &mdash; CI/CD Dashboard</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
    max-width: 960px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5;
  }
  h1 { margin-bottom: 0.2rem; }
  .sub { color: #666; margin-top: 0; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
  .card { border: 1px solid #d0d7de; border-radius: 8px; padding: 1rem; }
  .card h2 { margin: 0 0 0.3rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; color: #666; }
  .card .value { font-size: 2rem; font-weight: 700; }
  .ok { color: #1a7f37; }
  .warn { color: #9a6700; }
  .bad { color: #cf222e; }
  table { border-collapse: collapse; width: 100%; margin: 0.5rem 0 1.5rem; }
  th, td { border: 1px solid #d0d7de; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.9rem; }
  th { background: rgba(127,127,127,0.1); }
  a { color: #0969da; }
  footer { color: #666; font-size: 0.85rem; margin-top: 2rem; }
</style>
</head>
<body>
  <h1>UserForge &mdash; CI/CD Dashboard</h1>
  <p class="sub">Repository: <a href="https://github.com/${repo}">${repo}</a> &bull; Commit <code>${sha}</code> &bull; Generated ${generatedAt}</p>

  <div class="cards">
    <div class="card">
      <h2>Code Coverage</h2>
      <div class="value ${covClass}">${covDisplay}</div>
      <div><a href="coverage/index.html">Full HTML report &rarr;</a></div>
    </div>
    <div class="card">
      <h2>CodeQL Alerts (open)</h2>
      <div class="value ${codeql.total === 0 ? "ok" : "warn"}">${codeql.total}</div>
      <div><a href="https://github.com/${repo}/security/code-scanning">Security tab &rarr;</a></div>
    </div>
    <div class="card">
      <h2>Dependabot Alerts (open)</h2>
      <div class="value ${dependabot.total === 0 ? "ok" : "warn"}">${dependabot.total}</div>
      <div><a href="https://github.com/${repo}/security/dependabot">Security tab &rarr;</a></div>
    </div>
    <div class="card">
      <h2>Secret Scan Findings</h2>
      <div class="value ${gitleaksCount === 0 ? "ok" : "bad"}">${gitleaksCount}</div>
      <div><a href="https://github.com/${repo}/actions/workflows/secret-scan.yml">Workflow runs &rarr;</a></div>
    </div>
  </div>

  <h2>CodeQL alerts by severity</h2>
  <table><tr><th>Severity</th><th>Count</th></tr>${severityRows(codeql)}</table>

  <h2>Dependabot alerts by severity</h2>
  <table><tr><th>Severity</th><th>Count</th></tr>${severityRows(dependabot)}</table>

  <footer>
    Built by the <code>pages.yml</code> workflow &bull; <a href="${runUrl}">this run</a>
  </footer>
</body>
</html>
`;

  fs.writeFileSync(path.join(SITE, "index.html"), html, "utf-8");
  fs.writeFileSync(path.join(SITE, ".nojekyll"), "");
}

main();
