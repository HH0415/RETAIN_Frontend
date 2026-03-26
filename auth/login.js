document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const msg = document.getElementById('loginStatus');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        msg.textContent = "驗證身分中...";
        msg.style.color = "#000";

        try {
            const response = await fetch('http://localhost:5164/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password })
            });

            if (response.ok) {
                const token = await response.text();
                localStorage.setItem('retain_jwt', token);
                
                msg.style.color = "green";
                msg.textContent = "登入成功！";
                setTimeout(() => window.location.href = '../user/dashboard.html', 1000);
            } else {
                const errorText = await response.text();
                msg.style.color = "red";
                msg.textContent = errorText;
            }
        } catch (error) {
            msg.style.color = "red";
            msg.textContent = "連線失敗，請確認後端正在執行";
            console.error(error);
        }
    });
});