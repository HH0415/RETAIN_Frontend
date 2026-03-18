const role = sessionStorage.getItem("USER_ROLE");
document.getElementById('backBtn').href = role === 'admin' ? '../admin/dashboard.html' : '../user/dashboard.html';

document.getElementById('pwForm').onsubmit = (e) => {
    e.preventDefault();
    const newPw = document.getElementById('newPw').value;
    const confirmPw = document.getElementById('confirmPw').value;

    if (newPw !== confirmPw) {
        alert("新密碼與確認密碼不符！");
        return;
    }

    alert("權限密碼更新成功，下次登入請使用新密碼。");
    document.getElementById('pwForm').reset();
};