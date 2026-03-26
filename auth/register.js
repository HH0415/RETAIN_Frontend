document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.getElementById('registerForm');
    
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const msg = document.getElementById('regStatus');

        try {
            const res = await fetch('http://localhost:5164/api/Auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password })
            });

            if (res.ok) {
                alert("註冊成功！請直接登入。");
                window.location.href = 'login.html';
            } else {
                msg.textContent = await res.text();
            }
        } catch (err) {
            msg.textContent = "連線失敗";
        }
    });
});