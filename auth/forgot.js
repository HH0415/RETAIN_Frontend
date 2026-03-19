        document.getElementById('forgotForm').onsubmit = (e) => {
            e.preventDefault();
            alert("驗證信已發送至您的信箱，請於 30 分鐘內點擊連結重設。");
            window.location.href = "login.html";
        };