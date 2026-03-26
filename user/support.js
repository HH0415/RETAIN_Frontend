document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (typeof logout === 'function') logout();
    });

    const token = localStorage.getItem('retain_jwt');
    if (!token) return;

    const ticketForm = document.getElementById('ticketForm');
    const ticketList = document.getElementById('ticketList');

    async function loadTickets() {
        try {
            const res = await fetch('http://localhost:5164/api/Support/my-tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("無法取得留言紀錄");
            const tickets = await res.json();

            ticketList.innerHTML = ''; 

            if (tickets.length === 0) {
                ticketList.innerHTML = '<p style="text-align:center; color:#666;">目前沒有任何回報紀錄。</p>';
                return;
            }

            tickets.forEach(t => {
                const statusClass = t.status === 'Pending' ? 'status-pending' : 'status-closed';
                const statusText = t.status === 'Pending' ? '待處理' : '已結案';
                
                const replyHtml = t.adminReply 
                    ? `<div class="admin-reply-box">
                           <div class="admin-reply-label">系統管理員回覆：</div>
                           <div class="admin-reply-text">${t.adminReply}</div>
                       </div>` 
                    : `<div class="no-reply">客服人員正在處理您的問題，請耐心等候...</div>`;

                const ticketHtml = `
                    <div class="ticket-item">
                        <div class="ticket-header">
                            <span>發問時間：${t.createdAt}</span>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="ticket-body">
                            <div class="user-msg-label">您的回報內容：</div>
                            <div class="user-msg-text">${t.userMessage}</div>
                            ${replyHtml}
                        </div>
                    </div>
                `;
                ticketList.insertAdjacentHTML('beforeend', ticketHtml);
            });
        } catch (error) {
            console.error(error);
            ticketList.innerHTML = '<p style="text-align:center; color:red;">載入失敗，請稍後再試。</p>';
        }
    }

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgInput = document.getElementById('messageInput');
        const message = msgInput.value.trim();

        if (!message) {
            alert("請輸入回報內容！");
            return;
        }

        try {
            const res = await fetch('http://localhost:5164/api/Support/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: message })
            });

            if (res.ok) {
                alert("回報成功！");
                msgInput.value = ''; 
                loadTickets(); 
            } else {
                alert("發送失敗，請稍後再試。");
            }
        } catch (error) {
            console.error(error);
            alert("伺服器連線異常。");
        }
    });

    loadTickets();
});