document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const msg = document.getElementById('statusMsg');
    const loginBtn = document.getElementById('loginBtn');

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        loginBtn.disabled = true;
        loginBtn.textContent = "登入中...";
        msg.innerHTML = "";

        try {
            const response = await fetch('http://localhost:5164/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: username, Password: password })
            });

            if (response.ok) {
                const token = await response.text(); 
                localStorage.setItem('retain_jwt', token); 

                const decodedToken = parseJwt(token);
                
                const userRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                              || decodedToken.role 
                              || 'User'; 

                msg.innerHTML = `<span style='color: #2e7d32;'>登入成功！身分：${userRole}，正在跳轉...</span>`;

                setTimeout(() => {
                    if (userRole === 'Admin') {
                        window.location.href = '../admin/dashboard.html';
                    } else {
                        window.location.href = '../user/dashboard.html';
                    }
                }, 1500);

            } else {
                const errorText = await response.text();
                msg.innerHTML = `<span style='color: #d32f2f;'>登入失敗：${errorText}</span>`;
                loginBtn.disabled = false;
                loginBtn.textContent = "進入系統";
            }
        } catch (error) {
            console.error("登入錯誤:", error);
            msg.innerHTML = "<span style='color: #d32f2f;'>伺服器連線異常</span>";
            loginBtn.disabled = false;
            loginBtn.textContent = "進入系統";
        }
    });
});