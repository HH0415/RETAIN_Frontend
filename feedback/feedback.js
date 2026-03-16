const role = sessionStorage.getItem("USER_ROLE");
document.getElementById('backBtn').href = role === 'admin' ? '../admin/dashboard.html' : '../user/dashboard.html';