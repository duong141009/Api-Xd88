const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36'
];

const ACCESS_TOKEN = "1-67d216dd50c35699cc57bad2355634da";
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJHYW1lIFBsYXRmb3JtIFN5c3RlbSIsImlzcyI6ImdhbWVtcy1hcGkiLCJtdG9rZW4iOiJ7XCJ1c2VybmFtZVwiOlwidGVzdHRvb2x4aW5cIixcInRva2VuXCI6XCIxLTY3ZDIxNmRkNTBjMzU2OTljYzU3YmFkMjM1NTYzNGRhXCIsXCJtZW1iZXJfaWRcIjoxMzI4MTQ3NDMyLFwiYWdlbmN5X2lkXCI6MX0iLCJleHAiOjE3NzI0OTI0MTJ9.wyJnV79-evXpDgn1UzLoihVjTGSdrb7VKv5zzbiZOTg";

// Connection state
let ws = null;
let pingInterval = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let isConnected = false;
let isConnecting = false;
let lastActivityTime = Date.now();

// Game data
let patternHistory = [];
let fullHistory = [];
let currentSid = null;
let currentData = null;
const processedSid = new Set();
const processedGbb = new Set();

// Utility functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomUserAgent() {
  return USER_AGENTS[getRandomInt(0, USER_AGENTS.length - 1)];
}

function generateFingerprint() {
  return crypto.randomBytes(16).toString('hex');
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour12: false });
}

function safeSend(message) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log(`[${getCurrentTime()}] ⚠️ Không thể gửi - Kết nối đã đóng`);
    return false;
  }

  try {
    ws.send(JSON.stringify(message));
    lastActivityTime = Date.now();
    return true;
  } catch (e) {
    console.log(`[${getCurrentTime()}] ❌ Lỗi khi gửi message:`, e.message);
    return false;
  }
}

// Improved prediction algorithm
function enhancedPrediction(pattern) {
  if (pattern.length < 8) return "Đang phân tích...";

  const lastResults = pattern.slice(-5);
  const taiCount = lastResults.filter(x => x === 'T').length;
  const xiuCount = lastResults.filter(x => x === 'X').length;

  // High probability reversal
  if (taiCount >= 4) return "Xỉu (xác suất đảo chiều cao)";
  if (xiuCount >= 4) return "Tài (xác suất đảo chiều cao)";

  // Sequence detection
  if (pattern.endsWith('TTT')) return "Xỉu";
  if (pattern.endsWith('XXX')) return "Tài";

  return taiCount > xiuCount ? "Tài" : xiuCount > taiCount ? "Xỉu" : "Ngẫu nhiên";
}

// WebSocket connection manager
function connectWebSocket() {
  if (isConnected || isConnecting) return;

  isConnecting = true;
  reconnectAttempts++;

  console.log(`[${getCurrentTime()}] 🔄 Đang kết nối (lần thử ${reconnectAttempts})...`);

  // Clear any existing connection
  if (ws) {
    ws.removeAllListeners();
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }

  // Create new connection
  ws = new WebSocket("wss://mynygwais.hytsocesk.com/websocket", ["jwt", JWT_TOKEN], {
    headers: {
      "User-Agent": getRandomUserAgent(),
      "Origin": "https://v.hitclub.bi",
      "Host": "mynygwais.hytsocesk.com",
      "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "X-Client-Fingerprint": generateFingerprint(),
      "X-Forwarded-For": `192.168.${getRandomInt(1, 254)}.${getRandomInt(1, 254)}`
    }
  });

  // Connection established
  ws.on('open', () => {
    isConnected = true;
    isConnecting = false;
    reconnectAttempts = 0;
    lastActivityTime = Date.now();
    console.log(`[${getCurrentTime()}] ✅ Kết nối thành công`);

    // Send initial messages with random delays
    const initialMessages = [
      [1, "MiniGame", "", "", {
        agentId: "1",
        accessToken: ACCESS_TOKEN,
        reconnect: false
      }],
      [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }],
      [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }],
      [6, "MiniGame", "taixiuKCBPlugin", { cmd: 2001 }]
    ];

    initialMessages.forEach((msg, i) => {
      setTimeout(() => {
        if (safeSend(msg)) {
          console.log(`[${getCurrentTime()}] 📤 Đã gửi message ${msg[3]?.cmd || msg[0]}`);
        }
      }, getRandomInt(500, 1500) * (i + 1));
    });

    // Start keep-alive mechanism
    setupKeepAlive();

    // Start human-like behavior simulation
    simulateHumanBehavior();
  });

  // Message received
  ws.on('message', (data) => {
    lastActivityTime = Date.now();

    try {
      const msg = JSON.parse(data);
      if (!Array.isArray(msg) || typeof msg[1] !== 'object') return;

      const cmd = msg[1]?.cmd;
      const sid = msg[1]?.sid;
      const gbb = msg[1]?.gBB;

      // Update current session ID
      if ((cmd === 1002 || cmd === 1008) && sid && !processedSid.has(sid)) {
        currentSid = sid;
        processedSid.add(sid);
        console.log(`[${getCurrentTime()}] 🔄 Cập nhật SID: ${sid}`);
      }

      // Process game result
      if ((cmd === 1003 || cmd === 1004) && msg[1]?.d1 && msg[1]?.d2 && msg[1]?.d3 && !processedGbb.has(gbb)) {
        processedGbb.add(gbb);
        const { d1, d2, d3 } = msg[1];
        const total = d1 + d2 + d3;
        const result = total > 10 ? "Tài" : "Xỉu";

        patternHistory.push(result[0]);
        if (patternHistory.length > 15) patternHistory.shift();

        const pattern = patternHistory.join("");
        const prediction = enhancedPrediction(patternHistory);

        currentData = {
          "Phiên trước": currentSid,
          "xúc xắc 1": d1,
          "xúc xắc 2": d2,
          "xúc xắc 3": d3,
          "kết quả": total,
          "pattern": pattern,
          "phiên hiện tại(phiên trc+1)": currentSid ? currentSid + 1 : null,
          "chuỗi md5": "", // Not applicable for regular Bàn Xanh
          "time": getCurrentTime(),
          "id": "Dwong1410"
        };

        fullHistory.push(currentData);
        if (fullHistory.length > 300) fullHistory.shift();

        console.log(`[${getCurrentTime()}] 🎲 Kết quả: ${d1}-${d2}-${d3} = ${total} (${result})`);
        console.log(`           🔮 Dự đoán: ${prediction} | Pattern: ${pattern}`);
      }
    } catch (e) {
      console.log(`[${getCurrentTime()}] ❌ Lỗi xử lý message:`, e.message);
    }
  });

  // Connection closed
  ws.on('close', () => {
    isConnected = false;
    isConnecting = false;
    console.log(`[${getCurrentTime()}] ⚠️ Kết nối đã đóng`);

    // Clean up
    if (pingInterval) clearInterval(pingInterval);

    // Schedule reconnect with exponential backoff
    const delay = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts));
    console.log(`[${getCurrentTime()}] ⏳ Sẽ thử kết nối lại sau ${delay / 1000}s...`);

    reconnectTimeout = setTimeout(() => {
      connectWebSocket();
    }, delay);
  });

  // Connection error
  ws.on('error', (err) => {
    isConnecting = false;
    console.log(`[${getCurrentTime()}] ❌ Lỗi kết nối:`, err.message);
  });
}

