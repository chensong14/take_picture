$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose 启动失败' }

for ($i = 0; $i -lt 30; $i++) {
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/health/ready' -UseBasicParsing
    if ($response.StatusCode -eq 200) {
      Write-Host 'API 已就绪：http://127.0.0.1:3000/health/ready'
      exit 0
    }
  } catch { }
  Start-Sleep -Seconds 2
}

docker compose ps
throw 'API 在规定时间内没有就绪，请查看 docker compose logs api migrate'
