document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value.trim().toLowerCase();
    sessionStorage.setItem("RETAIN_TOKEN", "ACTIVE");
    sessionStorage.setItem("USER_ROLE", user === "admin" ? "admin" : "user");
    window.location.href = user === "admin" ? "../admin/dashboard.html" : "../user/dashboard.html";
};