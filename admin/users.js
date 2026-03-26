document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (typeof logout === 'function') logout();
    });

    const token = localStorage.getItem('retain_jwt');
    if (!token) return;

    try {
        const res = await fetch('http://localhost:5164/api/Admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("無法取得使用者列表");
        const users = await res.json();

        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = ''; 

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">目前系統尚無使用者資料</td></tr>';
            return;
        }

        users.forEach(u => {
            const isHighRisk = u.currentBill > 1000;
            const riskHtml = isHighRisk 
                ? `<span class="risk-high">高風險 (溢繳嚴重)</span>` 
                : `<span class="risk-low">穩定</span>`;

            const provider = u.currentProvider ? u.currentProvider : '尚未填寫問卷';
            const bill = u.currentBill ? `$${u.currentBill}` : '-';

            const tr = `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td>${provider}</td>
                    <td>${bill}</td>
                    <td>${riskHtml}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', tr);
        });

    } catch (error) {
        console.error("載入失敗:", error);
        document.getElementById('userTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">載入失敗或您的權限不足</td></tr>';
    }
});