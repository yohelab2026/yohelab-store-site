$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$port = 4186
Start-Process "http://127.0.0.1:$port"

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port
  exit 0
}

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $port
  exit 0
}

Write-Host "Python が見つからない。"
Read-Host "Enter で閉じる"
