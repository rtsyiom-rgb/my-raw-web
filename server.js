const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

// --- ปรับขยายเพดานรับข้อมูลเป็น 1GB ตามที่ขอครับ ---
app.use(express.urlencoded({ limit: '1gb', extended: true }));
app.use(express.json({ limit: '1gb' }));

// --- หน้าแรกสำหรับสร้างสคริปต์ ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f111a; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
            <div style="background:#1a1c2e; padding:30px; border-radius:15px; border:1px solid #2d304d; width:400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <h2 style="color:#5765f2; text-align:center; margin-bottom:20px;">SCRIPT HUB (1GB MAX)</h2>
                <form action="/save" method="POST">
                    <input type="text" name="title" placeholder="ชื่อไฟล์ (เช่น MegaScript.lua)" style="width:100%; padding:10px; margin-bottom:10px; background:#0f111a; border:1px solid #333; color:white; border-radius:5px;" required>
                    <textarea name="content" placeholder="วางโค้ดสคริปต์ที่นี่..." style="width:100%; height:150px; background:#0f111a; border:1px solid #333; color:#00ff88; border-radius:5px; font-family:monospace;" required></textarea>
                    <input type="text" name="password" placeholder="รหัสผ่าน (ถ้ามี)" style="width:100%; padding:10px; margin-top:10px; background:#0f111a; border:1px solid #333; color:white; border-radius:5px;">
                    <button type="submit" style="width:100%; padding:15px; background:#5765f2; border:none; color:white; font-weight:bold; margin-top:20px; cursor:pointer; border-radius:5px;">GENERATE</button>
                </form>
            </div>
        </body>
    `);
});

// --- ระบบบันทึก ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    
    // โหลด DB มาเขียนข้อมูลใหม่
    try {
        const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db[id] = { title: title || "script.lua", content, password: password || "" };
        fs.writeFileSync(DATA_FILE, JSON.stringify(db));
        res.redirect('/' + id + '.lua'); 
    } catch (err) {
        res.status(500).send("Error: File too large for server memory.");
    }
});

// --- หน้าแสดงผล (Loadstring Only) ---
app.get('/:id.lua', (req, res) => {
    const id = req.params.id;
    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return res.status(500).send("Database Error");
    }
    
    const entry = db[id];
    if (!entry) return res.status(404).send("Not Found");

    const userAgent = req.headers['user-agent'] || "";
    const isBrowser = userAgent.includes("Mozilla") || userAgent.includes("Chrome") || userAgent.includes("Safari");

    if (isBrowser) {
        const rawUrl = `${req.protocol}://${req.get('host')}/${id}.lua${entry.password ? '?key=' + entry.password : ''}`;
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Loadstring Viewer</title>
                <style>
                    body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .code-container { background: #151726; border: 1px solid #2d304d; border-radius: 12px; width: 90%; max-width: 800px; padding: 25px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
                    .code-box { font-family: 'Consolas', monospace; font-size: 16px; color: #dcdccc; white-space: pre-wrap; word-break: break-all; }
                    .copy-btn { position: absolute; top: 15px; right: 15px; background: #323552; color: #fff; border: none; padding: 7px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                    .footer { margin-top: 20px; color: #5c607a; font-size: 12px; }
                </style>
            </head>
            <body>
                <div style="font-size:22px; margin-bottom:20px;">📜 Loadstring</div>
                <div class="code-container">
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    <div class="code-box">
<span style="color:#569cd6;">loadstring</span>(<span style="color:#9cdcfe;">game</span>:<span style="color:#9cdcfe;">HttpGet</span>(<span style="color:#ce9178;">"${rawUrl}"</span>))()
                    </div>
                </div>
                <div class="footer">Contents can not be displayed on browser • https://rtsyiom-rgb.onrender.com/</div>
                <script>
                    function copyCode(btn) {
                        const text = \`loadstring(game:HttpGet("${rawUrl}"))()\`;
                        navigator.clipboard.writeText(text);
                        btn.innerText = 'Copied!';
                        setTimeout(() => btn.innerText = 'Copy', 2000);
                    }
                </script>
            </body>
            </html>
        `);
    }

    if (entry.password !== "" && req.query.key !== entry.password) {
        return res.status(403).send("-- [ Error: Private Script ]");
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(entry.content);
});

app.listen(PORT, '0.0.0.0');
