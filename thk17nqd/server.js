/**
 * THK17 (2025 - 2028) // C++ ARCHITECTURAL PORTAL — NON-STATIC BACKEND SERVER (Node.js)
 * THPT Chuyên Nguyễn Quang Diêu — Phường Mỹ Trà, Tỉnh Đồng Tháp
 * Người thiết kế: Mai Thiên Phú
 *
 * Chức năng:
 * 1. Lưu trữ vĩnh viễn Số lượt đã truy cập (totalVisits) và danh sách tin nhắn Liên hệ vào data/thk17_state.json
 * 2. Đếm chính xác Số lượt đang truy cập hiện tại (online) theo thời gian thực (Heartbeat 25 giây)
 * 3. Phục vụ trực tiếp index.html, nen.webp, PD.webp và tự động nhận diện 1.webp -> 50.webp trong thư mục
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'thk17_state.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const raw = fs.readFileSync(STATE_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 1,
                messages: Array.isArray(parsed.messages) ? parsed.messages : []
            };
        }
    } catch (e) {}
    return { totalVisits: 1, messages: [] };
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
        console.error('Lỗi lưu dữ liệu:', e);
    }
}

const appState = loadState();
saveState(appState);

// Quản lý phiên đang truy cập hiện tại (clientId -> timestamp)
const activeClients = new Map();
const SESSION_TIMEOUT_MS = 25000;

function pruneActiveClients() {
    const now = Date.now();
    for (const [id, lastSeen] of activeClients.entries()) {
        if (now - lastSeen > SESSION_TIMEOUT_MS) {
            activeClients.delete(id);
        }
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function readBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (_) { resolve({}); }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 1. API Đếm lượt truy cập & Đang trực tuyến (/api/stats)
    if (pathname === '/api/stats') {
        pruneActiveClients();
        if (req.method === 'POST') {
            const payload = await readBody(req);
            const clientId = payload.clientId || req.socket.remoteAddress || 'anon';
            if (payload.action === 'leave') {
                activeClients.delete(clientId);
            } else {
                activeClients.set(clientId, Date.now());
                if (payload.increment) {
                    appState.totalVisits += 1;
                    saveState(appState);
                }
            }
        }
        pruneActiveClients();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            online: Math.max(1, activeClients.size),
            totalVisits: appState.totalVisits
        }));
    }

    // 2. API Lưu tin nhắn liên hệ gửi cho Mai Thiên Phú (/api/contact)
    if (pathname === '/api/contact' && req.method === 'POST') {
        const payload = await readBody(req);
        const entry = {
            id: Date.now(),
            recipient: 'Mai Thiên Phú (Người thiết kế)',
            sender_name: payload.sender_name || 'Khách',
            sender_contact: payload.sender_contact || '',
            message: payload.message || '',
            timestamp: new Date().toISOString()
        };
        appState.messages.push(entry);
        saveState(appState);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: true, saved: entry }));
    }

    // 2B. API Đồng bộ Đám mây siêu tốc độ nội bộ (/api/cloud)
    if (pathname === '/api/cloud') {
        if (!appState.cloud) {
            appState.cloud = { accounts: {}, photos: [], deletedIds: [], updatedAt: Date.now() };
        }
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(appState.cloud));
        }
        if (req.method === 'POST') {
            const body = await readBody(req);
            if (body.accounts) {
                appState.cloud.accounts = Object.assign({}, appState.cloud.accounts, body.accounts);
            }
            if (Array.isArray(body.photos)) {
                const map = new Map();
                (appState.cloud.photos || []).forEach(p => { if (p && p.id) map.set(p.id, p); });
                body.photos.forEach(p => { if (p && p.id) map.set(p.id, p); });
                appState.cloud.photos = Array.from(map.values());
            }
            if (Array.isArray(body.deletedIds)) {
                const delSet = new Set(appState.cloud.deletedIds || []);
                body.deletedIds.forEach(id => delSet.add(id));
                appState.cloud.deletedIds = Array.from(delSet);
                appState.cloud.photos = (appState.cloud.photos || []).filter(p => !delSet.has(p.id));
            }
            appState.cloud.updatedAt = Date.now();
            saveState(appState);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ ok: true, updatedAt: appState.cloud.updatedAt }));
        }
    }

    // 3. Phục vụ file tĩnh (index.html, nen.webp, PD.webp, 1.webp -> 50.webp)
    let safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(ROOT_DIR, path.normalize(safePath).replace(/^(\.\.[\/\\])+/, ''));

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': mime,
            'Cache-Control': ext === '.webp' ? 'no-cache' : 'no-store'
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log('====================================================================');
    console.log(' THK17 (25-28) // HE THONG WEB KHONG TINH DA KHOI DONG');
    console.log(` Truy cap tai: http://localhost:${PORT}`);
    console.log(` Du lieu luu vinh vien tai: ${STATE_FILE}`);
    console.log('====================================================================');
});
