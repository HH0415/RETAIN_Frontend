document.addEventListener("DOMContentLoaded", () => {
    loadAllUsers();
});

const token = localStorage.getItem('retain_jwt');

async function loadAllUsers() {
    const tableBody = document.getElementById('user-list-body');
    try {
        const res = await fetch('http://localhost:5164/api/AdminUsers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const users = await res.json();
        
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td><b>${user.username}</b></td>
                <td><span class="role-tag">${user.role}</span></td>
                <td>${user.email}</td>
                <td>${user.role === 'Provider' ? (user.providerBrand || '未設定') : (user.currentProvider || '一般用戶')}</td>
                <td style="text-align: center;">
                    <button class="btn-edit" onclick="openEditModal('${user.username}', '${user.role}', '${user.email}', '${user.providerBrand || ''}', '${user.currentProvider || ''}')">修改</button>
                    <button class="btn-delete" onclick="deleteUser('${user.username}')">停權</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: red; padding: 20px;">載入失敗</td></tr>`;
    }
}

async function openEditModal(username, role, email, brand, currentP) {
    const newRole = prompt(`修改 ${username} 的角色 (User/Provider):`, role);
    const newEmail = prompt(`修改 Email:`, email);
    
    let payload = {
        role: newRole || role,
        email: newEmail || email,
        providerBrand: brand,
        currentProvider: currentP
    };

    if (newRole === 'Provider') {
        payload.providerBrand = prompt("設定所屬電信品牌 (例如：中華電信):", brand);
        payload.currentProvider = "";
    } else {
        payload.currentProvider = prompt("設定目前使用電信 (例如：遠傳電信):", currentP);
        payload.providerBrand = "";
    }

    try {
        const res = await fetch(`http://localhost:5164/api/AdminUsers/${username}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("修改成功！");
            loadAllUsers();
        } else {
            alert("修改失敗");
        }
    } catch (err) {
        alert("網路連線異常");
    }
}

async function deleteUser(username) {
    if(!confirm(`確定要停用使用者 ${username} 嗎？`)) return;
    alert("此功能可介接 DELETE API 進行帳號停權");
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}