let activeMap = new Map();
let fallbackTotal = 1;

export default async function handler(req, res) {
    const now = Date.now();
    for (const [k, t] of activeMap.entries()) {
        if (now - t > 25000) activeMap.delete(k);
    }

    let body = {};
    if (req.method === 'POST') {
        body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    }
    const clientId = body.clientId || req.headers['x-forwarded-for'] || 'visitor';

    if (body.action === 'leave') {
        activeMap.delete(clientId);
    } else {
        activeMap.set(clientId, now);
    }

    let totalVisits = fallbackTotal;
    try {
        const url = body.increment
            ? 'https://api.counterapi.dev/v1/thk17_chuyen_nqd_25_28/visits/up'
            : 'https://api.counterapi.dev/v1/thk17_chuyen_nqd_25_28/visits';
        const r = await fetch(url);
        if (r.ok) {
            const d = await r.json();
            if (d && typeof d.count === 'number') {
                totalVisits = d.count;
                fallbackTotal = totalVisits;
            }
        }
    } catch (_) {
        if (body.increment) fallbackTotal += 1;
        totalVisits = fallbackTotal;
    }

    res.status(200).json({
        online: Math.max(1, activeMap.size),
        totalVisits
    });
}
