const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- หน้าแรกสำหรับอัปโหลด ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>Script Hub | rtsyiom-rgb</title>
            <style>
                body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                .container { background: #1a1c2e; padding: 40px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.5); width: 100%; max-width: 500px; border: 1px solid #2d304d; }
                h1 { color: #5765f2; text-align: center; margin-bottom: 30px; font-size: 28px; }
                label { display: block; margin-bottom: 8px; color: #8e9297; font-size: 13px; font-weight: bold; }
                input, textarea { width: 100%; background: #0f111a; color: #dcddde; border: 1px solid #000; border-radius: 8px; padding: 12px; box-sizing: border-box; outline: none; margin-bottom: 20px; transition: 0.3s; }
                textarea { height: 150px; border-left: 4px solid #5765f2; resize: none; }
                input:focus, textarea:focus { border-color: #5765f2; }
                button { background: #5765f2; color: #fff; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; transition: 0.2s; }
                button:hover { background: #4752c4; transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>SRCRIPT HUB</h1>
                <form action="/save" method="POST">
                    <label>FILE NAME</label>
                    <input type="text" name="title" placeholder="BloxFruits82.lua" required>
                    <label>LUA CONTENT</label>
                    <textarea name="content" placeholder="Paste your script here..." required></textarea>
                    <label>PASSWORD (OPTIONAL)</label>
                    <input type="text" name="password" placeholder="Access key...">
                    <button type="submit">GENERATE LOADSTRING</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึกและสร้างหน้า Loadstring UI ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    db[id] = { title: title || "script.lua", content, password: password || "" };
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));

    const rawUrl = `${req.protocol}://${req.get('host')}/raw/${id}${password ? '?key=' + password : ''}`;
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`;

    // หน้าตาหลังจากกด Save ให้เหมือนในรูปที่ส่งมา
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Loadstring | ${title}</title>
            <style>
                body { background: #0f111a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .title-top { font-size: 20px; font-weight: bold; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
                .code-box { background: #151726; border: 1px solid #2d304d; border-radius: 12px; width: 90%; max-width: 800px; padding: 20px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .code-text { font-family: 'Consolas', monospace; font-size: 14px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; margin: 0; padding-right: 60px; }
                .blue { color: #58a6ff; } .orange { color: #ffa657; } .green { color: #7ee787; }
                .copy-btn { position: absolute; top: 15px; right: 15px; background: #2d304d; color: #dcddde; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: 0.2s; }
                .copy-btn:hover { background: #40446b; color: #fff; }
                .footer { margin-top: 20px; color: #8e9297; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="title-top">📜 Loadstring</div>
            <div class="code-box">
                <button class="copy-btn" onclick="copyCode()">Copy</button>
                <p class="code-text" id="code">
<span class="orange">script_key</span> = <span class="green">"KEY"</span>; <span style="color: #6a9955;">-- A key might be required</span>
<span class="blue">loadstring</span>(<span class="blue">game</span>:<span class="blue">HttpGet</span>(<span class="green">"${rawUrl}"</span>))()</p>
            </div>
            <div class="footer">Contents can not be displayed on browser • rtsyiom-rgb</div>

            <script>
                function copyCode() {
                    const text = \`loadstring(game:HttpGet("${rawUrl}"))()\`;
                    navigator.clipboard.writeText(text);
                    const btn = document.querySelector('.copy-btn');
                    btn.innerText = 'Copied!';
                    setTimeout(() => btn.innerText = 'Copy', 2000);
                }
            </script>
        </body>
        </html>
    `);
});

// --- หน้า RAW สำหรับตัวรันสคริปต์ (ห้ามแก้ส่วนนี้) ---
app.get('/raw/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entry = db[req.params.id];
    if (entry) {
        if (entry.password !== "" && req.query.key !== entry.password) return res.status(403).send("-- Private");
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(entry.content);
    } else res.status(404).send('-- Not Found');
});

app.listen(PORT, '0.0.0.0');
