document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('retain_jwt');

    if (!token) {
        alert("系統偵測到您尚未登入或憑證已過期，請重新登入！");
        window.location.href = '../auth/login.html';
    }
});

function logout() {
    localStorage.removeItem('retain_jwt');
    localStorage.removeItem('retain_role');
    
    alert("已成功登出系統，期待您再次使用 RETAIN！");
    window.location.href = '../auth/login.html';
}