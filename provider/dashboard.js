document.addEventListener("DOMContentLoaded", () => {
    initProviderDashboard();
});

function parseJwt(t) {
    try {
        const base64Url = t.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
    } catch (e) {
        return null;
    }
}

async function initProviderDashboard() {
    const token = localStorage.getItem('retain_jwt');
    
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    const decoded = parseJwt(token);
    if (decoded) {
        const brandName = decoded['ProviderBrand'] || '未知電信';
        document.getElementById('nav-brand-logo').textContent = brandName + ' 後台';
        document.getElementById('brand-title').textContent = brandName;
    }
    
    try {
        // 呼叫我們剛剛在 C# 寫好的 ProviderDashboard API
        const res = await fetch('http://localhost:5164/api/ProviderDashboard/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("權限不足或連線失敗");

        const data = await res.json();
        document.getElementById('provider-users').textContent = data.totalUsers;
        document.getElementById('provider-plans').textContent = data.totalPlans;
        document.getElementById('provider-risk-count').textContent = data.riskCount;

        renderPlanChart(data.planStats);
        renderRiskChart(data.riskRatio);
        renderRiskTable(data.riskList);

    } catch (err) {
        console.error(err);
        document.getElementById('provider-users').textContent = '-';
        document.getElementById('provider-plans').textContent = '-';
        document.getElementById('provider-risk-count').textContent = '-';
        document.getElementById('provider-risk-list').innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#d32f2f;">無法載入數據，請確認 C# 後端 API 是否啟動。</td></tr>`;
    }
}

function renderPlanChart(stats) {
    if (!stats || stats.length === 0) return;
    const ctx = document.getElementById('providerPlanChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: stats.map(s => s.planName),
            datasets: [{
                data: stats.map(s => s.count),
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
                    labels: { boxWidth: 15, font: { size: 12, weight: 'bold' }, padding: 15 }
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
    if (!ratio) return;
    const ctx = document.getElementById('providerRiskChart').getContext('2d');
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
                    labels: { boxWidth: 15, font: { size: 12, weight: 'bold' }, padding: 15 }
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
    const tbody = document.getElementById('provider-risk-list');
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">目前無高風險用戶。</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(u => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><b>${u.username}</b></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">$ ${u.currentBill}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.avgUsage === 999 ? '吃到飽' : u.avgUsage + ' GB'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${u.suggestPlan}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #e74c3c; font-weight: bold;">$ ${u.savings || 0}</td>
        </tr>
    `).join('');
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}