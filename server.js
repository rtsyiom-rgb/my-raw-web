const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

// สร้างไฟล์ Database ถ้ายังไม่มี
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

// แก้ปัญหา Payload Too Large โดยปรับ Limit เป็น 1GB
app.use(express.urlencoded({ limit: '1gb', extended: true }));
app.use(express.json({ limit: '1gb' }));

// --- ระบบส่งไอคอน Favicon ---
// นำไฟล์ไอคอนของคุณไปวางในโฟลเดอร์เดียวกับ server.js และตั้งชื่อว่า favicon.ico
app.get('/favicon.ico', (req, res) => {
    const iconPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(iconPath)) {
        res.sendFile(iconPath);
    } else {
        res.status(404).end();
    }
});

// --- หน้าแรก (Uploader) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Script Hub Creator</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico">
            <style>
                body { background: #0f111a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1a1c2e; padding: 30px; border-radius: 15px; border: 1px solid #2d304d; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                input, textarea { width: 100%; background: #0f111a; color: white; border: 1px solid #333; padding: 10px; margin: 10px 0; border-radius: 5px; box-sizing: border-box; }
                button { width: 100%; padding: 15px; background: #5765f2; border: none; color: white; font-weight: bold; cursor: pointer; border-radius: 5px; }
                h2 { text-align: center; color: #5765f2; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>SRCRIPT HUB</h2>
                <form action="/save" method="POST">
                    <input type="text" name="title" placeholder="File Name (e.g. BloxFruits.lua)" required>
                    <textarea name="content" placeholder="Paste script here..." rows="8" required></textarea>
                    <input type="text" name="password" placeholder="Password (Optional)">
                    <button type="submit">GENERATE</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึกสคริปต์ ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    
    try {
        const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db[id] = { title: title || "script.lua", content, password: password || "" };
        fs.writeFileSync(DATA_FILE, JSON.stringify(db));
        res.redirect('/' + id + '.lua'); 
    } catch (err) {
        res.status(500).send("Server Error (Check RAM/Disk)");
    }
});

// --- หน้าแสดงผล Loadstring (ลบชื่อ/รหัสแล้ว) ---
app.get('/:id.lua', (req, res) => {
    const id = req.params.id;
    let db;
    try { db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return res.status(500).send("DB Error"); }
    
    const entry = db[id];
    if (!entry) return res.status(404).send("Not Found");

    const userAgent = req.headers['user-agent'] || "";
    const isBrowser = userAgent.includes("Mozilla") || userAgent.includes("Chrome") || userAgent.includes("Safari");

    // ถ้าเปิดผ่าน Browser ให้โชว์ UI สวยๆ
    if (isBrowser) {
        const rawUrl = \`\${req.protocol}://\${req.get('host')}/\${id}.lua\${entry.password ? '?key=' + entry.password : ''}\`;
        return res.send(\`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Loadstring Viewer</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico">
                <style>
                    body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .code-container { background: #151726; border: 1px solid #2d304d; border-radius: 12px; width: 95%; max-width: 850px; padding: 25px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
                    .code-box { font-family: 'Consolas', monospace; font-size: 15px; color: #dcdccc; white-space: pre-wrap; word-break: break-all; }
                    .copy-btn { position: absolute; top: 15px; right: 15px; background: #323552; color: #fff; border: none; padding: 7px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                    .footer { margin-top: 25px; color: #5c607a; font-size: 13px; text-align: center; }
                </style>
            </head>
            <body>
                <div style="font-size:22px; font-weight:bold; margin-bottom:20px; display:flex; align-items:center; gap:10px;">📜 Loadstring</div>
                <div class="code-container">
                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    <div class="code-box">
                        <span style="color:#569cd6;">loadstring</span>(<span style="color:#9cdcfe;">game</span>:<span style="color:#9cdcfe;">HttpGet</span>(<span style="color:#ce9178;">"\${rawUrl}"</span>))()
                    </div>
                </div>
                <div class="footer">Contents can not be displayed on browser • https://\${req.get('host')}/</div>
                <script>
                    function copyCode(btn) {
                        const text = \\\`loadstring(game:HttpGet("\${rawUrl}"))()\\\`;
                        navigator.clipboard.writeText(text);
                        btn.innerText = 'Copied!';
                        setTimeout(() => btn.innerText = 'Copy', 2000);
                    }
                </script>
            </body>
            </html>
        \`);
    }

    // ถ้าเรียกจากในเกม ให้ส่ง Code ล้วนๆ
    if (entry.password !== "" && req.query.key !== entry.password) {
        return res.status(403).send("-- [ Private Script ]");
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(entry.content);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server is running with 1GB Support");
});