// Keep-alive mechanism
function setupKeepAlive() {
  if (pingInterval) clearInterval(pingInterval);

  let counter = 1;
  pingInterval = setInterval(() => {
    if (!isConnected) {
      clearInterval(pingInterval);
      return;
    }

    // Randomize ping interval (8-15s)
    const nextPing = getRandomInt(8000, 15000);
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (safeSend(["7", "MiniGame", "1", counter++])) {
        // Occasionally send additional requests
        if (Math.random() > 0.7) {
          safeSend([6, "MiniGame", "taixiuKCBPlugin", { cmd: 2001 }]);
        }
      }
    }, nextPing);
  }, getRandomInt(8000, 15000));
}

// Human-like behavior simulation
function simulateHumanBehavior() {
  if (!isConnected) return;

  const actions = [
    () => safeSend([6, "MiniGame", "taixiuPlugin", { cmd: 1002 }]),
    () => safeSend([6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]),
    () => safeSend([6, "MiniGame", "taixiuKCBPlugin", { cmd: 2002 }])
  ];

  const performAction = () => {
    if (!isConnected) return;

    // 30% chance to perform random action
    if (Math.random() < 0.3) {
      const action = actions[getRandomInt(0, actions.length - 1)];
      if (action()) {
        console.log(`[${getCurrentTime()}] 👤 Giả lập hành vi người dùng`);
      }
    }

    // Schedule next action with random delay (20-60s)
    setTimeout(performAction, getRandomInt(20000, 60000));
  };

  // Start behavior simulation with random delay (10-30s)
  setTimeout(performAction, getRandomInt(10000, 30000));
}

// Health check
function startHealthCheck() {
  setInterval(() => {
    if (!isConnected) return;

    // If no activity for 30 seconds, force reconnect
    if (Date.now() - lastActivityTime > 30000) {
      console.log(`[${getCurrentTime()}] 🚨 Không có hoạt động trong 30s, yêu cầu kết nối lại`);
      ws.close();
    }
  }, 5000);
}

// Exports cho server.js
module.exports = {
  getCurrentData: () => currentData || {
    status: "waiting",
    message: "Đang chờ dữ liệu từ server Hitclub Bàn Xanh...",
    time: getCurrentTime()
  },
  getHistory: (limitStr) => {
    let limit = fullHistory.length;
    if (limitStr) {
      const parsedLimit = parseInt(limitStr);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 300, fullHistory.length);
      }
    } else {
      limit = Math.min(300, fullHistory.length);
    }
    return fullHistory.slice(-limit);
  },
  startConnection: () => {
    console.log(`[${getCurrentTime()}] 🚀 Khởi tạo kết nối Hitclub Bàn Xanh...`);
    connectWebSocket();
    startHealthCheck();
  }
};
