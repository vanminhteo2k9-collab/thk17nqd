#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
THK17 (2025 - 2028) // C++ ARCHITECTURAL PORTAL — NON-STATIC BACKEND SERVER (Python 3)
THPT Chuyên Nguyễn Quang Diêu — Phường Mỹ Trà, Tỉnh Đồng Tháp
Người thiết kế: Mai Thiên Phú

Chạy bằng lệnh:
    python server.py
"""

import os
import json
import time
import sqlite3
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", 5500))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "thk17_database.sqlite")
JSON_PATH = os.path.join(DATA_DIR, "thk17_state.json")

os.makedirs(DATA_DIR, exist_ok=True)

def init_storage():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS metrics (key TEXT PRIMARY KEY, value INTEGER)")
    c.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient TEXT, sender_name TEXT, sender_contact TEXT, message TEXT, created_at TEXT)")
    c.execute("INSERT OR IGNORE INTO metrics (key, value) VALUES ('total_visits', 1)")
    conn.commit()
    conn.close()

init_storage()
active_sessions = {}
SESSION_TIMEOUT = 25.0

def prune_sessions():
    now = time.time()
    expired = [k for k, v in active_sessions.items() if now - v > SESSION_TIMEOUT]
    for k in expired:
        active_sessions.pop(k, None)

def get_total_visits():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT value FROM metrics WHERE key='total_visits'")
    row = c.fetchone()
    conn.close()
    return row[0] if row else 1

def increment_total_visits():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE metrics SET value = value + 1 WHERE key='total_visits'")
    conn.commit()
    c.execute("SELECT value FROM metrics WHERE key='total_visits'")
    total = c.fetchone()[0]
    conn.close()
    # Đồng bộ sang file JSON
    try:
        state = {"totalVisits": total, "messages": []}
        if os.path.exists(JSON_PATH):
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                state = json.load(f)
        state["totalVisits"] = total
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    return total

def save_message(sender_name, sender_contact, message):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    c.execute(
        "INSERT INTO messages (recipient, sender_name, sender_contact, message, created_at) VALUES (?, ?, ?, ?, ?)",
        ("Mai Thiên Phú (Người thiết kế)", sender_name, sender_contact, message, ts)
    )
    conn.commit()
    conn.close()

class THK17Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/cloud":
            state = {"accounts": {}, "photos": [], "deletedIds": [], "updatedAt": int(time.time() * 1000)}
            if os.path.exists(JSON_PATH):
                try:
                    with open(JSON_PATH, "r", encoding="utf-8") as f:
                        saved = json.load(f)
                        state = saved.get("cloud", state)
                except Exception:
                    pass
            resp = json.dumps(state).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {}

        if parsed.path == "/api/stats":
            prune_sessions()
            client_id = payload.get("clientId") or self.client_address[0]
            if payload.get("action") == "leave":
                active_sessions.pop(client_id, None)
                total = get_total_visits()
            else:
                active_sessions[client_id] = time.time()
                if payload.get("increment"):
                    total = increment_total_visits()
                else:
                    total = get_total_visits()
            prune_sessions()
            resp = json.dumps({"online": max(1, len(active_sessions)), "totalVisits": total}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return

        if parsed.path == "/api/contact":
            save_message(
                payload.get("sender_name", "Khách"),
                payload.get("sender_contact", ""),
                payload.get("message", "")
            )
            resp = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return

        if parsed.path == "/api/cloud":
            state = {"accounts": {}, "photos": [], "deletedIds": [], "updatedAt": int(time.time() * 1000)}
            if os.path.exists(JSON_PATH):
                try:
                    with open(JSON_PATH, "r", encoding="utf-8") as f:
                        saved = json.load(f)
                        state = saved.get("cloud", state)
                except Exception:
                    pass
            if payload.get("accounts"):
                state["accounts"].update(payload["accounts"])
            if isinstance(payload.get("photos"), list):
                m = {p["id"]: p for p in state.get("photos", []) if p.get("id")}
                for p in payload["photos"]:
                    if p.get("id"):
                        m[p["id"]] = p
                state["photos"] = list(m.values())
            if isinstance(payload.get("deletedIds"), list):
                del_set = set(state.get("deletedIds", []))
                for d in payload["deletedIds"]:
                    del_set.add(d)
                state["deletedIds"] = list(del_set)
                state["photos"] = [p for p in state.get("photos", []) if p.get("id") not in del_set]
            state["updatedAt"] = int(time.time() * 1000)
            try:
                full_saved = {}
                if os.path.exists(JSON_PATH):
                    with open(JSON_PATH, "r", encoding="utf-8") as f:
                        full_saved = json.load(f)
                full_saved["cloud"] = state
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(full_saved, f, ensure_ascii=False, indent=2)
            except Exception:
                pass
            resp = json.dumps({"ok": True, "updatedAt": state["updatedAt"]}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
            return

        self.send_error(404, "Endpoint Not Found")

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    os.chdir(ROOT_DIR)
    print("====================================================================")
    print(f" THK17 (25-28) // PYTHON NON-STATIC SERVER DANG CHAY TAI: http://localhost:{PORT}")
    print(f" Co so du lieu vinh vien: {DB_PATH}")
    print("====================================================================")
    HTTPServer(("0.0.0.0", PORT), THK17Handler).serve_forever()
