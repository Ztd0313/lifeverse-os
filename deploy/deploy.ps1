# ============================================
# LifeVerse 一键部署脚本
# 在阿里云 ECS 服务器上双击运行此脚本
# ============================================

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   LifeVerse 后端服务 - 一键部署" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""

# ===== 步骤 1：检查/安装 Node.js =====
Write-Host "[1/5] 检查 Node.js 环境..." -ForegroundColor Cyan

$nodeInstalled = $false
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer) {
        Write-Host "  Node.js 已安装: $nodeVer" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    Write-Host "  正在安装 Node.js 20 LTS..." -ForegroundColor Yellow

    # 方法1：使用 winget
    try {
        $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
        if ($wingetAvailable) {
            Write-Host "  使用 winget 安装..." -ForegroundColor Yellow
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements 2>$null
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            Start-Sleep -Seconds 3
            $nodeVer = & node --version 2>$null
            if ($nodeVer) {
                Write-Host "  Node.js 安装成功: $nodeVer" -ForegroundColor Green
                $nodeInstalled = $true
            }
        }
    } catch {
        Write-Host "  winget 安装失败，尝试其他方式..." -ForegroundColor Yellow
    }

    # 方法2：直接下载 MSI
    if (-not $nodeInstalled) {
        try {
            Write-Host "  下载 Node.js 安装包..." -ForegroundColor Yellow
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $nodeUrl = "https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi"
            $nodeMsi = "$env:TEMP\node-installer.msi"
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
            Write-Host "  安装 Node.js（可能需要 1-2 分钟）..." -ForegroundColor Yellow
            Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            Start-Sleep -Seconds 2
            $nodeVer = & node --version 2>$null
            if ($nodeVer) {
                Write-Host "  Node.js 安装成功: $nodeVer" -ForegroundColor Green
                $nodeInstalled = $true
            }
        } catch {
            Write-Host "  自动安装失败: $_" -ForegroundColor Red
        }
    }
}

if (-not $nodeInstalled) {
    Write-Host ""
    Write-Host "  Node.js 自动安装失败，请手动安装：" -ForegroundColor Red
    Write-Host "  1. 打开浏览器访问 https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. 下载 20 LTS 版本并安装" -ForegroundColor White
    Write-Host "  3. 安装完成后重新运行此脚本" -ForegroundColor White
    Write-Host ""
    Read-Host "按回车键退出"
    exit 1
}

# 验证 npm
try {
    $npmVer = & npm --version 2>$null
    Write-Host "  npm: $npmVer" -ForegroundColor Green
} catch {
    Write-Host "  npm 不可用，请检查 Node.js 安装" -ForegroundColor Red
}

# ===== 步骤 2：创建项目目录 =====
Write-Host ""
Write-Host "[2/5] 准备项目目录..." -ForegroundColor Cyan

$projectDir = "C:\LifeVerse"
if (-not (Test-Path $projectDir)) {
    New-Item -ItemType Directory -Force -Path $projectDir | Out-Null
    Write-Host "  已创建: $projectDir" -ForegroundColor Green
} else {
    Write-Host "  目录已存在: $projectDir" -ForegroundColor Green
}

# 确保 uploads 目录存在
$uploadsDir = Join-Path $projectDir "uploads"
if (-not (Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null
    Write-Host "  已创建: $uploadsDir" -ForegroundColor Green
}

# ===== 步骤 3：复制项目文件 =====
Write-Host ""
Write-Host "[3/5] 检查项目文件..." -ForegroundColor Cyan

$serverJs = Join-Path $projectDir "server.js"
$packageJson = Join-Path $projectDir "package.json"

if (-not (Test-Path $serverJs)) {
    Write-Host "  未找到 server.js，请确保已将部署文件复制到 $projectDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "  请将以下文件复制到 $projectDir 目录：" -ForegroundColor Yellow
    Write-Host "    - server.js" -ForegroundColor White
    Write-Host "    - package.json" -ForegroundColor White
    Write-Host ""
    Read-Host "复制完成后按回车键继续..."
} else {
    Write-Host "  server.js 已就绪" -ForegroundColor Green
}

if (-not (Test-Path $packageJson)) {
    Write-Host "  未找到 package.json" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
} else {
    Write-Host "  package.json 已就绪" -ForegroundColor Green
}

# ===== 步骤 4：安装依赖 =====
Write-Host ""
Write-Host "[4/5] 安装 Node.js 依赖..." -ForegroundColor Cyan

Set-Location $projectDir

if (Test-Path "node_modules") {
    Write-Host "  node_modules 已存在，跳过安装" -ForegroundColor Green
} else {
    & npm install --production 2>&1 | ForEach-Object {
        if ($_ -match "added") {
            Write-Host "  $_" -ForegroundColor Green
        } else {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    Write-Host "  依赖安装完成" -ForegroundColor Green
}

# ===== 步骤 5：配置防火墙 =====
Write-Host ""
Write-Host "[5/5] 配置防火墙规则..." -ForegroundColor Cyan

$ports = @(3000)
foreach ($port in $ports) {
    $ruleName = "LifeVerse-Port-$port"
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  已开放端口: $port" -ForegroundColor Green
    } else {
        Write-Host "  端口已开放: $port" -ForegroundColor Green
    }
}

# ===== 创建启动脚本 =====
$startBat = @"
@echo off
title LifeVerse Server
cd /d C:\LifeVerse
echo.
echo ========================================
echo   LifeVerse 后端服务器
echo ========================================
echo.
node server.js
pause
"@

$startBat | Out-File -FilePath "$projectDir\start.bat" -Encoding ASCII

# ===== 完成 =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   部署完成！" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""
Write-Host "服务信息：" -ForegroundColor Yellow
Write-Host "  地址: http://120.55.38.135:3000" -ForegroundColor White
Write-Host "  上传: http://120.55.38.135:3000/api/upload" -ForegroundColor White
Write-Host "  健康: http://120.55.38.135:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "启动方式：" -ForegroundColor Yellow
Write-Host "  方式1：双击 C:\LifeVerse\start.bat" -ForegroundColor White
Write-Host "  方式2：在 PowerShell 中运行 cd C:\LifeVerse; node server.js" -ForegroundColor White
Write-Host ""

# 询问是否立即启动
$startNow = Read-Host "是否立即启动服务？(Y/n)"
if ($startNow -ne 'n' -and $startNow -ne 'N') {
    Write-Host ""
    Write-Host "正在启动 LifeVerse 服务器..." -ForegroundColor Cyan
    Write-Host "按 Ctrl+C 可停止服务" -ForegroundColor Gray
    Write-Host ""
    & node server.js
}
