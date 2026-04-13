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
    const filteredStats = stats.filter(s => 
        s.provider && 
        s.provider.trim() !== "" && 
        s.provider !== "string" && 
        s.provider !== "Admin" && 
        s.provider !== "系統管理員"
    );

    const ctx = document.getElementById('providerChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: filteredStats.map(s => s.provider),
            datasets: [{
                data: filteredStats.map(s => s.count),
                backgroundColor: ['#000000', '#333333', '#666666', '#999999', '#CCCCCC'],
                hoverBackgroundColor: ['#3498db', '#3498db', '#3498db', '#3498db', '#3498db'],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 15,
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1) + '%';
                            return `${label}: ${value} 位用戶 (${percentage})`;
                        }
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
            labels: ['高流失風險', '穩定用戶'],
            datasets: [{
                data: [ratio.highRisk, ratio.normal],
                backgroundColor: ['#e74c3c', '#000000'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 15,
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1) + '%';
                            return `佔比: ${percentage} (${value} 人)`;
                        }
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
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><b>${u.username}</b></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.currentProvider}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">$ ${u.currentBill}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.avgUsage === 999 ? '吃到飽' : u.avgUsage + ' GB'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.suggestPlan}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #e74c3c; font-weight: bold;">$ ${u.savings}</td>
        </tr>
    `).join('');
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}