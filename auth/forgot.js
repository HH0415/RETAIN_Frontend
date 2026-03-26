document.addEventListener("DOMContentLoaded", () => {
    const forgotForm = document.getElementById('forgotForm');
    const msg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();

        submitBtn.disabled = true;
        submitBtn.textContent = "處理中...";
        msg.innerHTML = "";

        try {
            const response = await fetch('http://localhost:5164/api/Auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Email: email })
            });

            if (response.ok) {
                msg.innerHTML = "<span style='color: #2e7d32;'>重設信件已發送，請至信箱查收。</span>";
                forgotForm.reset();
            } else {
                const errText = await response.text();
                msg.innerHTML = `<span style='color: #d32f2f;'>錯誤：${errText || "查無此帳號或信箱"}</span>`;
            }
        } catch (error) {
            msg.innerHTML = "<span style='color: #d32f2f;'>伺服器連線失敗</span>";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "發送重設密碼信";
        }
    });
});