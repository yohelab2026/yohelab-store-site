$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm が見つからない。Node.js が必要。"
  Read-Host "Enter で閉じる"
  exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot "node_modules"))) {
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install に失敗した。"
    Read-Host "Enter で閉じる"
    exit 1
  }
}

Start-Process "http://127.0.0.1:4174"
npm run dev -- --host 127.0.0.1 --port 4174
