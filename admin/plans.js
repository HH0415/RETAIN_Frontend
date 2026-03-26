document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const tableBody = document.getElementById('plans-list-body');
    const addForm = document.getElementById('add-plan-form');

    async function fetchPlans() {
        try {
            const res = await fetch('http://localhost:5164/api/Plans');
            const data = await res.json();
            
            tableBody.innerHTML = '';
            data.forEach(p => {
                const limitDisplay = p.dataLimit === 999 ? '吃到飽' : `${p.dataLimit} GB`;
                
                const row = `
                    <tr>
                        <td>${p.id}</td>
                        <td><b>${p.provider}</b></td>
                        <td>${p.planName}</td>
                        <td>$ ${p.monthlyPrice}</td>
                        <td>${limitDisplay}</td>
                        <td style="text-align: center;">
                            <button class="btn-delete" onclick="deletePlan(${p.id})">刪除</button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (err) {
            console.error("載入失敗:", err);
            tableBody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">資料抓取異常，請檢查 API</td></tr>';
        }
    }

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const limitRaw = document.getElementById('p-limit').value.trim();
        let limitValue;

        if (limitRaw === "吃到飽") {
            limitValue = 999;
        } else {
            limitValue = parseInt(limitRaw);
            if (isNaN(limitValue)) {
                alert("流量請輸入數字或輸入『吃到飽』");
                return;
            }
        }

        const payload = {
            Provider: document.getElementById('p-provider').value,
            PlanName: document.getElementById('p-name').value,
            MonthlyPrice: parseInt(document.getElementById('p-price').value),
            DataLimit: limitValue
        };

        try {
            const res = await fetch('http://localhost:5164/api/Plans', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("成功寫入 Plans 表！");
                addForm.reset();
                fetchPlans(); 
            } else {
                alert("新增失敗，請檢查管理者權限");
            }
        } catch (err) {
            alert("伺服器連線異常");
        }
    });

    window.deletePlan = async (id) => {
        if (!confirm(`確定要從資料庫移除 ID: ${id} 的方案嗎？`)) return;

        try {
            const res = await fetch(`http://localhost:5164/api/Plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchPlans();
            } else {
                alert("刪除失敗");
            }
        } catch (err) {
            alert("連線異常");
        }
    };

    fetchPlans();
});