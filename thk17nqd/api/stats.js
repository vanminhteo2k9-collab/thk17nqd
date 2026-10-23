let activeDevices = new Map();

export default async function handler(req, res) {
    const now = Date.now();
    for (const [id, lastSeen] of activeDevices.entries()) {
        if (now - lastSeen > 25000) activeDevices.delete(id);
    }

    let body = {};
    if (req.method === 'POST') {
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        } catch (_) {}
    }

    const clientId = body.clientId || req.headers['x-forwarded-for'] || 'anon';
    if (body.action === 'leave') {
        activeDevices.delete(clientId);
    } else {
        activeDevices.set(clientId, now);
    }

    res.status(200).json({
        online: Math.max(1, activeDevices.size)
    });
}