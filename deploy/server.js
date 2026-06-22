/**
 * LifeVerse 后端服务器 v2.0
 *
 * 独立 Express 服务器，部署在阿里云 ECS 上
 * 功能：文件上传、记忆管理 API、SQLite 数据库（sql.js 纯 JS 实现）
 * 端口：3000
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SQLite 数据库（sql.js 纯 JS，无需编译） =====
const DB_PATH = path.join(__dirname, 'data', 'lifeverse.db');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db = null;

async function initDatabase() {
    try {
        const SQL = await initSqlJs();

        // 如果数据库文件已存在，从文件加载
        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(fileBuffer);
            console.log('[SQLite] 从文件加载数据库');
        } else {
            db = new SQL.Database();
            console.log('[SQLite] 创建新数据库');
        }

        // 创建表
        db.run(`
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT DEFAULT 'text',
                emotion TEXT DEFAULT 'warm',
                category TEXT DEFAULT 'forest',
                tags TEXT DEFAULT '["新建"]',
                importance REAL DEFAULT 0.5,
                file_url TEXT,
                file_name TEXT,
                file_size INTEGER,
                file_mime_type TEXT,
                thumbnail_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS councils (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                agents TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                avatar TEXT,
                role TEXT DEFAULT 'user',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        saveDatabase();
        console.log('[SQLite] 数据库初始化成功');
        console.log(`[SQLite] 数据库文件: ${DB_PATH}`);
    } catch (error) {
        console.error('[SQLite] 数据库初始化失败:', error.message);
        db = null;
    }
}

/** 保存数据库到文件 */
function saveDatabase() {
    if (!db) return;
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (error) {
        console.error('[SQLite] 保存失败:', error.message);
    }
}

/** 查询辅助：执行 SELECT 返回数组 */
function queryAll(sql, params = []) {
    if (!db) return [];
    try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (error) {
        console.error('[SQLite] 查询失败:', error.message);
        return [];
    }
}

/** 查询辅助：执行 SELECT 返回单条 */
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

// ===== 中间件 =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== 上传目录 =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ===== 静态文件服务 =====
app.use('/uploads', express.static(UPLOAD_DIR));

// ===== Multer 文件上传配置 =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'text/plain', 'text/markdown',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// ===== API 路由 =====

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    const health = {
        status: 'ok',
        server: 'LifeVerse Backend',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: db ? 'connected (SQLite)' : 'disconnected',
        dbSize: 0,
        uploads: 0,
    };

    try {
        if (fs.existsSync(DB_PATH)) {
            health.dbSize = fs.statSync(DB_PATH).size;
        }
    } catch {}

    try {
        health.uploads = fs.readdirSync(UPLOAD_DIR).length;
    } catch {}

    res.json(health);
});

/**
 * 文件上传 API
 * POST /api/upload
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '未提供文件' });
        }
        res.json({
            success: true,
            url: `/uploads/${req.file.filename}`,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Multer 错误处理
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: '文件大小超过限制（最大 50MB）' });
        }
        return res.status(400).json({ success: false, error: `上传错误: ${err.message}` });
    }
    if (err.message && err.message.includes('不支持的文件类型')) {
        return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
});

/**
 * 获取记忆列表
 * GET /api/memories
 */
