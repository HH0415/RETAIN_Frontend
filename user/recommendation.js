document.addEventListener("DOMContentLoaded", () => {
    loadRecommendationData();
});

const token = localStorage.getItem('retain_jwt');
let userProfile = null;
let allPlansSorted = [];
let currentPage = 1;
const rowsPerPage = 5; 

async function loadRecommendationData() {
    try {
        const [pRes, plansRes] = await Promise.all([
            fetch('http://localhost:5164/api/User/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://localhost:5164/api/Plans')
        ]);

        userProfile = await pRes.json();
        const plans = await plansRes.json();

        document.getElementById('curr-provider').innerText = userProfile.currentProvider || "未填寫";
        document.getElementById('curr-bill').innerText = `$ ${userProfile.currentBill || 0}`;
        document.getElementById('curr-usage').innerText = userProfile.avgUsage === 999 ? "吃到飽" : `${userProfile.avgUsage} GB`;
        document.getElementById('status-text').innerText = "數據解析完成";

        processAndSortPlans(plans);
    } catch (err) {
        console.error("載入失敗:", err);
    }
}

function processAndSortPlans(plans) {
    const usage = userProfile.avgUsage || 0;

    allPlansSorted = plans.map(p => {
        let isSuitable = false;
        if (p.dataLimit === 999) {
            isSuitable = true;
        } else if (usage !== 999 && p.dataLimit >= usage) {
            isSuitable = true;
        }
        return { ...p, isSuitable: isSuitable };
    });

    allPlansSorted.sort((a, b) => {
        if (a.isSuitable !== b.isSuitable) {
            return a.isSuitable ? -1 : 1;
        }
        return a.monthlyPrice - b.monthlyPrice;
    });

    renderTopRecommendation();
    renderTable();
}

function renderTopRecommendation() {
    const best = allPlansSorted.find(p => p.isSuitable);
    if (best) {
        document.getElementById('rec-provider').innerText = best.provider;
        document.getElementById('rec-plan').innerText = best.planName;
        document.getElementById('rec-bill').innerText = `$ ${best.monthlyPrice}`;
        
        const saving = userProfile.currentBill - best.monthlyPrice;
        const savingBox = document.getElementById('saving-box');
        if (saving > 0) {
            savingBox.innerText = `優化結論：每月可省下 $ ${saving} 元，一年共節省 $ ${saving * 12} 元！`;
        } else {
            savingBox.innerText = `優化結論：目前月租已是非常優秀的配置，暫無更便宜且適合的方案。`;
        }
    }
}

function renderTable() {
    const tbody = document.getElementById('alt-plans-body');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const currentData = allPlansSorted.slice(start, end);

    currentData.forEach(p => {
        const row = `
            <tr>
                <td>
                    <span class="recommend-tag ${p.isSuitable ? 'tag-suitable' : 'tag-insufficient'}">
                        ${p.isSuitable ? '✓ 適合您' : '✘ 流量不足'}
                    </span>
                </td>
                <td style="${p.isSuitable ? 'font-weight:bold;' : ''}">${p.provider}</td>
                <td>${p.planName}</td>
                <td>${p.dataLimit === 999 ? '吃到飽' : p.dataLimit + ' GB'}</td>
                <td style="font-weight:bold;">$ ${p.monthlyPrice}</td>
                <td>
                    <button class="btn-switch" ${!p.isSuitable ? 'disabled' : ''} onclick="alert('已模擬切換至：' + '${p.planName}')">切換</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    const totalPages = Math.ceil(allPlansSorted.length / rowsPerPage);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.innerText = i;
        btn.onclick = () => {
            currentPage = i;
            renderTable();
            window.scrollTo({ top: 400, behavior: 'smooth' });
        };
        container.appendChild(btn);
    }
}