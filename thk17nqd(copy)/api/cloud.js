/**
 * THK17 CLOUD SYNC SERVERLESS API (Vercel)
 * Đồng bộ dữ liệu tài khoản và ảnh kỷ niệm siêu tốc độ giữa các thiết bị
 */

let memoryCloudState = {
    accounts: {},
    photos: [],
    deletedIds: [],
    updatedAt: Date.now()
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json(memoryCloudState);
    }

    if (req.method === 'POST') {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
            
            if (body.accounts && typeof body.accounts === 'object') {
                memoryCloudState.accounts = Object.assign({}, memoryCloudState.accounts, body.accounts);
            }
            if (Array.isArray(body.photos)) {
                const map = new Map();
                (memoryCloudState.photos || []).forEach(p => { if (p && p.id) map.set(p.id, p); });
                body.photos.forEach(p => { if (p && p.id) map.set(p.id, p); });
                memoryCloudState.photos = Array.from(map.values());
            }
            if (Array.isArray(body.deletedIds)) {
                const delSet = new Set(memoryCloudState.deletedIds || []);
                body.deletedIds.forEach(id => delSet.add(id));
                memoryCloudState.deletedIds = Array.from(delSet);
                memoryCloudState.photos = (memoryCloudState.photos || []).filter(p => !delSet.has(p.id));
            }
            memoryCloudState.updatedAt = Date.now();

            return res.status(200).json({ ok: true, updatedAt: memoryCloudState.updatedAt });
        } catch (e) {
            return res.status(400).json({ ok: false, error: e.message });
        }
    }

    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}
