document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById('resetForm');
    const msg = document.getElementById('resetStatus');
    const btn = document.getElementById('resetBtn');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        msg.innerHTML = '<span class="error-text">❌ 無效或遺失重設憑證，請重新申請。</span>';
        btn.disabled = true;
        btn.style.opacity = "0.5";
        return;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            msg.innerHTML = '<span class="error-text">兩次輸入的密碼不一致！</span>';
            return;
        }

        btn.disabled = true;
        btn.textContent = "更新中...";
        msg.textContent = "";

        try {
            const res = await fetch('http://localhost:5164/api/Auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    Token: token, 
                    NewPassword: newPassword 
                })
            });

            const resultText = await res.text();

            if (res.ok) {
                msg.innerHTML = '<span class="success-text">密碼已成功更新！3秒後跳轉登入頁...</span>';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                msg.innerHTML = `<span class="error-text">${resultText}</span>`;
                btn.disabled = false;
                btn.textContent = "確認修改並登入";
            }
        } catch (err) {
            msg.innerHTML = '<span class="error-text"> 無法連線至伺服器。</span>';
            btn.disabled = false;
            btn.textContent = "確認修改並登入";
        }
    });
});