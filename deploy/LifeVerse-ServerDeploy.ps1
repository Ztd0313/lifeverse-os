# LifeVerse 服务器端一键部署脚本
# 在阿里云 ECS 服务器上通过 PowerShell 直接运行此脚本
# 无需从本地复制文件，脚本会自动生成所有需要的文件

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   LifeVerse 一键部署（服务器端）" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""

# ===== 1. 创建目录 =====
Write-Host "[1/5] 创建项目目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "C:\LifeVerse\uploads" | Out-Null
Write-Host "  目录就绪: C:\LifeVerse" -ForegroundColor Green

# ===== 2. 生成 server.js =====
Write-Host "[2/5] 生成 server.js..." -ForegroundColor Cyan

$serverJs = @'
/**
 * LifeVerse 后端服务器
 * 端口：3000
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + '_' + crypto.randomBytes(4).toString('hex') + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg','image/png','image/gif','image/webp',
        'audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/x-m4a',
        'video/mp4','video/webm','video/quicktime',
        'application/pdf','text/plain','text/markdown',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

let memories = [];

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'LifeVerse Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: '未提供文件' });
        res.json({
            success: true,
            url: '/uploads/' + req.file.filename,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/memories', (req, res) => {
    res.json({ success: true, data: memories, total: memories.length });
});

app.post('/api/memories', (req, res) => {
    try {
        const { title, content, type, emotion, category, tags, importance, fileUrl } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, error: '标题和内容不能为空' });
        const memory = {
            id: 'mem_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
            title, content, type: type || 'text', emotion: emotion || 'warm',
            category: category || 'forest', date: new Date().toISOString(),
            tags: tags || ['新建'], importance: importance || 0.5,
            ...(fileUrl ? { fileUrl } : {}),
        };
        memories.unshift(memory);
        res.status(201).json({ success: true, data: memory });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/memories/:id', (req, res) => {
    const idx = memories.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: '记忆不存在' });
    memories.splice(idx, 1);
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('========================================');
    console.log('  LifeVerse 后端服务器已启动');
    console.log('========================================');
    console.log('  地址: http://120.55.38.135:' + PORT);
    console.log('  API:  http://120.55.38.135:' + PORT + '/api/health');
    console.log('  时间: ' + new Date().toLocaleString('zh-CN'));
    console.log('========================================');
    console.log('');
});
'@

$serverJs | Out-File -FilePath "C:\LifeVerse\server.js" -Encoding UTF8
Write-Host "  server.js 生成完成" -ForegroundColor Green

# ===== 3. 生成 package.json =====
Write-Host "[3/5] 生成 package.json..." -ForegroundColor Cyan

$packageJson = @'
{
  "name": "lifeverse-server",
  "version": "1.0.0",
  "description": "LifeVerse Backend Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}
'@

$packageJson | Out-File -FilePath "C:\LifeVerse\package.json" -Encoding UTF8
Write-Host "  package.json 生成完成" -ForegroundColor Green

# ===== 4. 安装 Node.js 和依赖 =====
Write-Host "[4/5] 检查 Node.js 并安装依赖..." -ForegroundColor Cyan

$nodeVer = $null
try { $nodeVer = & node --version 2>$null } catch {}

if (-not $nodeVer) {
    Write-Host "  正在安装 Node.js 20 LTS..." -ForegroundColor Yellow
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile "$env:TEMP\node.msi" -UseBasicParsing
        Start-Process msiexec.exe -ArgumentList "/i `"$env:TEMP\node.msi`" /qn /norestart" -Wait
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Start-Sleep -Seconds 3
        $nodeVer = & node --version 2>$null
        Write-Host "  Node.js 安装完成: $nodeVer" -ForegroundColor Green
    } catch {
        Write-Host "  Node.js 安装失败: $_" -ForegroundColor Red
        Write-Host "  请手动下载安装: https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "安装完成后按回车继续"
    }
} else {
    Write-Host "  Node.js 已安装: $nodeVer" -ForegroundColor Green
}

Write-Host "  安装 npm 依赖..." -ForegroundColor Yellow
Set-Location "C:\LifeVerse"
if (-not (Test-Path "node_modules")) {
    npm install --production 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host "  依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  依赖已存在" -ForegroundColor Green
}

# ===== 5. 配置防火墙 =====
Write-Host "[5/5] 配置防火墙..." -ForegroundColor Cyan
$rule = Get-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -ErrorAction SilentlyContinue
if (-not $rule) {
    New-NetFirewallRule -DisplayName 'LifeVerse-Port-3000' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
    Write-Host "  端口 3000 已开放" -ForegroundColor Green
} else {
    Write-Host "  端口 3000 已开放" -ForegroundColor Green
}

# ===== 创建启动脚本 =====
@'
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
'@ | Out-File -FilePath "C:\LifeVerse\start.bat" -Encoding ASCII

# ===== 完成 =====
Write-Host ""
Write-Host "============================================" -ForegroundColor Gold
Write-Host "   部署完成！" -ForegroundColor Gold
Write-Host "============================================" -ForegroundColor Gold
Write-Host ""
Write-Host "服务地址：" -ForegroundColor Yellow
Write-Host "  http://120.55.38.135:3000" -ForegroundColor White
Write-Host "  http://120.55.38.135:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "启动方式：" -ForegroundColor Yellow
Write-Host "  双击 C:\LifeVerse\start.bat" -ForegroundColor White
Write-Host ""

$start = Read-Host "是否立即启动服务？(Y/n)"
if ($start -ne 'n' -and $start -ne 'N') {
    Write-Host ""
    Write-Host "正在启动 LifeVerse 服务器..." -ForegroundColor Cyan
    Write-Host "按 Ctrl+C 可停止服务" -ForegroundColor Gray
    Write-Host ""
    Set-Location "C:\LifeVerse"
    node server.js
}
