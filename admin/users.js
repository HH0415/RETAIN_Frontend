document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const tableBody = document.getElementById('user-list-body');

    try {
        const [usersRes, plansRes] = await Promise.all([
            fetch('http://localhost:5164/api/Users', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:5164/api/Plans')
        ]);

        if (!usersRes.ok) throw new Error("權限不足或 API 錯誤");
        
        const users = await usersRes.json();
        const plans = await plansRes.json();

        tableBody.innerHTML = '';

        const customers = users.filter(u => u.role !== 'Admin');

        customers.forEach(user => {
            let riskLevel = "低風險";
            let riskClass = "risk-low";

            const betterPlans = plans.filter(p => p.dataLimit >= user.avgUsage && p.monthlyPrice < user.currentBill);
            
            if (betterPlans.length > 3) {
                riskLevel = "極高風險";
                riskClass = "risk-high";
            } else if (betterPlans.length > 0) {
                riskLevel = "中等風險";
                riskClass = "risk-medium";
            }

            const row = `
                <tr>
                    <td>${user.id}</td>
                    <td><b>${user.username}</b></td>
                    <td>${user.currentProvider || '未填寫'}</td>
                    <td>$ ${user.currentBill || 0}</td>
                    <td>${user.avgUsage === 999 ? '吃到飽' : user.avgUsage + ' GB'}</td>
                    <td>
                        <span class="risk-tag ${riskClass}">${riskLevel}</span>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">${err.message}</td></tr>`;
    }
});