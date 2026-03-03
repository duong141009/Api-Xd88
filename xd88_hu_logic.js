const axios = require("axios");

function getCurrentTime() {
    return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }).replace(',', '');
}

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
    "phiên hiện tại": 0,
    "time": getCurrentTime(),
    "id": "Dwong1410"
};

function getTaiXiu(sum) {
    return sum > 10 ? "t" : "x";
}

function updateResult(dices, sid) {
    const d1 = dices[0];
    const d2 = dices[1];
    const d3 = dices[2];
    const total = d1 + d2 + d3;
    const shorthand = getTaiXiu(total);

    if (sid !== latestResult["Phiên trước"]) {
        history.push(shorthand);
        if (history.length > 20) history.shift();

        const pattern = history.join("");
        const timeStr = getCurrentTime();

        latestResult = {
            "Phiên trước": sid,
            "xúc xắc 1": d1,
            "xúc xắc 2": d2,
            "xúc xắc 3": d3,
            "kết quả": total,
            "pattern": pattern,
            "phiên hiện tại": sid + 1,
            "time": timeStr,
            "id": "Dwong1410"
        };

        fullHistory.push({ ...latestResult });
        if (fullHistory.length > 300) fullHistory.shift();

        console.log(
            `[🎲 XD88 HŨ ✅] Phiên ${latestResult["Phiên trước"]} - ${d1}-${d2}-${d3} ➜ Tổng: ${total} | ${timeStr}`
        );
    }
}

const TX_URL = "https://taixiu.system32-cloudfare-356783752985678522.monster/api/luckydice/GetSoiCau?access_token=";

async function fetchGameData() {
    try {
        const response = await axios.get(TX_URL);
        const data = response.data;

        if (Array.isArray(data) && data.length > 0) {
            const lastSession = data[0];
            const sid = lastSession.SessionId;
            const dices = [lastSession.FirstDice, lastSession.SecondDice, lastSession.ThirdDice];

            if (sid !== latestResult["Phiên trước"]) {
                updateResult(dices, sid);
            }
        }
    } catch (error) {
        console.error("❌ Lỗi khi lấy dữ liệu XD88 Hũ:", error.message);
    }
}

module.exports = {
    getCurrentData: async () => {
        return latestResult;
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
        console.log(`[🚀] Khởi tạo tự động lấy dữ liệu XD88 Hũ...`);
        setInterval(fetchGameData, 5000);
        fetchGameData();
    }
};
