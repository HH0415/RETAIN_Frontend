document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const tableBody = document.getElementById('user-list-body');
    const paginationContainer = document.getElementById('pagination');

    let allCustomers = [];
    let allPlans = [];
    let currentPage = 1;
    const rowsPerPage = 5; 

    async function loadData() {
        try {
            const [usersRes, plansRes] = await Promise.all([
                fetch('http://localhost:5164/api/Users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5164/api/Plans')
            ]);

            if (!usersRes.ok) throw new Error("權限不足或 API 錯誤");
            
            const users = await usersRes.json();
            allPlans = await plansRes.json();

            allCustomers = users.filter(u => u.role !== 'Admin');

            renderTable();
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; padding: 20px;">${err.message}</td></tr>`;
            if (paginationContainer) paginationContainer.innerHTML = '';
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';

        if (allCustomers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">目前沒有任何使用者資料</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentData = allCustomers.slice(startIndex, endIndex);

        currentData.forEach(user => {
            let riskLevel = "低風險";
            let riskClass = "risk-low";

            const betterPlans = allPlans.filter(p => p.dataLimit >= user.avgUsage && p.monthlyPrice < user.currentBill);
            
            if (betterPlans.length > 3) {
                riskLevel = "極高風險";
                riskClass = "risk-high";
            } else if (betterPlans.length > 0) {
                riskLevel = "中等風險";
                riskClass = "risk-medium";
            }

            const usageText = user.avgUsage === 999 ? '吃到飽' : (user.avgUsage || 0) + ' GB';

            const row = `
                <tr>
                    <td><b>${user.username}</b></td>
                    <td>${user.currentProvider || '未填寫'}</td>
                    <td>$ ${user.currentBill || 0}</td>
                    <td>${usageText}</td>
                    <td>
                        <span class="risk-tag ${riskClass}">${riskLevel}</span>
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
        const totalPages = Math.ceil(allCustomers.length / rowsPerPage);

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

    loadData();
});