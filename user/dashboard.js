document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

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

        if (!userData.currentProvider || userData.currentProvider === "" || userData.currentProvider === "未填寫") {
            window.location.href = 'questionnaire.html';
            return; 
        }

        const handlePlanChange = async (btn, newProvider, newPrice) => {
            if (!confirm(`確定要將目前的合約變更為「${newProvider}」 ($${newPrice}/月) 嗎？`)) {
                return;
            }

            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = "處理中...";

            const updateData = {
                RealName: userData.realName || "",
                Phone: userData.phone || "",
                Email: userData.email || "",
                AvgUsage: userData.avgUsage,
                CurrentProvider: newProvider,
                CurrentBill: newPrice
            };

            try {
                const response = await fetch('http://localhost:5164/api/User/profile', {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    alert("合約已成功變更！");
                    window.location.reload(); 
                } else {
                    const errorText = await response.text();
                    alert("變更失敗：" + errorText);
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            } catch (error) {
                console.error("更新失敗:", error);
                alert("伺服器連線異常");
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
   
        document.getElementById('nav-username').textContent = userData.username;
        document.getElementById('welcome-name').textContent = userData.username; 

        document.getElementById('usage-display').textContent = userData.avgUsage === 999 ? '吃到飽' : userData.avgUsage;
        document.getElementById('curr-provider').textContent = userData.currentProvider;
        document.getElementById('curr-usage').textContent = userData.avgUsage === 999 ? '吃到飽' : `${userData.avgUsage} GB`;
        document.getElementById('curr-bill').textContent = `$ ${userData.currentBill}`;


        const validPlans = plans.filter(p => p.dataLimit >= userData.avgUsage || p.dataLimit === 999);
        validPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);

        const recBtn = document.getElementById('rec-change-plan-btn');

        if (validPlans.length > 0) {
            const best = validPlans[0];
            document.getElementById('rec-provider').textContent = best.provider;
            document.getElementById('rec-plan').textContent = best.planName;
            document.getElementById('rec-bill').textContent = `$ ${best.monthlyPrice}`;
            
            if (recBtn) {
                recBtn.dataset.provider = best.provider;
                recBtn.dataset.price = best.monthlyPrice;
                recBtn.style.display = 'inline-block';
            }
            
            const saving = userData.currentBill - best.monthlyPrice;
            const sBox = document.getElementById('saving-box');
            if (saving > 0) {
                sBox.textContent = `轉換至最佳方案，您每月可省下 $ ${saving} 元！`;
                sBox.style.backgroundColor = "#28a745";
            } else {
                sBox.textContent = `您目前的資費已經是最佳狀態！`;
                sBox.style.backgroundColor = "#17a2b8";
            }
        } else if (recBtn) {
            recBtn.style.display = 'none';
        }


        const tableBody = document.getElementById('alt-plans-body');
        tableBody.innerHTML = '';
        
        plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice).forEach(p => {
            const isMatch = (p.dataLimit >= userData.avgUsage || p.dataLimit === 999);
            const tag = isMatch ? `<span class="tag tag-match">✔ 適合您</span>` : `<span class="tag tag-fail">✘ 流量不足</span>`;
            const rowClass = isMatch ? '' : 'row-disabled';
            const limitDesc = p.dataLimit === 999 ? '吃到飽' : `${p.dataLimit} GB`;

            const row = `
                <tr class="${rowClass}">
                    <td>${tag}</td>
                    <td><b>${p.provider}</b></td>
                    <td>${p.planName}</td>
                    <td>${limitDesc}</td>
                    <td class="text-right"><b>$ ${p.monthlyPrice}</b></td>
                    <td style="text-align: center;">
                        <button class="btn-primary change-plan-btn" 
                                style="padding: 4px 10px; font-size: 0.8rem; border-radius: 4px; cursor: pointer;"
                                data-provider="${p.provider}" 
                                data-price="${p.monthlyPrice}">
                            切換
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        tableBody.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.change-plan-btn');
            if (targetBtn) {
                const newProvider = targetBtn.dataset.provider;
                const newPrice = parseInt(targetBtn.dataset.price);
                handlePlanChange(targetBtn, newProvider, newPrice);
            }
        });

        if (recBtn) {
            recBtn.addEventListener('click', function() {
                const newProvider = this.dataset.provider;
                const newPrice = parseInt(this.dataset.price);
                if (!newProvider) return;
                handlePlanChange(this, newProvider, newPrice);
            });
        }

    } catch (err) {
        console.error("Dashboard Error:", err);
    }
});