document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    if (!token) return;

    try {
        const [userRes, plansRes] = await Promise.all([
            fetch('http://localhost:5164/api/User/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:5164/api/Plans')
        ]);

        if (!userRes.ok || !plansRes.ok) throw new Error("資料載入失敗");

        const userData = await userRes.json();
        const plans = await plansRes.json();

        document.getElementById('welcome-name').textContent = userData.username;
        document.getElementById('usage-display').textContent = userData.avgUsage === 999 ? '吃到飽' : userData.avgUsage;
        document.getElementById('curr-provider').textContent = userData.currentProvider || "未填寫";
        document.getElementById('curr-usage').textContent = userData.avgUsage === 999 ? '吃到飽' : `${userData.avgUsage} GB`;
        document.getElementById('curr-bill').textContent = `$ ${userData.currentBill}`;

        const validPlans = plans.filter(p => p.dataLimit >= userData.avgUsage || p.dataLimit === 999);
        validPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

        if (validPlans.length > 0) {
            const best = validPlans[0];
            document.getElementById('rec-provider').textContent = best.provider;
            document.getElementById('rec-plan').textContent = best.planName;
            document.getElementById('rec-bill').textContent = `$ ${best.monthlyPrice}`;
            
            const saving = userData.currentBill - best.monthlyPrice;
            const sBox = document.getElementById('saving-box');
            if (saving > 0) {
                sBox.textContent = `轉換至最佳方案，您每月可省下 $ ${saving} 元！`;
                sBox.style.backgroundColor = "#28a745";
            } else {
                sBox.textContent = `您目前的資費已經是最佳狀態！`;
                sBox.style.backgroundColor = "#17a2b8";
            }
        }

        const tableBody = document.getElementById('alt-plans-body');
        tableBody.innerHTML = '';

        plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

        plans.forEach(p => {
            const isMatch = (p.dataLimit >= userData.avgUsage || p.dataLimit === 999);
            
            const tag = isMatch 
                ? `<span class="tag tag-match">✔ 適合您</span>`
                : `<span class="tag tag-fail">✘ 流量不足</span>`;
            
            const rowClass = isMatch ? '' : 'row-disabled';
            const limitDesc = p.dataLimit === 999 ? '吃到飽' : `${p.dataLimit} GB`;

            const row = `
                <tr class="${rowClass}">
                    <td>${tag}</td>
                    <td><b>${p.provider}</b></td>
                    <td>${p.planName}</td>
                    <td>${limitDesc}</td>
                    <td class="text-right"><b>$ ${p.monthlyPrice}</b></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error(err);
    }
});