document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
});

async function initAdminDashboard() {
    const token = localStorage.getItem('retain_jwt');
    
    try {
        const res = await fetch('http://localhost:5164/api/AdminDashboard/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("權限不足或連線失敗");

        const data = await res.json();
        document.getElementById('total-users').textContent = data.totalUsers;
        document.getElementById('total-plans').textContent = data.totalPlans;
        document.getElementById('total-tickets').textContent = data.totalTickets;

        renderProviderChart(data.providerStats);
        renderRiskChart(data.riskRatio);
        renderRiskTable(data.riskList);

    } catch (err) {
        console.error(err);
        alert("無法載入儀表板數據，請檢查登入狀態。");
    }
}

function renderProviderChart(stats) {
    const filteredStats = stats.filter(s => s.provider && s.provider.trim() !== "" && s.provider !== "string");
    const ctx = document.getElementById('providerChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: filteredStats.map(s => s.provider),
            datasets: [{
                data: filteredStats.map(s => s.count),
                backgroundColor: ['#000', '#444', '#888', '#ccc', '#eee'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 12 },
                        padding: 20
                    }
                }
            }
        }
    });
}

function renderRiskChart(ratio) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['高風險 (溢繳)', '一般用戶'],
            datasets: [{
                data: [ratio.highRisk, ratio.normal],
                backgroundColor: ['#d32f2f', '#000'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 12 },
                        padding: 20
                    }
                }
            }
        }
    });
}

function renderRiskTable(list) {
    const tbody = document.getElementById('risk-list-body');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">目前無高風險用戶。</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(u => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.username}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.currentProvider}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">$ ${u.currentBill}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.avgUsage}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.suggestPlan}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: red; font-weight: bold;">$ ${u.savings}</td>
        </tr>
    `).join('');
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}