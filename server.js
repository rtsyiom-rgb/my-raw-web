const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = './database.json';

// เช็กและสร้างไฟล์ database.json ถ้ายังไม่มี
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- หน้าตา UI ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>Raw Hub - Simple & Fast</title>
            <style>
                body { background: #0b0e14; color: #ffffff; font-family: 'Consolas', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #151921; padding: 30px; border-radius: 15px; box-shadow: 0 0 20px rgba(0,255,136,0.1); width: 90%; max-width: 700px; border: 1px solid #232936; }
                h1 { color: #00ff88; font-size: 24px; margin-bottom: 20px; }
                textarea { width: 100%; height: 250px; background: #0b0e14; color: #00ff88; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; }
                button { background: #00ff88; color: #000; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 15px; width: 100%; font-size: 16px; }
                button:hover { background: #00cc6e; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>RAW GENERATOR</h1>
                <form action="/save" method="POST">
                    <textarea name="content" placeholder="วางโค้ดหรือข้อความที่ต้องการทำเป็น Raw..."></textarea>
                    <button type="submit">สร้างลิงก์ RAW</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- ระบบบันทึก ---
app.post('/save', (req, res) => {
    const content = req.body.content;
    if (!content) return res.redirect('/');

    const id = Math.random().toString(36).substring(2, 10); // สร้าง ID สุ่มแบบง่าย
    
    // อ่านและเขียนไฟล์แบบ Synchronous เพื่อลดโอกาสเกิด Error
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    db[id] = content;
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));

    res.send(`
        <body style="background:#0b0e14; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h2 style="color:#00ff88;">บันทึกสำเร็จ!</h2>
            <p>ลิงก์ Raw ของคุณคือ:</p>
            <code style="background:#222; padding:10px; display:inline-block; margin:10px 0;">${req.protocol}://${req.get('host')}/raw/${id}</code>
            <br><br>
            <a href="/raw/${id}" style="color:#00ff88;">[ ดูหน้า RAW ]</a> | <a href="/" style="color:#aaa;">[ กลับหน้าหลัก ]</a>
        </body>
    `);
});

// --- หน้าแสดง Raw ---
app.get('/raw/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const data = db[req.params.id];
    
    if (data) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(data);
    } else {
        res.status(404).send('ไม่พบข้อมูล (404 Not Found)');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('------------------------------------');
    console.log('✅ Server รันสำเร็จแล้ว!');
    console.log(`🚀 เข้าใช้งานได้ที่: http://localhost:${PORT}`);
    console.log('------------------------------------');
});