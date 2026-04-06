document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const ticketsArea = document.getElementById('tickets-area');
    const newTicketForm = document.getElementById('newTicketForm');

    async function checkUserStatus() {
        try {
            const res = await fetch('http://localhost:5164/api/Users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const user = await res.json();
            if (!user.currentBill || user.currentBill === 0) {
                alert("首次使用請先完成基礎用量問卷。");
                window.location.href = "../user/questionnaire.html";
            }
        } catch (err) { console.error(err); }
    }

    async function loadTickets() {
        try {
            const res = await fetch('http://localhost:5164/api/Tickets/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await res.json();
            renderTickets(tickets);
        } catch (err) {
            ticketsArea.innerHTML = '<p>載入失敗</p>';
        }
    }

    function renderTickets(tickets) {
        if (!tickets || tickets.length === 0) {
            ticketsArea.innerHTML = '<div class="no-ticket">目前沒有任何諮詢紀錄。</div>';
            return;
        }
        ticketsArea.innerHTML = '';
        tickets.forEach(t => {
            const isClosed = t.status === "已結案" || t.status === "Closed";
            const html = `
                <div class="chat-container">
                    <div class="chat-header">
                        <span>諮詢編號：#${t.id}</span>
                        <span>狀態：${isClosed ? '已結案' : t.status}</span>
                    </div>
                    <div class="chat-box" id="chat-${t.id}">
                        <div class="msg msg-user">
                            <span class="msg-time">我 - ${new Date(t.createdAt).toLocaleString()}</span>
                            ${t.userMessage}
                        </div>
                        ${t.adminReply ? formatReplies(t.adminReply) : ''}
                    </div>
                    ${!isClosed ? `
                        <div class="chat-footer">
                            <input type="text" id="input-${t.id}" class="black-input" placeholder="再次回覆...">
                            <button onclick="replyTicket(${t.id})" class="btn-black">發送</button>
                            <button onclick="resolveTicket(${t.id})" class="btn-outline">結案</button>
                        </div>
                    ` : '<div style="padding:15px; text-align:center; font-weight:bold; color:#666;">此工單已結案</div>'}
                </div>
            `;
            ticketsArea.insertAdjacentHTML('beforeend', html);
            const box = document.getElementById(`chat-${t.id}`);
            box.scrollTop = box.scrollHeight;
        });
    }

    function formatReplies(str) {
        if (!str) return '';
        return str.split('\n\n').filter(s => s.trim()).map(block => {
            const lines = block.split('\n');
            const header = lines[0];
            const content = lines.slice(1).join('\n');
            const isAdmin = header.includes('管理員');
            return `
                <div class="msg ${isAdmin ? 'msg-admin' : 'msg-user'}">
                    <span class="msg-time">${header}</span>
                    <div style="white-space:pre-wrap;">${content}</div>
                </div>
            `;
        }).join('');
    }

    newTicketForm.onsubmit = async (e) => {
        e.preventDefault();
        const content = document.getElementById('newMsgInput').value.trim();
        const res = await fetch('http://localhost:5164/api/Tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ Content: content })
        });
        if (res.ok) {
            document.getElementById('newMsgInput').value = '';
            loadTickets();
        }
    };

    window.replyTicket = async (id) => {
        const msg = document.getElementById(`input-${id}`).value.trim();
        if (!msg) return;
        await fetch(`http://localhost:5164/api/Tickets/${id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ReplyContent: msg })
        });
        loadTickets();
    };

    window.resolveTicket = async (id) => {
        if (!confirm("確定要結案嗎？")) return;
        await fetch(`http://localhost:5164/api/Tickets/${id}/resolve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadTickets();
    };

    await checkUserStatus();
    loadTickets();
});