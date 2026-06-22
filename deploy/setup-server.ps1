# LifeVerse 阿里云 ECS 部署脚本
# 服务器：Windows Server 2022
# 用途：安装 Node.js 环境，配置反向代理，启动服务

Write-Host "========================================" -ForegroundColor Gold
Write-Host "  LifeVerse 部署脚本" -ForegroundColor Gold
Write-Host "========================================" -ForegroundColor Gold
Write-Host ""

# ===== 1. 检查并安装 Node.js =====
Write-Host "[1/5] 检查 Node.js 环境..." -ForegroundColor Cyan

$nodeVersion = $null
try {
    $nodeVersion = & node --version 2>$null
} catch {}

if ($nodeVersion) {
    Write-Host "  Node.js 已安装: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  正在下载 Node.js 20 LTS..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi"
    $nodeMsi = "$env:TEMP\node-installer.msi"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
        Write-Host "  正在安装 Node.js..." -ForegroundColor Yellow
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /qn /norestart" -Wait -NoNewWindow
        Write-Host "  Node.js 安装完成" -ForegroundColor Green

        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } catch {
        Write-Host "  Node.js 安装失败: $_" -ForegroundColor Red
        Write-Host "  请手动下载安装: https://nodejs.org/" -ForegroundColor Yellow
    }
}

# 验证安装
try {
    $nodeVersion = & node --version 2>$null
    $npmVersion = & npm --version 2>$null
    Write-Host "  Node.js: $nodeVersion, npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  无法验证 Node.js 安装" -ForegroundColor Red
}

# ===== 2. 创建项目目录 =====
Write-Host ""
Write-Host "[2/5] 创建项目目录..." -ForegroundColor Cyan

$projectDir = "C:\LifeVerse"
if (-not (Test-Path $projectDir)) {
    New-Item -ItemType Directory -Force -Path $projectDir | Out-Null
    Write-Host "  已创建: $projectDir" -ForegroundColor Green
} else {
    Write-Host "  目录已存在: $projectDir" -ForegroundColor Green
}

# ===== 3. 安装 PM2 进程管理器 =====
Write-Host ""
Write-Host "[3/5] 安装 PM2 进程管理器..." -ForegroundColor Cyan

try {
    $pm2Version = & npm list -g pm2 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PM2 已安装" -ForegroundColor Green
    } else {
        & npm install -g pm2 pm2-windows-startup 2>$null
        Write-Host "  PM2 安装完成" -ForegroundColor Green
    }
} catch {
    Write-Host "  PM2 安装失败（非关键），可后续手动安装" -ForegroundColor Yellow
}

# ===== 4. 配置防火墙规则 =====
Write-Host ""
Write-Host "[4/5] 配置防火墙规则..." -ForegroundColor Cyan

$ports = @(80, 3000, 443)
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

# ===== 5. 创建启动脚本 =====
Write-Host ""
Write-Host "[5/5] 创建启动脚本..." -ForegroundColor Cyan

$startScript = @"
@echo off
echo Starting LifeVerse Server...
cd /d C:\LifeVerse
node server.js
pause
"@

$startScript | Out-File -FilePath "$projectDir\start.bat" -Encoding ASCII
Write-Host "  已创建启动脚本: $projectDir\start.bat" -ForegroundColor Green

# ===== 完成 =====
Write-Host ""
Write-Host "========================================" -ForegroundColor Gold
Write-Host "  部署准备完成！" -ForegroundColor Gold
Write-Host "========================================" -ForegroundColor Gold
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "  1. 将项目文件上传到 C:\LifeVerse 目录" -ForegroundColor White
Write-Host "  2. 运行 npm install 安装依赖" -ForegroundColor White
Write-Host "  3. 运行 start.bat 启动服务" -ForegroundColor White
Write-Host "  4. 访问 http://120.55.38.135:3000 验证" -ForegroundColor White
Write-Host ""
