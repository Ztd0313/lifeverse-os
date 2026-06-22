/**
 * LifeVerse 远程部署工具
 *
 * 在本地运行此脚本，通过 HTTP 将部署文件推送到阿里云 ECS 服务器。
 * 前提：服务器上已有一个简单的文件接收服务。
 *
 * 使用方法：node remote-deploy.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER_IP = '120.55.38.135';
const SERVER_PORT = 3000;
const DEPLOY_DIR = 'C:\\LifeVerse';

// 部署文件列表
const DEPLOY_FILES = [
    'deploy/server.js',
    'deploy/package.json',
    'deploy/deploy.ps1',
];

console.log('');
console.log('========================================');
console.log('  LifeVerse 远程部署工具');
console.log('========================================');
console.log('');
console.log(`目标服务器: ${SERVER_IP}`);
console.log(`部署目录: ${DEPLOY_DIR}`);
console.log('');

// 检查本地文件是否存在
console.log('[1/3] 检查本地文件...');
const projectRoot = path.resolve(__dirname, '..');
for (const file of DEPLOY_FILES) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
        console.error(`  ✗ 文件不存在: ${file}`);
        process.exit(1);
    }
    console.log(`  ✓ ${file}`);
}

console.log('');
console.log('[2/3] 生成部署脚本...');

// 生成一个自包含的 PowerShell 部署脚本
const deployScript = `
# LifeVerse 自动部署脚本
# 在阿里云 ECS 服务器上运行此脚本

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   LifeVerse 一键部署" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""

# 1. 安装 Node.js
Write-Host "[1/4] 安装 Node.js..." -ForegroundColor Cyan
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer) {
        Write-Host "  已安装: $nodeVer" -ForegroundColor Green
    } else {
        throw "not installed"
    }
} catch {
    Write-Host "  正在下载 Node.js..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile '$env:TEMP\\node.msi' -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList '/i "$env:TEMP\\node.msi" /qn /norestart' -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  Node.js 安装完成" -ForegroundColor Green
}

# 2. 创建目录
Write-Host ""
Write-Host "[2/4] 创建项目目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path 'C:\\LifeVerse\\uploads' | Out-Null
Write-Host "  目录就绪" -ForegroundColor Green

# 3. 安装依赖
Write-Host ""
Write-Host "[3/4] 安装依赖..." -ForegroundColor Cyan
Set-Location 'C:\\LifeVerse'
if (-not (Test-Path 'node_modules')) {
    npm install --production
    Write-Host "  依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  依赖已存在" -ForegroundColor Green
}

# 4. 配置防火墙
Write-Host ""
Write-Host "[4/4] 配置防火墙..." -ForegroundColor Cyan
$rule = Get-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -ErrorAction SilentlyContinue
if (-not $rule) {
    New-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
    Write-Host "  端口 3000 已开放" -ForegroundColor Green
} else {
    Write-Host "  端口 3000 已开放" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   部署完成！" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""
Write-Host "启动服务：运行 C:\\LifeVerse\\start.bat" -ForegroundColor Yellow
Write-Host "访问地址：http://${SERVER_IP}:3000" -ForegroundColor Yellow
Write-Host ""
Read-Host "按回车键启动服务"
cd C:\\LifeVerse
node server.js
`;

// 将 server.js 内容嵌入
const serverJs = fs.readFileSync(path.join(projectRoot, 'deploy/server.js'), 'utf8');
const packageJson = fs.readFileSync(path.join(projectRoot, 'deploy/package.json'), 'utf8');

// 创建自解压部署包
const selfExtractScript = `
# LifeVerse 自解压部署包
# 在阿里云 ECS 服务器上运行此脚本

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   LifeVerse 自解压部署" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""

# 创建目录
New-Item -ItemType Directory -Force -Path 'C:\\LifeVerse\\uploads' | Out-Null
Write-Host "[1/5] 目录创建完成" -ForegroundColor Green

# 写入 server.js
Write-Host "[2/5] 写入 server.js..." -ForegroundColor Cyan
@'
${serverJs}
'@ | Out-File -FilePath 'C:\\LifeVerse\\server.js' -Encoding UTF8
Write-Host "  server.js 写入完成" -ForegroundColor Green

# 写入 package.json
Write-Host "[3/5] 写入 package.json..." -ForegroundColor Cyan
@'
${packageJson}
'@ | Out-File -FilePath 'C:\\LifeVerse\\package.json' -Encoding UTF8
Write-Host "  package.json 写入完成" -ForegroundColor Green

# 创建启动脚本
Write-Host "[4/5] 创建启动脚本..." -ForegroundColor Cyan
@'
@echo off
title LifeVerse Server
cd /d C:\\LifeVerse
echo.
echo ========================================
echo   LifeVerse 后端服务器
echo ========================================
echo.
node server.js
pause
'@ | Out-File -FilePath 'C:\\LifeVerse\\start.bat' -Encoding ASCII
Write-Host "  start.bat 创建完成" -ForegroundColor Green

# 安装 Node.js（如果未安装）
Write-Host "[5/5] 检查 Node.js..." -ForegroundColor Cyan
try {
    $nodeVer = & node --version 2>$null
    if ($nodeVer) {
        Write-Host "  Node.js 已安装: $nodeVer" -ForegroundColor Green
    } else { throw }
} catch {
    Write-Host "  正在安装 Node.js 20 LTS..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile '$env:TEMP\\node.msi' -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList '/i "$env:TEMP\\node.msi" /qn /norestart' -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Start-Sleep -Seconds 2
    $nodeVer = & node --version 2>$null
    Write-Host "  Node.js 安装完成: $nodeVer" -ForegroundColor Green
}

# 安装依赖
Write-Host ""
Write-Host "安装 npm 依赖..." -ForegroundColor Cyan
Set-Location 'C:\\LifeVerse'
npm install --production
Write-Host "  依赖安装完成" -ForegroundColor Green

# 配置防火墙
$rule = Get-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -ErrorAction SilentlyContinue
if (-not $rule) {
    New-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
}
Write-Host "  防火墙配置完成" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   部署完成！" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""
Write-Host "启动方式：" -ForegroundColor Yellow
Write-Host "  双击 C:\\LifeVerse\\start.bat" -ForegroundColor White
Write-Host "  或在 PowerShell 运行: cd C:\\LifeVerse; node server.js" -ForegroundColor White
Write-Host ""
Write-Host "服务地址：" -ForegroundColor Yellow
Write-Host "  http://${SERVER_IP}:3000" -ForegroundColor White
Write-Host "  http://${SERVER_IP}:3000/api/health" -ForegroundColor White
Write-Host ""

# 询问是否启动
$start = Read-Host "是否立即启动服务？(Y/n)"
if ($start -ne 'n' -and $start -ne 'N') {
    cd C:\\LifeVerse
    node server.js
}
`;

const outputPath = path.join(projectRoot, 'deploy', 'LifeVerse-Deploy.ps1');
fs.writeFileSync(outputPath, selfExtractScript, 'utf8');

console.log(`  ✓ 自解压脚本已生成: deploy/LifeVerse-Deploy.ps1`);
console.log('');
console.log('[3/3] 部署说明：');
console.log('');
console.log('  由于服务器未开启 WinRM/SSH，需要手动操作以下步骤：');
console.log('');
console.log('  步骤 1：远程桌面连接服务器');
console.log('    - 按 Win+R，输入 mstsc');
console.log('    - 计算机：120.55.38.135');
console.log('    - 用户名：administrator');
console.log('    - 密码：19920313@Zhao');
console.log('');
console.log('  步骤 2：复制部署文件到服务器');
console.log(`    - 将 deploy/LifeVerse-Deploy.ps1 复制到服务器桌面`);
console.log('');
console.log('  步骤 3：在服务器上运行部署脚本');
console.log('    - 右键 LifeVerse-Deploy.ps1 → 使用 PowerShell 运行');
console.log('    - 如果提示执行策略限制，先运行：');
console.log('      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass');
console.log('    - 然后重新运行脚本');
console.log('');
console.log('  步骤 4：验证部署');
console.log('    - 浏览器打开 http://120.55.38.135:3000/api/health');
console.log('');
console.log('========================================');
