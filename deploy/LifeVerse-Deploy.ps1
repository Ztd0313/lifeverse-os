
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
New-Item -ItemType Directory -Force -Path 'C:\LifeVerse\uploads' | Out-Null
Write-Host "[1/5] 目录创建完成" -ForegroundColor Green

# 写入 server.js
Write-Host "[2/5] 写入 server.js..." -ForegroundColor Cyan
@'
/**
 * LifeVerse 后端服务器
 *
 * 独立 Express 服务器，部署在阿里云 ECS 上
 * 功能：文件上传、记忆管理 API、静态文件服务
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

// ===== 中间件 =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== 上传目录 =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// 确保目录存在
[UPLOAD_DIR, PUBLIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[初始化] 创建目录: ${dir}`);
    }
});

// ===== 静态文件服务 =====
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/public', express.static(PUBLIC_DIR));

// ===== Multer 文件上传配置 =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(4).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${timestamp}_${randomStr}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        // 图片
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        // 音频
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
        // 视频
        'video/mp4', 'video/webm', 'video/quicktime',
        // 文档
        'application/pdf', 'text/plain', 'text/markdown',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    }
});

// ===== 内存数据存储（后续可替换为数据库） =====
let memories = [];

// ===== API 路由 =====

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'LifeVerse Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            uploads: fs.readdirSync(UPLOAD_DIR).length,
            totalSize: getDirSize(UPLOAD_DIR),
        }
    });
});

/**
 * 文件上传 API
 * POST /api/upload
 * Content-Type: multipart/form-data
 * Fields: file (required), title, content, type, emotion
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '未提供文件，请选择要上传的文件'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            title: req.body.title || '',
            content: req.body.content || '',
            memoryType: req.body.type || '',
            emotion: req.body.emotion || '',
        });
    } catch (error) {
        console.error('[上传 API] 文件上传失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '服务器内部错误'
        });
    }
});

// Muliter 错误处理
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `文件大小超过限制（最大 50MB）`
            });
        }
        return res.status(400).json({
            success: false,
            error: `上传错误: ${err.message}`
        });
    }
    if (err.message && err.message.includes('不支持的文件类型')) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next(err);
});

/**
 * 获取记忆列表
 * GET /api/memories
 * Query: category, type, emotion, sort, limit
 */
app.get('/api/memories', (req, res) => {
    let result = [...memories];

    // 筛选
    if (req.query.category) {
        result = result.filter(m => m.category === req.query.category);
    }
    if (req.query.type) {
        result = result.filter(m => m.type === req.query.type);
    }
    if (req.query.emotion) {
        result = result.filter(m => m.emotion === req.query.emotion);
    }

    // 排序
    if (req.query.sort === 'date') {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (req.query.sort === 'importance') {
        result.sort((a, b) => b.importance - a.importance);
    }

    // 限制数量
    if (req.query.limit) {
        result = result.slice(0, parseInt(req.query.limit));
    }

    res.json({
        success: true,
        data: result,
        total: result.length,
    });
});

/**
 * 创建记忆
 * POST /api/memories
 */
app.post('/api/memories', (req, res) => {
    try {
        const { title, content, type, emotion, category, tags, importance, fileUrl, fileName, fileSize, fileMimeType } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: '标题和内容不能为空'
            });
        }

        const memory = {
            id: `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            title,
            content,
            type: type || 'text',
            emotion: emotion || 'warm',
            category: category || 'forest',
            date: new Date().toISOString(),
            tags: tags || ['新建'],
            importance: importance || 0.5,
            ...(fileUrl ? { fileUrl, fileName, fileSize, fileMimeType } : {}),
        };

        memories.unshift(memory);

        res.status(201).json({
            success: true,
            data: memory,
        });
    } catch (error) {
        console.error('[记忆 API] 创建失败:', error);
        res.status(500).json({
            success: false,
            error: error.message || '创建记忆失败'
        });
    }
});

/**
 * 删除记忆
 * DELETE /api/memories/:id
 */
app.delete('/api/memories/:id', (req, res) => {
    const id = req.params.id;
    const index = memories.findIndex(m => m.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: '记忆不存在'
        });
    }

    // 如果有关联文件，也删除文件
    const memory = memories[index];
    if (memory.fileUrl) {
        const filename = path.basename(memory.fileUrl);
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[清理] 删除文件: ${filename}`);
        }
    }

    memories.splice(index, 1);

    res.json({
        success: true,
        message: '记忆已删除'
    });
});

// ===== 工具函数 =====
function getDirSize(dirPath) {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                size += stats.size;
            }
        });
    } catch {}
    return size;
}

// ===== 启动服务器 =====
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('========================================');
    console.log('  LifeVerse 后端服务器已启动');
    console.log('========================================');
    console.log(`  地址: http://120.55.38.135:${PORT}`);
    console.log(`  API:  http://120.55.38.135:${PORT}/api/health`);
    console.log(`  上传: http://120.55.38.135:${PORT}/api/upload`);
    console.log(`  时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log('========================================');
    console.log('');
});

'@ | Out-File -FilePath 'C:\LifeVerse\server.js' -Encoding UTF8
Write-Host "  server.js 写入完成" -ForegroundColor Green

# 写入 package.json
Write-Host "[3/5] 写入 package.json..." -ForegroundColor Cyan
@'
{
  "name": "lifeverse-server",
  "version": "1.0.0",
  "description": "LifeVerse 后端服务器 - 文件上传与 API 服务",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}

'@ | Out-File -FilePath 'C:\LifeVerse\package.json' -Encoding UTF8
Write-Host "  package.json 写入完成" -ForegroundColor Green

# 创建启动脚本
Write-Host "[4/5] 创建启动脚本..." -ForegroundColor Cyan
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
'@ | Out-File -FilePath 'C:\LifeVerse\start.bat' -Encoding ASCII
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
    Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi' -OutFile '$env:TEMP\node.msi' -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList '/i "$env:TEMP\node.msi" /qn /norestart' -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Start-Sleep -Seconds 2
    $nodeVer = & node --version 2>$null
    Write-Host "  Node.js 安装完成: $nodeVer" -ForegroundColor Green
}

# 安装依赖
Write-Host ""
Write-Host "安装 npm 依赖..." -ForegroundColor Cyan
Set-Location 'C:\LifeVerse'
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
Write-Host "  双击 C:\LifeVerse\start.bat" -ForegroundColor White
Write-Host "  或在 PowerShell 运行: cd C:\LifeVerse; node server.js" -ForegroundColor White
Write-Host ""
Write-Host "服务地址：" -ForegroundColor Yellow
Write-Host "  http://120.55.38.135:3000" -ForegroundColor White
Write-Host "  http://120.55.38.135:3000/api/health" -ForegroundColor White
Write-Host ""

# 询问是否启动
$start = Read-Host "是否立即启动服务？(Y/n)"
if ($start -ne 'n' -and $start -ne 'N') {
    cd C:\LifeVerse
    node server.js
}
