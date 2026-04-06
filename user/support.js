document.addEventListener("DOMContentLoaded", () => {
    loadTickets();
    document.getElementById('ticketForm').addEventListener('submit', createNewTicket);
});

const token = localStorage.getItem('retain_jwt');
let allTickets = [];
let currentPage = 1;
const rowsPerPage = 3; 

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
}

async function loadTickets() {
    const list = document.getElementById('ticketList');
    try {
        const res = await fetch('http://localhost:5164/api/Tickets/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allTickets = await res.json();
        renderTicketsTable();
    } catch (err) {
        list.innerHTML = '<p class="empty-state" style="color:red;">載入失敗，伺服器連線異常。</p>';
    }
}

function renderTicketsTable() {
    const list = document.getElementById('ticketList');
    const paginationContainer = document.getElementById('pagination');

    if (allTickets.length === 0) {
        list.innerHTML = '<p class="empty-state">目前沒有任何回報紀錄。</p>';
        paginationContainer.innerHTML = '';
        return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = allTickets.slice(startIndex, endIndex);

    list.innerHTML = currentData.map(t => {
        const isClosed = t.status === "已結案" || t.status === "Closed";
        let chatHtml = `<div class="bubble me">${t.userMessage}<span class="bubble-meta">您 | ${formatDate(t.createdAt)}</span></div>`;
        
        if (t.adminReply) {
            const parts = t.adminReply.split('|||').filter(x => x.trim());
            parts.forEach(part => {
                const match = part.match(/\[(.*?)\|(.*?)\](.*)/);
                if (match) {
                    const sender = match[1];
                    const time = match[2];
                    const text = match[3];
                    const isMe = sender !== "Admin";
                    chatHtml += `
                        <div class="bubble ${isMe ? 'me' : 'other'}">
                            ${text}
                            <span class="bubble-meta">${isMe ? '您' : '管理員'} | ${time}</span>
                        </div>`;
                }
            });
        }

        return `
            <div class="ticket-item">
                <div class="ticket-header">
                    <span>單號：#${t.id}</span>
                    <span class="status-label ${isClosed ? 'closed' : ''}">${t.status}</span>
                </div>
                <div class="chat-area">
                    ${chatHtml}
                </div>
                ${!isClosed ? `
                    <div class="reply-container">
                        <input type="text" id="reply-input-${t.id}" class="inline-reply-input" placeholder="對話尚未結束，請輸入您的回覆...">
                        <div class="action-btns">
                            <button class="btn-reply" onclick="sendReply(${t.id})">傳送回覆</button>
                            <button class="btn-resolve" onclick="resolveTicket(${t.id})">結案</button>
                        </div>
                    </div>
                ` : '<div class="closed-msg">本工單已結案，感謝您的回報</div>'}
            </div>
        `;
    }).join('');

    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(allTickets.length / rowsPerPage);
    if (totalPages <= 1) return;

    const createBtn = (text, page, disabled, active = false) => {
        const btn = document.createElement('button');
        btn.className = `page-btn ${active ? 'active' : ''}`;
        btn.innerText = text;
        btn.disabled = disabled;
        btn.onclick = () => {
            currentPage = page;
            renderTicketsTable();
            window.scrollTo({ top: document.getElementById('ticketList').offsetTop - 100, behavior: 'smooth' });
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

async function createNewTicket(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return alert("請輸入內容！");

    try {
        const res = await fetch('http://localhost:5164/api/Tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ Content: content })
        });
        if (res.ok) {
            input.value = '';
            currentPage = 1; 
            loadTickets();
        }
    } catch (err) {
        alert("發送失敗");
    }
}

async function sendReply(id) {
    const input = document.getElementById(`reply-input-${id}`);
    const val = input.value.trim();
    if (!val) return;

    try {
        const res = await fetch(`http://localhost:5164/api/Tickets/${id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ReplyContent: val })
        });
        if (res.ok) {
            loadTickets();
        }
    } catch (err) {
        alert("回覆失敗");
    }
}

async function resolveTicket(id) {
    if (!confirm("確定要結案嗎？結案後雙方將無法再進行回覆。")) return;
    try {
        const res = await fetch(`http://localhost:5164/api/Tickets/${id}/resolve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            loadTickets();
        }
    } catch (err) {
        alert("結案失敗");
    }
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}