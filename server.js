const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = './database.json';

// ใช้ Port จาก Render หรือถ้าไม่มีให้ใช้ 3000 (สำหรับรันในเครื่อง)
const PORT = process.env.PORT || 3000;

// เช็กและสร้างไฟล์ database.json
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raw Hub - Online</title>
            <style>
                body { background: #0b0e14; color: #ffffff; font-family: 'Consolas', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #151921; padding: 30px; border-radius: 15px; box-shadow: 0 0 20px rgba(0,255,136,0.2); width: 90%; max-width: 700px; border: 1px solid #232936; }
                h1 { color: #00ff88; font-size: 24px; margin-bottom: 20px; text-align: center; }
                textarea { width: 100%; height: 250px; background: #0b0e14; color: #00ff88; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 14px; outline: none; box-sizing: border-box; resize: none; }
                button { background: #00ff88; color: #000; border: none; padding: 12px 30px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 15px; width: 100%; font-size: 16px; transition: 0.3s; }
                button:hover { background: #00cc6e; transform: scale(1.02); }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>RAW GENERATOR ONLINE</h1>
                <form action="/save" method="POST">
                    <textarea name="content" placeholder="วางข้อมูลที่นี่..."></textarea>
                    <button type="submit">CREATE PUBLIC RAW LINK</button>
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

    const id = Math.random().toString(36).substring(2, 10);
    const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    db[id] = content;
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));

    // สร้างลิงก์แบบเต็มเพื่อให้กดง่ายๆ
    const fullUrl = `${req.protocol}://${req.get('host')}/raw/${id}`;

    res.send(`
        <body style="background:#0b0e14; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h2 style="color:#00ff88;">บันทึกสำเร็จและออนไลน์แล้ว!</h2>
            <p>ลิงก์สาธารณะของคุณ:</p>
            <input type="text" value="${fullUrl}" style="width:80%; max-width:400px; padding:10px; background:#000; color:#00ff88; border:1px solid #333; text-align:center;" readonly>
            <br><br>
            <a href="/raw/${id}" style="color:#00ff88; text-decoration:none;">[ VIEW RAW ]</a> | 
            <a href="/" style="color:#aaa; text-decoration:none;">[ CREATE NEW ]</a>
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
        res.status(404).send('404 - ไม่พบข้อมูลนี้');
    }
});

// รัน Server โดยใช้ Host 0.0.0.0 เพื่อให้ Render คุยกับเว็บเราได้
app.listen(PORT, '0.0.0.0', () => {
    console.log('------------------------------------');
    console.log(`🚀 Server Is Live! Port: ${PORT}`);
    console.log('------------------------------------');
});
