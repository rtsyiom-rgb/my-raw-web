const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- หน้าแรก (สำหรับเจ้าของมาสร้างสคริปต์) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Script Creator | rtsyiom-rgb</title>
            <style>
                body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1a1c2e; padding: 30px; border-radius: 15px; width: 400px; border: 1px solid #2d304d; }
                input, textarea { width: 100%; background: #0f111a; color: #fff; border: 1px solid #333; padding: 10px; margin: 10px 0; border-radius: 5px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #5765f2; border: none; color: #fff; font-weight: bold; cursor: pointer; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2 style="text-align:center;color:#5765f2;">CREATE SCRIPT</h2>
                <form action="/save" method="POST">
                    <input type="text" name="title" placeholder="ชื่อไฟล์ (เช่น BloxFruits82.lua)" required>
                    <textarea name="content" placeholder="วางสคริปต์ที่นี่..." rows="8" required></textarea>
                    <input type="text" name="password" placeholder="Key/Password (ถ้ามี)">
                    <button type="submit">GENERATE</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึกและ Redirect ไปหน้า View ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    db[id] = { title: title || "script.lua", content, password: password || "" };
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));
    res.redirect('/view/' + id); 
});

// --- หน้าแสดงผลแบบสวยงาม (เหมือนในรูปที่ 7) ---
app.get('/view/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entry = db[req.params.id];
    if (!entry) return res.send("Script Not Found");

    const rawUrl = `${req.protocol}://${req.get('host')}/raw/${req.params.id}${entry.password ? '?key=' + entry.password : ''}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Loadstring | ${entry.title}</title>
            <style>
                body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .title-header { font-size: 22px; font-weight: bold; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
                .code-container { background: #151726; border: 1px solid #2d304d; border-radius: 12px; width: 90%; max-width: 850px; padding: 25px; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
                .code-box { font-family: 'Consolas', monospace; font-size: 15px; color: #dcdccc; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
                .keyword { color: #569cd6; } .string { color: #ce9178; } .variable { color: #9cdcfe; } .comment { color: #6a9955; }
                .copy-btn { position: absolute; top: 15px; right: 15px; background: #323552; color: #fff; border: none; padding: 7px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; }
                .copy-btn:hover { background: #474b75; }
                .footer { margin-top: 25px; color: #5c607a; font-size: 13px; }
            </style>
        </head>
        <body>
            <div class="title-header">📜 Loadstring</div>
            <div class="code-container">
                <button class="copy-btn" id="copyBtn" onclick="copyCode()">Copy</button>
                <div class="code-box">
<span class="keyword">script_key</span> = <span class="string">"${entry.password || 'FREE'}"</span>; <span class="comment">-- A key might be required, if not, delete this line.</span>
<span class="keyword">loadstring</span>(<span class="variable">game</span>:<span class="variable">HttpGet</span>(<span class="string">"${rawUrl}"</span>))()
                </div>
            </div>
            <div class="footer">Contents can not be displayed on browser • https://rtsyiom-rgb.onrender.com/</div>

            <script>
                function copyCode() {
                    const text = \`loadstring(game:HttpGet("${rawUrl}"))()\`;
                    navigator.clipboard.writeText(text);
                    const btn = document.getElementById('copyBtn');
                    btn.innerText = 'Copied!';
                    btn.style.background = '#28a745';
                    setTimeout(() => {
                        btn.innerText = 'Copy';
                        btn.style.background = '#323552';
                    }, 2000);
                }
            </script>
        </body>
        </html>
    `);
});

// --- หน้า RAW ล้วน (สำหรับ Executor ดึงไปใช้) ---
app.get('/raw/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entry = db[req.params.id];
    if (entry) {
        if (entry.password !== "" && req.query.key !== entry.password) {
            return res.status(403).send("-- [ Error: This is a private script. ]");
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(entry.content);
    } else {
        res.status(404).send('-- [ Error: Script Not Found ]');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running...");
});
