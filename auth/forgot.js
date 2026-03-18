document.getElementById('forgotForm').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    alert(`重設驗證信已發送至：${email}\n請於 30 分鐘內檢查信箱。`);
    window.location.href = "login.html";
};