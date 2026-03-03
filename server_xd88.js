const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Import logic files
const xd88Hu = require('./xd88_hu_logic');
const xd88Md5 = require('./xd88_md5_logic');

const app = express();
app.use(cors());

const PORT = 3001; // Dùng port khác LC79 nếu chạy song song

// --- API XD88 HŨ ---
app.get('/xd88hu', async (req, res) => {
    res.json(await xd88Hu.getCurrentData());
});

app.get('/xd88hu/history', (req, res) => {
    const limit = req.query.limit;
    res.json(xd88Hu.getHistory(limit));
});

// --- API XD88 MD5 ---
app.get('/xd88md5', async (req, res) => {
    res.json(await xd88Md5.getCurrentData());
});

app.get('/xd88md5/history', (req, res) => {
    const limit = req.query.limit;
    res.json(xd88Md5.getHistory(limit));
});

// Alias cho history nếu cần chung (mặc định lấy Hũ nếu không specify)
app.get('/history', (req, res) => {
    const type = req.query.type || 'hu';
    if (type === 'md5') {
        res.json(xd88Md5.getHistory(req.query.limit));
    } else {
        res.json(xd88Hu.getHistory(req.query.limit));
    }
});

// Màn hình chính
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>XD88 API Dashboard | Dwong1410</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg: #0f172a;
                    --glass: rgba(30, 41, 59, 0.7);
                    --glass-border: rgba(255, 255, 255, 0.1);
                    --primary: #fbbf24;
                    --secondary: #f59e0b;
                    --text: #f8fafc;
                    --text-muted: #94a3b8;
                    --success: #10b981;
                }

                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    background: var(--bg);
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(251, 191, 36, 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%);
                    color: var(--text);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .container {
                    width: 100%;
                    max-width: 800px;
                    background: var(--glass);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .badge {
                    display: inline-block;
                    padding: 6px 12px;
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    color: var(--primary);
                    border-radius: 99px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                }

                h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(to right, #f8fafc, #fbbf24);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }

                .subtitle {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 24px;
                }

                .card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    padding: 24px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .card:hover {
                    border-color: rgba(251, 191, 36, 0.3);
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-5px);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(251, 191, 36, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: var(--primary);
                }

                .card-header h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--primary);
                }

                .btn-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    color: var(--text);
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                }

                .btn:hover {
                    background: var(--primary);
                    color: var(--bg);
                    border-color: var(--primary);
                }

                footer {
                    margin-top: 40px;
                    text-align: center;
                    padding-top: 24px;
                    border-top: 1px solid var(--glass-border);
                }

                .server-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 6px;
                    box-shadow: 0 0 10px var(--success);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <div class="badge">XD88 API • Online</div>
                    <h1>XD88 Data Service</h1>
                    <p class="subtitle">Cung cấp dữ liệu Tài Xỉu XD88 thời gian thực</p>
                </header>
                
                <div class="grid">
                    <!-- XD88 Hũ CARD -->
                    <div class="card">
                        <div class="card-header">
                            <div class="icon">💰</div>
                            <h2>XD88 Hũ</h2>
                        </div>
                        <div class="btn-group">
                            <a href="/xd88hu" class="btn">
                                <span>🔍 Dữ liệu hiện tại</span>
                                <span>→</span>
                            </a>
                            <a href="/xd88hu/history?limit=50" class="btn">
                                <span>📜 Lịch sử (50 phiên)</span>
                                <span>→</span>
                            </a>
                        </div>
                    </div>

                    <!-- XD88 MD5 CARD -->
                    <div class="card">
                        <div class="card-header">
                            <div class="icon">🛡️</div>
                            <h2>XD88 MD5</h2>
                        </div>
                        <div class="btn-group">
                            <a href="/xd88md5" class="btn">
                                <span>🔍 Dữ liệu hiện tại</span>
                                <span>→</span>
                            </a>
                            <a href="/xd88md5/history?limit=50" class="btn">
                                <span>📜 Lịch sử (50 phiên)</span>
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>

                <footer>
                    <div class="server-info">
                        <div><span class="status-dot"></span> Port: ${PORT}</div>
                        <div>Powered by Dwong1410</div>
                    </div>
                </footer>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`[🚀] XD88 API Server đang chạy tại http://localhost:${PORT}`);

    // Khởi động kết nối
    xd88Hu.startConnection();
    xd88Md5.startConnection();

    // Tự ping để chống ngủ (Render)
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_EXTERNAL_URL) {
        setInterval((RENDER_EXTERNAL_URL) => {
            axios.get()
                .then(res => {
                    console.log(`[📡] Self-ping XD88 (status: ${res.status})`);
                })
                .catch(err => {
                    console.error('[⚠️] Self-ping error:', err.message);
                });
        }, 5 * 60 * 1000);
    }
});
