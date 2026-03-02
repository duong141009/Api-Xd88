const axios = require("axios");

// Lưu lịch sử để tạo pattern
let history = [];
let fullHistory = [];

let latestResult = {
  "Phiên trước": 0,
  "xúc xắc 1": 0,
  "xúc xắc 2": 0,
  "xúc xắc 3": 0,
  "kết quả": 0,
  "pattern": "",
  "phiên hiện tại(phiên trc+1)": 0,
  "chuỗi md5": "",
  "time": new Date().toISOString().replace("T", " ").slice(0, 19),
  "id": "Dwong1410"
};

function getTaiXiu(sum) {
  return sum > 10 ? "t" : "x";
}

// Thuật toán dự đoán đơn giản từ pattern gần nhất
function duDoan(historyPattern) {
  if (historyPattern.endsWith("ttt")) return "Xỉu";
  if (historyPattern.endsWith("xxx")) return "Tài";
  return Math.random() > 0.5 ? "Tài" : "Xỉu"; // dự đoán ngẫu nhiên
}

function updateResult(d1, d2, d3, sid = null) {
  const total = d1 + d2 + d3;
  const result = total > 10 ? "Tài" : "Xỉu";
  const shorthand = getTaiXiu(total);

  if (sid !== latestResult["Phiên trước"]) {
    history.push(shorthand);
    if (history.length > 20) history.shift();

    const pattern = history.join("");
    const duDoanText = duDoan(pattern);

    const timeStr = new Date().toISOString().replace("T", " ").slice(0, 19);
    latestResult = {
      "Phiên trước": sid || latestResult["Phiên trước"] || 0,
      "xúc xắc 1": d1,
      "xúc xắc 2": d2,
      "xúc xắc 3": d3,
      "kết quả": total,
      "pattern": pattern,
      "phiên hiện tại": (sid || latestResult["Phiên trước"] || 0) + 1,
      "chuỗi md5": "", // MD5 API specific string can be injected here if retrieved
      "time": timeStr,
      "id": "Dwong1410"
    };

    fullHistory.push(latestResult);
    if (fullHistory.length > 300) fullHistory.shift();

    console.log(
      `[🎲✅] Phiên ${latestResult["Phiên trước"]} - ${d1}-${d2}-${d3} ➜ Tổng: ${total}, Kết quả: ${result} | ${timeStr}`
    );
  }
}

// API gốc
const API_TARGET_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=g8&gid=vgmn_101';

async function fetchGameData() {
  try {
    const response = await axios.get(API_TARGET_URL);
    const data = response.data;

    if (data.status === "OK" && Array.isArray(data.data) && data.data.length > 0) {
      const game = data.data[0];
      const sid = game.sid;
      const d1 = game.d1;
      const d2 = game.d2;
      const d3 = game.d3;

      if (sid !== latestResult["Phiên trước"] && d1 !== undefined && d2 !== undefined && d3 !== undefined) {
        updateResult(d1, d2, d3, sid);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu từ API GET:", error.message);
  }
}

// Exports cho server.js
module.exports = {
  getCurrentData: () => latestResult,
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
    console.log(`[🚀] Khởi tạo kết nối Hitclub MD5...`);
    setInterval(fetchGameData, 5000);
    fetchGameData();
  }
};