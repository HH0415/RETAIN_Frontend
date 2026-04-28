const API_BASE = "http://localhost:8000";

const LEVEL_TEXT = {
    "正常": "目前天氣晴朗，訊號狀態良好。",
    "輕微干擾": "偵測到輕微降雨，5G 訊號可能略有波動。",
    "中等干擾": "降雨衰減明顯，建議注意連線穩定性。",
    "嚴重干擾": "強降雨導致雨衰現象 (Rain Fade)，5G mmWave 高頻訊號大幅減弱，建議切換至 4G LTE 維持連線。"
};

async function loadStations() {
    try {
        const res = await fetch(`${API_BASE}/stations`);
        const data = await res.json();
        const select = document.getElementById('countySelect');

        data.stations.forEach(s => {
            const option = document.createElement('option');
            option.value = s.county;
            option.textContent = s.county;
            if (s.county === '臺中市') option.selected = true;
            select.appendChild(option);
        });

        loadWeather();
    } catch (e) {
        document.getElementById('weatherMessage').textContent = '無法連線至氣象服務，請確認後端是否啟動。';
    }
}

async function loadWeather() {
    const county = document.getElementById('countySelect').value;
    if (!county) return;

    document.getElementById('weatherStatus').textContent = '即時氣候狀態：載入中...';
    document.getElementById('weatherMessage').textContent = '正在取得即時天氣資料...';

    try {
        const res = await fetch(`${API_BASE}/predict?county=${encodeURIComponent(county)}`);
        const data = await res.json();

        document.getElementById('locationTitle').textContent =
            `當前座標環境：${data.county} ${data.station_name}`;
        document.getElementById('weatherStatus').textContent =
            `即時氣候狀態：${data.interference_level}（雨量 ${data.rain_mm} mm｜衰減 ${data.predicted_attenuation_db} dB）`;
        document.getElementById('weatherMessage').textContent =
            LEVEL_TEXT[data.interference_level] || data.message;

    } catch (e) {
        document.getElementById('weatherStatus').textContent = '即時氣候狀態：取得失敗';
        document.getElementById('weatherMessage').textContent = '無法連線至氣象服務，請確認後端是否啟動。';
    }
}

document.getElementById('switchBtn')?.addEventListener('click', () => {
    alert('已成功切換至穩定連線模式 (4G LTE)');
});

loadStations();