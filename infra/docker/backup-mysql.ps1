$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot
$backupDir = Join-Path $ProjectRoot 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$file = Join-Path $backupDir "ai_creative-$stamp.sql"
$rootPassword = (Get-Content .env | Where-Object { $_ -match '^MYSQL_ROOT_PASSWORD=' }) -replace '^MYSQL_ROOT_PASSWORD=', ''
if ([string]::IsNullOrWhiteSpace($rootPassword)) { throw '无法从 .env 读取 MYSQL_ROOT_PASSWORD' }
docker exec ai-creative-mysql mysqldump -uroot "-p$rootPassword" --single-transaction --routines --events ai_creative | Out-File -FilePath $file -Encoding utf8
Write-Host "数据库备份完成：$file"
