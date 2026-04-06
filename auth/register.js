document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById('registerForm');
    const msg = document.getElementById('statusMsg');
    const registerBtn = document.getElementById('registerBtn');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (username.length < 3) {
            msg.innerHTML = "<span style='color: #d32f2f;'>帳號長度必須大於 3 個字元</span>";
            return;
        }

        if (password.length < 6) {
            msg.innerHTML = "<span style='color: #d32f2f;'>密碼長度至少需要 6 位數</span>";
            return;
        }

        if (password !== confirmPassword) {
            msg.innerHTML = "<span style='color: #d32f2f;'>兩次輸入的密碼不一致！</span>";
            return;
        }

        registerBtn.disabled = true;
        registerBtn.textContent = "正在建立帳號...";
        msg.innerHTML = "";

        try {
            const response = await fetch('http://localhost:5164/api/Auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    Username: username, 
                    Email: email, 
                    Password: password,
                    Role: "User"
                })
            });

            if (response.ok) {
                msg.innerHTML = "<span style='color: #2e7d32;'>註冊成功！3秒後導向登入頁...</span>";
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } else {
                const errText = await response.text();
                msg.innerHTML = `<span style='color: #d32f2f;'>註冊失敗：${errText || "帳號或信箱可能已存在"}</span>`;
                registerBtn.disabled = false;
                registerBtn.textContent = "建立帳號";
            }
        } catch (error) {
            console.error("註冊錯誤:", error);
            msg.innerHTML = "<span style='color: #d32f2f;'>伺服器連線失敗</span>";
            registerBtn.disabled = false;
            registerBtn.textContent = "建立帳號";
        }
    });
});