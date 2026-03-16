(function() {
    const token = sessionStorage.getItem("RETAIN_TOKEN");
    const isAuth = window.location.href.includes("/auth/");
    if (!token && !isAuth) {
        window.location.href = "../auth/login.html";
    }
})();

function logout() {
    if (confirm("確定要斷開系統連線嗎？")) {
        sessionStorage.clear();
        window.location.href = "../auth/login.html";
    }
}