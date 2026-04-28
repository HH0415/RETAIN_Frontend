document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('retain_jwt');
    const tableBody = document.getElementById('plans-list-body');
    const paginationContainer = document.getElementById('pagination');
    const form = document.getElementById('add-plan-form');
    const submitBtn = document.getElementById('add-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const editPlanIdInput = document.getElementById('edit-plan-id');

    let allPlans = [];
    let currentPage = 1;
    const rowsPerPage = 5; 

    async function loadPlans() {
        try {
            const res = await fetch('http://localhost:5164/api/AdminPlans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            allPlans = await res.json();
            renderTable();
        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:red;">連線失敗</td></tr>';
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';
        if (allPlans.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">目前系統內無方案資料</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * rowsPerPage;
        const currentData = allPlans.slice(startIndex, startIndex + rowsPerPage);

        currentData.forEach(p => {
            const limitText = p.dataLimit === 999 ? "吃到飽" : `${p.dataLimit} GB`;
            const row = `
                <tr>
                    <td><span class="role-tag">${p.provider}</span></td>
                    <td><b>${p.planName}</b></td>
                    <td>$ ${p.monthlyPrice}</td>
                    <td>${limitText}</td>
                    <td style="text-align: center;">
                        <button class="btn-edit" onclick="editPlan(${p.id})">修改</button>
                        <button class="btn-delete" onclick="deletePlan(${p.id})">刪除</button>
                    </td>
                </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        renderPagination();
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(allPlans.length / rowsPerPage);
        if (totalPages <= 1) return;

        const createBtn = (text, targetPage, disabled, active = false) => {
            const btn = document.createElement('button');
            btn.className = `page-btn ${active ? 'active' : ''}`;
            btn.innerText = text;
            btn.disabled = disabled;
            btn.onclick = () => {
                currentPage = targetPage;
                renderTable();
                window.scrollTo({ top: 300, behavior: 'smooth' });
            };
            paginationContainer.appendChild(btn);
        };

        createBtn('≪', 1, currentPage === 1);
        createBtn('＜', currentPage - 1, currentPage === 1);
        for (let i = 1; i <= totalPages; i++) {
            if (i >= currentPage - 2 && i <= currentPage + 2) {
                createBtn(i, i, false, i === currentPage);
            }
        }
        createBtn('＞', currentPage + 1, currentPage === totalPages);
        createBtn('≫', totalPages, currentPage === totalPages);
    }

    window.editPlan = (id) => {
        const plan = allPlans.find(p => p.id === id);
        if (!plan) return;
        document.getElementById('p-provider').value = plan.provider;
        document.getElementById('p-name').value = plan.planName;
        document.getElementById('p-price').value = plan.monthlyPrice;
        document.getElementById('p-limit').value = plan.dataLimit === 999 ? "吃到飽" : plan.dataLimit;
        editPlanIdInput.value = plan.id;
        submitBtn.textContent = "儲存修改";
        cancelBtn.style.display = "inline-block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deletePlan = async (id) => {
        if (!confirm('確定要刪除此全域方案嗎？此動作無法復原。')) return;
        try {
            const res = await fetch(`http://localhost:5164/api/AdminPlans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadPlans();
        } catch (err) { alert("刪除失敗"); }
    };

    cancelBtn.onclick = () => {
        form.reset();
        editPlanIdInput.value = "";
        submitBtn.textContent = "新增方案";
        cancelBtn.style.display = "none";
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = editPlanIdInput.value;
        const payload = {
            id: id ? parseInt(id) : 0,
            provider: document.getElementById('p-provider').value,
            planName: document.getElementById('p-name').value,
            monthlyPrice: parseInt(document.getElementById('p-price').value),
            dataLimit: document.getElementById('p-limit').value === "吃到飽" ? 999 : parseInt(document.getElementById('p-limit').value)
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `http://localhost:5164/api/AdminPlans/${id}` : 'http://localhost:5164/api/AdminPlans';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("方案處理成功");
            cancelBtn.click();
            loadPlans();
        }
    };

    loadPlans();
});