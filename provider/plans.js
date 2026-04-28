document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const form = document.getElementById('add-plan-form');
    const tableBody = document.getElementById('plans-list-body');
    const paginationContainer = document.getElementById('pagination');
    const submitBtn = document.getElementById('add-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const editPlanIdInput = document.getElementById('edit-plan-id');
    const providerInput = document.getElementById('p-provider');

    let allPlans = [];
    let currentPage = 1;
    const rowsPerPage = 5;
    let currentBrand = "未知電信";

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
        currentBrand = decoded['ProviderBrand'] || '未知電信';
        document.getElementById('nav-brand-logo').textContent = currentBrand + ' 後台';
        document.getElementById('brand-title').textContent = currentBrand;
        providerInput.value = currentBrand; 
    }

    async function loadPlans() {
        try {
            // 呼叫專屬業者的 API 端點
            const res = await fetch('http://localhost:5164/api/ProviderPlans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("權限不足");
            allPlans = await res.json();
            renderTable();
        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">載入失敗或無權限存取</td></tr>';
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';

        if (allPlans.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">目前沒有任何方案資料</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentData = allPlans.slice(startIndex, endIndex);

        currentData.forEach(p => {
            const limitText = p.dataLimit === 999 ? "吃到飽" : `${p.dataLimit} GB`;
            const row = `
                <tr>
                    <td>${p.planName}</td>
                    <td>$ ${p.monthlyPrice}</td>
                    <td>${limitText}</td>
                    <td style="text-align: center;">
                        <button class="btn-edit" onclick="editPlan(${p.id})">修改</button>
                        <button class="btn-delete" onclick="deletePlan(${p.id})">刪除</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        renderPagination();
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(allPlans.length / rowsPerPage);

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

    window.editPlan = (id) => {
        const plan = allPlans.find(p => p.id === id);
        if (!plan) return;
        document.getElementById('p-name').value = plan.planName;
        document.getElementById('p-price').value = plan.monthlyPrice;
        document.getElementById('p-limit').value = plan.dataLimit === 999 ? "吃到飽" : plan.dataLimit;
        editPlanIdInput.value = plan.id;
        submitBtn.textContent = "儲存修改";
        cancelBtn.style.display = "inline-block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    cancelBtn.addEventListener('click', () => {
        form.reset();
        editPlanIdInput.value = "";
        providerInput.value = currentBrand; 
        submitBtn.textContent = "新增方案";
        cancelBtn.style.display = "none";
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editPlanIdInput.value;
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        let limitInput = document.getElementById('p-limit').value.trim();
        const limit = limitInput === "吃到飽" ? 999 : parseInt(limitInput);

        const payload = {
            id: id ? parseInt(id) : 0,
            provider: currentBrand, 
            planName: name,
            monthlyPrice: parseInt(price),
            dataLimit: limit
        };

        const url = id ? `http://localhost:5164/api/ProviderPlans/${id}` : 'http://localhost:5164/api/ProviderPlans';
        const method = id ? 'PUT' : 'POST';
        submitBtn.disabled = true;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(id ? "修改成功！" : "新增成功！");
                cancelBtn.click();
                loadPlans();
            } else {
                alert("操作失敗，請檢查格式或權限");
            }
        } catch (err) {
            alert("伺服器連線異常");
        } finally {
            submitBtn.disabled = false;
        }
    });

    window.deletePlan = async (id) => {
        if (!confirm('確定要刪除這個方案嗎？')) return;
        try {
            const res = await fetch(`http://localhost:5164/api/ProviderPlans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("刪除成功！");
                loadPlans();
            } else {
                alert("刪除失敗，權限不足");
            }
        } catch (err) {
            alert("伺服器連線異常");
        }
    };

    window.logout = function() {
        localStorage.removeItem('retain_jwt');
        window.location.href = '../auth/login.html';
    };

    loadPlans();
});