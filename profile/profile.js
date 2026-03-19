const role = sessionStorage.getItem("USER_ROLE");
document.getElementById('backBtn').href = role === 'admin' ? '../admin/dashboard.html' : '../user/dashboard.html';

document.getElementById('pwForm').onsubmit = (e) => {
    e.preventDefault();
    if (document.getElementById('n1').value !== document.getElementById('n2').value) {
        alert("新密碼輸入不一致");
        return;
    }
    alert("密碼已修改完成");
};