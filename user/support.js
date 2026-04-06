document.addEventListener("DOMContentLoaded", () => {
    loadTickets();
    document.getElementById('ticketForm').addEventListener('submit', createNewTicket);
});

const token = localStorage.getItem('retain_jwt');

async function loadTickets() {
    const list = document.getElementById('ticketList');
    try {
        const res = await fetch('http://localhost:5164/api/Tickets/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tickets = await res.json();

        if (tickets.length === 0) {
            list.innerHTML = '<p class="empty-state">目前沒有任何回報紀錄。</p>';
            return;
        }

        list.innerHTML = tickets.map(t => {
            const messages = t.adminReply ? t.adminReply.split('|||').filter(x => x) : [];
            const isClosed = t.status === "已結案";

            return `
                <div class="ticket-item">
                    <div class="ticket-header">
                        <span>單號：#${t.id} (${t.createdAt})</span>
                        <span>狀態：${t.status}</span>
                    </div>
                    <div class="ticket-body">
                        <div class="chat-box">
                            <div class="bubble me">
                                <b>您的初始回報：</b><br>${t.userMessage}
                                <span class="bubble-time">${t.createdAt}</span>
                            </div>
                            ${messages.map(m => {
                                const isAdmin = m.includes('[Admin|');
                                const content = m.split(']')[1];
                                const info = m.match(/\[(.*?)\]/)[1];
                                return `
                                    <div class="bubble ${isAdmin ? 'other' : 'me'}">
                                        ${content}
                                        <span class="bubble-time">${info}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        ${!isClosed ? `
                            <div class="reply-section">
                                <input type="text" id="reply-val-${t.id}" class="inline-input" placeholder="在這裡輸入後續回覆...">
                                <div class="btn-group">
                                    <button class="btn-send" onclick="sendReply(${t.id})">傳送回覆</button>
                                    <button class="btn-close" onclick="resolveTicket(${t.id})">結案</button>
                                </div>
                            </div>
                        ` : '<p style="text-align:center; color:#999; font-style:italic;">此工單已結案</p>'}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = '<p class="empty-state" style="color:red;">載入失敗，請檢查伺服器。</p>';
    }
}

async function createNewTicket(e) {
    e.preventDefault();
    const content = document.getElementById('messageInput').value;
    if (!content) return alert("請輸入內容！");

    await fetch('http://localhost:5164/api/Tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ Content: content })
    });
    document.getElementById('messageInput').value = '';
    loadTickets();
}

async function sendReply(id) {
    const val = document.getElementById(`reply-val-${id}`).value;
    if (!val) return;

    const res = await fetch(`http://localhost:5164/api/Tickets/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ReplyContent: val })
    });

    if (res.ok) {
        loadTickets(); 
    }
}


async function resolveTicket(id) {
    if (!confirm("確定要結案嗎？結束後將無法再回覆。")) return;
    
    await fetch(`http://localhost:5164/api/Tickets/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadTickets();
}

function logout() {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
}