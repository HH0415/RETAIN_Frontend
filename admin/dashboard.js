document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    try {
        const [usersRes, plansRes] = await Promise.all([
            fetch('http://localhost:5164/api/Users', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:5164/api/Plans')
        ]);

        if (!usersRes.ok) {
            console.error("Users API 失敗，狀態碼:", usersRes.status);
            throw new Error(`使用者資料抓取失敗 (${usersRes.status})`);
        }
        if (!plansRes.ok) {
            console.error("Plans API 失敗，狀態碼:", plansRes.status);
            throw new Error(`方案資料抓取失敗 (${plansRes.status})`);
        }

        const users = await usersRes.json();
        const plans = await plansRes.json();

        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-plans').textContent = plans.length;
        document.getElementById('total-tickets').textContent = "0";

        renderRiskList(users, plans);

    } catch (error) {
        console.error("詳細錯誤訊息:", error);
        document.getElementById('total-users').textContent = "錯誤";
        document.getElementById('total-plans').textContent = "錯誤";
        document.getElementById('total-tickets').textContent = "錯誤";
    }
});

function renderRiskList(users, plans) {
    const riskBody = document.getElementById('risk-list-body');
    if(!riskBody) return;
    riskBody.innerHTML = '';
    
    const activeUsers = users.filter(u => u.currentProvider && u.currentProvider !== "未填寫" && u.role !== "Admin");
    let count = 0;

    activeUsers.forEach(user => {
        const validPlans = plans.filter(p => p.dataLimit >= user.avgUsage || p.dataLimit === 999);
        validPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

        if (validPlans.length > 0) {
            const best = validPlans[0];
            const saving = user.currentBill - best.monthlyPrice;
            if (saving > 200) {
                count++;
                riskBody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td><b>${user.username}</b></td>
                        <td>${user.currentProvider}</td>
                        <td style="color:red">$ ${user.currentBill}</td>
                        <td>${user.avgUsage === 999 ? '吃到飽' : user.avgUsage + ' GB'}</td>
                        <td>${best.provider} - ${best.planName}</td>
                        <td style="color:green; font-weight:bold; text-align:right">省 $ ${saving}</td>
                    </tr>
                `);
            }
        }
    });
    if (count === 0) riskBody.innerHTML = '<tr><td colspan="6" style="text-align:center">目前無風險用戶</td></tr>';
}