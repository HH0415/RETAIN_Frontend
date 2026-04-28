document.addEventListener("DOMContentLoaded", () => {
    loadMessages();
});

const token = localStorage.getItem('retain_jwt');
const container = document.getElementById('msg-container');
const paginationContainer = document.getElementById('pagination');
const searchWrapper = document.getElementById('search-box-wrapper');
const searchInput = document.getElementById('history-search');

let allMessages = [];
let filteredData = [];
let currentPage = 1;
let currentTab = 'active';
const rowsPerPage = 5;
let currentBrand = '未知電信';

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
}

async function loadMessages() {
    if (!token) return;
    try {
        // 呼叫 Provider 專屬的 API
        const res = await fetch('http://localhost:5164/api/ProviderTickets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        allMessages = await res.json();
        applyFilterAndRender();
    } catch (err) {
        container.innerHTML = '<div style="color:red; text-align:center; padding:50px; border:3px solid #000;">連線失敗，或查無資料</div>';
    }
}

function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    if (searchInput) searchInput.value = '';
    document.getElementById('tab-active').classList.toggle('active', tab === 'active');
    document.getElementById('tab-resolved').classList.toggle('active', tab === 'resolved');
    if (searchWrapper) searchWrapper.style.display = tab === 'resolved' ? 'block' : 'none';
    applyFilterAndRender();
}

function handleSearch() {
    currentPage = 1;
    applyFilterAndRender();
}

function applyFilterAndRender() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    filteredData = allMessages.filter(item => {
        const status = item.status || "";
        const isClosed = status === "已結案" || status === "Closed" || status === "Resolved";
        const matchesTab = currentTab === 'active' ? !isClosed : isClosed;
        if (!matchesTab) return false;
        if (currentTab === 'resolved' && searchTerm) {
            return (item.username || "").toLowerCase().includes(searchTerm) || item.id.toString().includes(searchTerm);
        }
        return true;
    });
    renderCards();
}

function parseThread(item) {
    let html = `<div class="bubble user">${item.userMessage}<span class="bubble-meta">使用者 | ${item.createdAt}</span></div>`;
    if (item.adminReply) {
        const parts = item.adminReply.split('|||').filter(p => p.trim());
        parts.forEach(part => {
            const match = part.match(/\[(.*?)\|(.*?)\](.*)/);
            if (match) {
                const senderName = match[1];
                const time = match[2];
                const content = match[3];
                // 如果是業者自己回覆的，顯示「業者」
                const isAdmin = senderName === "Admin" || senderName.includes("業者");
                html += `<div class="bubble ${isAdmin ? 'admin' : 'user'}">${content}<span class="bubble-meta">${isAdmin ? currentBrand + ' 客服' : senderName} | ${time}</span></div>`;
            } else {
                html += `<div class="bubble admin">${part}</div>`;
            }
        });
    }
    return html;
}

function renderCards() {
    container.innerHTML = '';
    
    const statusMap = {
        "Pending": "待處理",
        "待處理": "待處理",
        "待使用者確認": "待客戶回覆",
        "Closed": "已結案",
        "已結案": "已結案",
        "Resolved": "已結案"
    };

    if (filteredData.length === 0) {
        const msg = currentTab === 'active' ? '目前沒有待處理的客戶工單' : '沒有找到相關的結案紀錄';
        container.innerHTML = `<div style="text-align:center; padding:50px; border:3px solid #000; background:#fff;">${msg}</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const currentData = filteredData.slice(start, end);

    currentData.forEach(item => {
        const statusStr = item.status || "Pending";
        const isClosed = statusStr === "已結案" || statusStr === "Closed" || statusStr === "Resolved";
        const displayStatus = statusMap[statusStr] || statusStr;
        
        const card = document.createElement('div');
        card.className = 'msg-card collapsed'; 
        card.innerHTML = `
            <div class="msg-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="header-left">
                    <h2 class="msg-id">工單編號：#${item.id}</h2>
                    <span class="toggle-arrow">▼</span>
                </div>
                <div class="status-tag" style="background:${isClosed ? '#eee' : '#000'}; color:${isClosed ? '#666' : '#fff'};">
                    ${displayStatus}
                </div>
            </div>
            
            <div class="card-body-content">
                <div class="user-info-brief">
                    <b>發起用戶：</b> ${item.username} <br>
                    <b>建立時間：</b> ${item.createdAt}
                </div>
                <div class="chat-flow">${parseThread(item)}</div>
                ${!isClosed ? `
                    <textarea class="reply-area" id="reply-text-${item.id}" placeholder="輸入回覆內容..."></textarea>
                    <button class="submit-btn-full" onclick="sendReply(${item.id})">發送回覆</button>
                    <button class="submit-btn-full" style="background-color: #e74c3c; margin-top: 5px;" onclick="closeTicket(${item.id})">強制結案</button>
                ` : `<div class="closed-banner">此工單已結案，僅供查看</div>`}
            </div>
        `;
        container.appendChild(card);
    });

    renderPagination();
}

function renderPagination() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (totalPages <= 1) return;
    const createBtn = (text, page, disabled, active = false) => {
        const btn = document.createElement('button');
        btn.className = `page-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => { currentPage = page; renderCards(); window.scrollTo(0, 0); };
        paginationContainer.appendChild(btn);
    };
    createBtn('≪', 1, currentPage === 1);
    createBtn('＜', currentPage - 1, currentPage === 1);
    for (let i = 1; i <= totalPages; i++) {
        if (i >= currentPage - 2 && i <= currentPage + 2) createBtn(i, i, false, i === currentPage);
    }
    createBtn('＞', currentPage + 1, currentPage === totalPages);
    createBtn('≫', totalPages, currentPage === totalPages);
}

window.sendReply = async (id) => {
    const replyArea = document.getElementById(`reply-text-${id}`);
    const content = replyArea.value.trim();
    if (!content) return alert("請輸入內容");
    try {
        const res = await fetch(`http://localhost:5164/api/ProviderTickets/${id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ReplyContent: content })
        });
        if (res.ok) {
            alert("回覆成功！");
            loadMessages();
        } else {
            alert("回覆失敗，請確認您有權限操作此工單。");
        }
    } catch (err) { alert("網路異常"); }
};

window.closeTicket = async (id) => {
    if (!confirm("確定要強制結案嗎？")) return;
    try {
        const res = await fetch(`http://localhost:5164/api/ProviderTickets/${id}/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert("結案成功！");
            loadMessages();
        }
    } catch (err) { alert("網路異常"); }
};

window.logout = function() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
};