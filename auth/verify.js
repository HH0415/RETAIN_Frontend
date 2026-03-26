document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const icon = document.getElementById('statusIcon');
    const title = document.getElementById('statusTitle');
    const desc = document.getElementById('statusDesc');
    const action = document.getElementById('actionArea');

    if (!token) {
        title.textContent = "無效的連結";
        desc.textContent = "找不到驗證憑證，請重新從註冊信中點擊連結。";
        return;
    }

    try {
        const response = await fetch(`http://localhost:5164/api/Auth/verify?token=${token}`);
        const message = await response.text();

        if (response.ok) {
            title.textContent = "驗證成功！";
            desc.textContent = "您的帳號已啟用。現在可以使用 RETAIN 系統的所有功能了。";
            action.style.display = "block";
        } else {
            title.textContent = "驗證失敗";
            desc.textContent = message || "驗證碼無效或已過期。";
        }
    } catch (error) {
        title.textContent = "連線失敗";
        desc.textContent = "無法連線至後端伺服器，請確認後端 (5164) 是否正常執行。";
    }
});