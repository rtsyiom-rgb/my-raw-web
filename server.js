const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- ระบบส่งไฟล์ Favicon (ไอคอน) ---
app.get('/favicon.ico', (req, res) => {
    const iconPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(iconPath)) {
        res.sendFile(iconPath);
    } else {
        res.status(404).end();
    }
});

// --- หน้าหลัก (UI สำหรับอัปโหลด) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raw Hub | rtsyiom-rgb</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico">
            <style>
                body { background: #0b0e14; color: #ffffff; font-family: 'Consolas', monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                .card { background: #151921; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 90%; max-width: 600px; border: 1px solid #232936; }
                h1 { color: #00ff88; font-size: 22px; text-align: center; margin-bottom: 25px; letter-spacing: 1px; }
                .field { margin-bottom: 15px; }
                label { display: block; color: #888; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; }
                input, textarea { width: 100%; background: #0b0e14; color: #fff; border: 1px solid #333; border-radius: 6px; padding: 12px; box-sizing: border-box; outline: none; font-family: inherit; }
                textarea { height: 250px; color: #00ff88; resize: none; border-left: 3px solid #00ff88; }
                input:focus, textarea:focus { border-color: #00ff88; }
                button { background: #00ff88; color: #000; border: none; padding: 15px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; margin-top: 10px; transition: 0.2s; }
                button:hover { background: #00cc6e; transform: translateY(-2px); }
                .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #444; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>SRCRIPT UPLOADER</h1>
                <form action="/save" method="POST">
                    <div class="field">
                        <label>File Name</label>
                        <input type="text" name="title" placeholder="เช่น BloxFruits82.lua" required>
                    </div>
                    <div class="field">
                        <label>Source Code (Lua/Text)</label>
                        <textarea name="content" placeholder="วางสคริปต์ของคุณที่นี่..." required></textarea>
                    </div>
                    <div class="field">
                        <label>Access Key (ใส่เพื่อล็อค)</label>
                        <input type="text" name="password" placeholder="ตั้งรหัสผ่าน (ถ้ามี)">
                    </div>
                    <button type="submit">CREATE RAW LINK</button>
                </form>
                <div class="footer">POWERED BY RTSYIOM-RGB</div>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึกข้อมูล ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    if (!content) return res.redirect('/');

    const id = Math.random().toString(36).substring(2, 10);
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    db[id] = { 
        title: title || "untitled.lua", 
        content: content, 
        password: password || "" 
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));

    const baseUrl = `${req.protocol}://${req.get('host')}/raw/${id}`;
    const shareUrl = password ? `${baseUrl}?key=${password}` : baseUrl;

    res.send(`
        <body style="background:#0b0e14; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h2 style="color:#00ff88;">✓ สร้างสคริปต์สำเร็จ!</h2>
            <p style="color:#888;">ไฟล์: ${title}</p>
            <div style="margin: 20px 0;">
                <input type="text" id="link" value="${shareUrl}" style="width:80%; max-width:400px; padding:12px; background:#000; color:#00ff88; border:1px solid #333; text-align:center; border-radius:5px;" readonly>
            </div>
            <a href="${shareUrl}" target="_blank" style="color:#00ff88; text-decoration:none; border:1px solid #00ff88; padding:8px 20px; border-radius:5px;">OPEN RAW</a>
            <br><br>
            <a href="/" style="color:#555; text-decoration:none; font-size:13px;">[ กลับหน้าหลัก ]</a>
        </body>
    `);
});

// --- หน้าแสดงผล RAW (ปรับให้เหมือนไฟล์ Lua จริง) ---
app.get('/raw/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entry = db[req.params.id];
    
    if (entry) {
        if (entry.password !== "") {
            const userKey = req.query.key;
            if (userKey !== entry.password) {
                return res.status(403).send("-- [ Error: This script is private. Please provide a valid Key. ]"); 
            }
        }
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        // แสดงชื่อไฟล์เป็น Comment ของ Lua เพื่อความเท่และใช้งานได้จริง
        const header = `-- [[ File: ${entry.title} ]]\n` +
                       `-- [[ Uploaded by rtsyiom-rgb ]]\n` +
                       `-- ------------------------------------\n\n`;
        
        res.send(header + entry.content);
    } else {
        res.status(404).send('-- [ Error: Script Not Found ]');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Script Hub is Online!`);
});
