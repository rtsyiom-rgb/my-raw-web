const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = './database.json';
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- ส่วนส่ง Favicon ---
app.get('/favicon.ico', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'favicon.ico'))) {
        res.sendFile(path.join(__dirname, 'favicon.ico'));
    } else {
        res.status(404).end();
    }
});

// --- หน้าแรก ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raw Hub | rtsyiom-rgb</title>
            <link rel="icon" type="image/x-icon" href="/favicon.ico">
            <style>
                body { background: #0b0e14; color: #ffffff; font-family: 'Consolas', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #151921; padding: 30px; border-radius: 15px; box-shadow: 0 0 20px rgba(0,255,136,0.2); width: 90%; max-width: 700px; border: 1px solid #232936; }
                h1 { color: #00ff88; font-size: 24px; margin-bottom: 20px; text-align: center; }
                .input-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; color: #888; font-size: 12px; }
                input, textarea { width: 100%; background: #0b0e14; color: #fff; border: 1px solid #333; border-radius: 8px; padding: 12px; box-sizing: border-box; outline: none; font-family: inherit; }
                textarea { height: 200px; color: #00ff88; resize: none; }
                input:focus, textarea:focus { border-color: #00ff88; }
                button { background: #00ff88; color: #000; border: none; padding: 15px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; margin-top: 10px; transition: 0.3s; }
                button:hover { background: #00cc6e; transform: scale(1.01); }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>SECURE RAW</h1>
                <form action="/save" method="POST">
                    <div class="input-group">
                        <label>TITLE (ชื่อที่จะแสดงด้านบนสุด)</label>
                        <input type="text" name="title" placeholder="เช่น My Super Script v1" required>
                    </div>
                    <div class="input-group">
                        <label>CONTENT</label>
                        <textarea name="content" placeholder="วางโค้ดหรือข้อความที่นี่..." required></textarea>
                    </div>
                    <div class="input-group">
                        <label>PASSWORD (ใส่เพื่อล็อค)</label>
                        <input type="text" name="password" placeholder="ตั้งรหัสผ่าน (ถ้ามี)">
                    </div>
                    <button type="submit">GENERATE SECURE LINK</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึก ---
app.post('/save', (req, res) => {
    const { title, content, password } = req.body;
    if (!content) return res.redirect('/');

    const id = Math.random().toString(36).substring(2, 10);
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    db[id] = { title: title || "Untitled", content: content, password: password || "" };
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));

    const baseUrl = `${req.protocol}://${req.get('host')}/raw/${id}`;
    const shareUrl = password ? `${baseUrl}?key=${password}` : baseUrl;

    res.send(`
        <body style="background:#0b0e14; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h2 style="color:#00ff88;">บันทึกเรียบร้อย!</h2>
            <p>ชื่อรายการ: <b>${title}</b></p>
            <input type="text" value="${shareUrl}" style="width:350px; padding:10px; background:#000; color:#00ff88; border:1px solid #333; text-align:center;" readonly>
            <br><br>
            <a href="${shareUrl}" style="color:#00ff88; text-decoration:none;">[ ไปหน้า RAW ]</a> | <a href="/" style="color:#aaa; text-decoration:none;">[ กลับหน้าหลัก ]</a>
        </body>
    `);
});

// --- หน้าแสดง Raw: เพิ่มการแสดงชื่อหัวข้อ ---
app.get('/raw/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entry = db[req.params.id];
    
    if (entry) {
        if (entry.password !== "") {
            const userKey = req.query.key;
            if (userKey !== entry.password) return res.status(403).send(""); 
        }
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        // --- ส่วนที่แก้ไข: แสดงชื่อที่บรรทัดบนสุด ---
        const output = `FILE: ${entry.title}\n` + 
                       `--------------------------------\n\n` + 
                       `${entry.content}`;
        
        res.send(output);
    } else {
        res.status(404).send('Not Found');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Online at Port: ${PORT}`);
});
