document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const btn = document.getElementById('sendBtn');
    const msg = document.getElementById('statusMsg');

    btn.disabled = true;
    btn.textContent = "處理中...";
    msg.textContent = "";

    try {
        const res = await fetch('http://localhost:5164/api/Auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email })
        });

        if (res.ok) {
            msg.style.color = "#2e7d32";
            msg.textContent = "重設連結已發送！請檢查您的終端機 Console。";
        } else {
            msg.style.color = "#d32f2f";
            msg.textContent = await res.text();
        }
    } catch (err) {
        msg.textContent = "系統連線失敗，請檢查後端是否啟動。";
    } finally {
        btn.disabled = false;
        btn.textContent = "發送重設郵件";
    }
});