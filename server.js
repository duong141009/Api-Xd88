const express = require('express');
const cors = require('cors');

// Import logic từ các file game
const hitbanxanh = require('./hitbanxanh_logic');
const hitmd5 = require('./hitmd5_logic');
const sun = require('./sun_logic');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// --- API HITCLUB BÀN XANH ---
app.get('/api/hitbanxanh/taixiu', (req, res) => {
    res.json(hitbanxanh.getCurrentData());
});

app.get('/api/hitbanxanh/history', (req, res) => {
    const limit = req.query.limit;
    res.json(hitbanxanh.getHistory(limit));
});

// --- API HITCLUB MD5 ---
app.get('/api/hitmd5/taixiu', (req, res) => {
    res.json(hitmd5.getCurrentData());
});

app.get('/api/hitmd5/history', (req, res) => {
    const limit = req.query.limit;
    res.json(hitmd5.getHistory(limit));
});

// --- API SUNWIN ---
app.get('/api/sun/taixiu', (req, res) => {
    res.json(sun.getCurrentData());
});

app.get('/api/sun/history', (req, res) => {
    const limit = req.query.limit;
    res.json(sun.getHistory(limit));
});


// Màn hình chính
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Tổng hợp API Game</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #fdfdfd; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h1 { text-align: center; color: #333; }
                    .endpoint-group { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                    h2 { color: #0056b3; margin-top: 0; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 10px; }
                    a { text-decoration: none; color: #28a745; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Server Trạng Thái API Tổng Hợp</h1>
                    
                    <div class="endpoint-group">
                        <h2>🟢 Hitclub Bàn Xanh</h2>
                        <ul>
                            <li>Dữ liệu hiện tại: <a href="/api/hitbanxanh/taixiu" target="_blank">/api/hitbanxanh/taixiu</a></li>
                            <li>Lịch sử: <a href="/api/hitbanxanh/history?limit=300" target="_blank">/api/hitbanxanh/history?limit=300</a></li>
                        </ul>
                    </div>

                    <div class="endpoint-group">
                        <h2>🔴 Hitclub MD5</h2>
                        <ul>
                            <li>Dữ liệu hiện tại: <a href="/api/hitmd5/taixiu" target="_blank">/api/hitmd5/taixiu</a></li>
                            <li>Lịch sử: <a href="/api/hitmd5/history?limit=300" target="_blank">/api/hitmd5/history?limit=300</a></li>
                        </ul>
                    </div>

                    <div class="endpoint-group">
                        <h2>🟠 Sunwin Tài Xỉu</h2>
                        <ul>
                            <li>Dữ liệu hiện tại: <a href="/api/sun/taixiu" target="_blank">/api/sun/taixiu</a></li>
                            <li>Lịch sử: <a href="/api/sun/history?limit=300" target="_blank">/api/sun/history?limit=300</a></li>
                        </ul>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Bắt đầu server
app.listen(PORT, () => {
    console.log('[🚀] Server Tổng Hợp Đang Chạy!');
    console.log(`[🌐] Trực tiếp tại: http://localhost:${PORT}`);

    // Khởi động kết nối của từng game
    console.log('\n[🔄] Đang khởi động kết nối dữ liệu...');
    hitbanxanh.startConnection();
    hitmd5.startConnection();
    sun.startConnection();
});
