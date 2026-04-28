document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const tableBody = document.getElementById('user-list-body');
    const paginationContainer = document.getElementById('pagination');

    let allRiskUsers = [];
    let currentPage = 1;
    const rowsPerPage = 10; 

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

    const decoded = parseJwt(token);
    if (decoded) {
        const brandName = decoded['ProviderBrand'] || '未知電信';
        document.getElementById('nav-brand-logo').textContent = brandName + ' 後台';
        document.getElementById('brand-title').textContent = brandName;
    }

    async function loadData() {
        try {
            // 直接呼叫後端 API 取得已分析好風險的名單
            const res = await fetch('http://localhost:5164/api/ProviderRiskUsers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("權限不足或連線失敗");
            
            allRiskUsers = await res.json();
            renderTable();
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">${err.message}</td></tr>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';

        if (allRiskUsers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">太棒了！目前沒有高流失風險的客戶。</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentData = allRiskUsers.slice(startIndex, endIndex);

        currentData.forEach(user => {
            let riskClass = "risk-low";
            if (user.riskLevel === "極高風險") riskClass = "risk-high";
            else if (user.riskLevel === "中等風險") riskClass = "risk-medium";

            const usageText = user.avgUsage === 999 ? '吃到飽' : (user.avgUsage || 0) + ' GB';

            const row = `
                <tr>
                    <td><b>${user.username}</b></td>
                    <td>$ ${user.currentBill || 0}</td>
                    <td>${usageText}</td>
                    <td><span class="risk-tag ${riskClass}">${user.riskLevel}</span></td>
                    <td style="color: #666; font-weight: bold;">${user.suggestPlan || '無建議'}</td>
                    <td>
                        <button class="btn-action" onclick="alert('已發送專屬優惠簡訊給 ${user.username}')">挽留通知</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        renderPagination();
    }

    function renderPagination() {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(allRiskUsers.length / rowsPerPage);

        if (totalPages <= 1) return;

        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-btn';
        firstBtn.innerText = '≪';
        firstBtn.disabled = currentPage === 1;
        firstBtn.onclick = () => { currentPage = 1; renderTable(); };
        paginationContainer.appendChild(firstBtn);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerText = '＜';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { currentPage--; renderTable(); };
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => { currentPage = i; renderTable(); };
            paginationContainer.appendChild(btn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerText = '＞';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { currentPage++; renderTable(); };
        paginationContainer.appendChild(nextBtn);

        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-btn';
        lastBtn.innerText = '≫';
        lastBtn.disabled = currentPage === totalPages;
        lastBtn.onclick = () => { currentPage = totalPages; renderTable(); };
        paginationContainer.appendChild(lastBtn);
    }

    window.logout = function() {
        localStorage.removeItem('retain_jwt');
        window.location.href = '../auth/login.html';
    };

    loadData();
});