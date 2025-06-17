# 同步data目录到public/data的PowerShell脚本
# 使用方法: .\sync-data.ps1

Write-Host "开始同步数据文件..." -ForegroundColor Green

# 确保public/data目录存在
if (-not (Test-Path "public\data")) {
    New-Item -ItemType Directory -Path "public\data" -Force
    Write-Host "创建了 public\data 目录" -ForegroundColor Yellow
}

# 同步JSON文件
Write-Host "同步JSON文件..." -ForegroundColor Blue
Copy-Item "..\data\*.json" "public\data\" -Force

# 同步sites目录
if (Test-Path "..\data\sites") {
    Write-Host "同步sites目录..." -ForegroundColor Blue
    if (Test-Path "public\data\sites") {
        Remove-Item "public\data\sites" -Recurse -Force
    }
    Copy-Item "..\data\sites" "public\data\" -Recurse -Force
}

# 列出同步的文件
Write-Host "`n同步完成的文件:" -ForegroundColor Green
Get-ChildItem "public\data" -Recurse | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Host "`n数据同步完成！" -ForegroundColor Green 