app.get('/api/memories', (req, res) => {
    try {
        if (!db) return res.status(503).json({ success: false, error: '数据库未连接' });

        const { category, type, emotion, sort, limit, page } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;

        let sql = 'SELECT * FROM memories WHERE 1=1';
        const params = [];

        if (category) { sql += ' AND category = ?'; params.push(category); }
        if (type) { sql += ' AND type = ?'; params.push(type); }
        if (emotion) { sql += ' AND emotion = ?'; params.push(emotion); }

        if (sort === 'importance') {
            sql += ' ORDER BY importance DESC';
        } else {
            sql += ' ORDER BY created_at DESC';
        }

        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const rows = queryAll(sql, params);

        // 总数
        let countSql = 'SELECT COUNT(*) as total FROM memories WHERE 1=1';
        const countParams = [];
        if (category) { countSql += ' AND category = ?'; countParams.push(category); }
        if (type) { countSql += ' AND type = ?'; countParams.push(type); }
        if (emotion) { countSql += ' AND emotion = ?'; countParams.push(emotion); }
        const countResult = queryOne(countSql, countParams);

        const data = rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            type: row.type,
            emotion: row.emotion,
            category: row.category,
            tags: JSON.parse(row.tags || '[]'),
            importance: row.importance,
            date: row.created_at,
            fileUrl: row.file_url,
            fileName: row.file_name,
            fileSize: row.file_size,
            fileMimeType: row.file_mime_type,
            thumbnailUrl: row.thumbnail_url,
        }));

        res.json({
            success: true,
            data,
            total: countResult ? countResult.total : 0,
            page: pageNum,
            limit: limitNum,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 创建记忆
 * POST /api/memories
 */
app.post('/api/memories', (req, res) => {
    try {
        if (!db) return res.status(503).json({ success: false, error: '数据库未连接' });

        const { title, content, type, emotion, category, tags, importance, fileUrl, fileName, fileSize, fileMimeType } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, error: '标题和内容不能为空' });
        }

        const id = `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const tagsJson = JSON.stringify(tags || ['新建']);

        db.run(
            `INSERT INTO memories (id, title, content, type, emotion, category, tags, importance, file_url, file_name, file_size, file_mime_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, content, type || 'text', emotion || 'warm', category || 'forest', tagsJson, importance || 0.5, fileUrl || null, fileName || null, fileSize || null, fileMimeType || null]
        );
        saveDatabase();

        const memory = {
            id, title, content,
            type: type || 'text',
            emotion: emotion || 'warm',
            category: category || 'forest',
            tags: tags || ['新建'],
            importance: importance || 0.5,
            date: new Date().toISOString(),
            ...(fileUrl ? { fileUrl, fileName, fileSize, fileMimeType } : {}),
        };

        res.status(201).json({ success: true, data: memory });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 获取单条记忆
 * GET /api/memories/:id
 */
app.get('/api/memories/:id', (req, res) => {
    try {
        if (!db) return res.status(503).json({ success: false, error: '数据库未连接' });

        const row = queryOne('SELECT * FROM memories WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, error: '记忆不存在' });

        res.json({
            success: true,
            data: {
                id: row.id, title: row.title, content: row.content,
                type: row.type, emotion: row.emotion, category: row.category,
                tags: JSON.parse(row.tags || '[]'),
                importance: row.importance, date: row.created_at,
                fileUrl: row.file_url, fileName: row.file_name,
                fileSize: row.file_size, fileMimeType: row.file_mime_type,
                thumbnailUrl: row.thumbnail_url,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 删除记忆
 * DELETE /api/memories/:id
 */
app.delete('/api/memories/:id', (req, res) => {
    try {
        if (!db) return res.status(503).json({ success: false, error: '数据库未连接' });

        const row = queryOne('SELECT file_url FROM memories WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, error: '记忆不存在' });

        if (row.file_url) {
            const filename = path.basename(row.file_url);
            const filePath = path.join(UPLOAD_DIR, filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        db.run('DELETE FROM memories WHERE id = ?', [req.params.id]);
        saveDatabase();
        res.json({ success: true, message: '记忆已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 获取统计数据（管理后台用）
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
    try {
        if (!db) return res.status(503).json({ success: false, error: '数据库未连接' });

        const memCount = queryOne('SELECT COUNT(*) as count FROM memories');
        const couCount = queryOne('SELECT COUNT(*) as count FROM councils');
        const usrCount = queryOne('SELECT COUNT(*) as count FROM users');
        const todayMem = queryOne("SELECT COUNT(*) as count FROM memories WHERE DATE(created_at) = DATE('now')");

        res.json({
            success: true,
            data: {
                totalMemories: memCount ? memCount.count : 0,
                totalCouncils: couCount ? couCount.count : 0,
                totalUsers: usrCount ? usrCount.count : 0,
                todayMemories: todayMem ? todayMem.count : 0,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== 启动服务器 =====
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('========================================');
        console.log('  LifeVerse 后端服务器 v2.0');
        console.log('========================================');
        console.log(`  地址: http://120.55.38.135:${PORT}`);
        console.log(`  API:  http://120.55.38.135:${PORT}/api/health`);
        console.log(`  上传: http://120.55.38.135:${PORT}/api/upload`);
        console.log(`  数据库: ${db ? 'SQLite (' + DB_PATH + ')' : '未连接'}`);
        console.log(`  时间: ${new Date().toLocaleString('zh-CN')}`);
        console.log('========================================');
        console.log('');
    });
}).catch(err => {
    console.error('启动失败:', err);
    process.exit(1);
});
