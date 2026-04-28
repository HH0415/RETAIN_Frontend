document.addEventListener("DOMContentLoaded", () => loadMessages());

const token = localStorage.getItem('retain_jwt');
const container = document.getElementById('msg-container');
let allMessages = [];

async function loadMessages() {
    try {
        const res = await fetch('http://localhost:5164/api/Tickets/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allMessages = await res.json();
        renderCards();
    } catch (err) {
        container.innerHTML = '連線失敗';
    }
}

function renderCards() {
    container.innerHTML = allMessages.map(item => `
        <div class="msg-card">
            <div class="msg-header">
                <div>
                    <h2 class="msg-id">#${item.id} - 客戶: ${item.username}</h2>
                    <p style="font-size:0.8rem; color:#666;">建立時間: ${item.createdAt}</p>
                </div>
                <div class="status-tag">${item.status}</div>
            </div>
            <div class="chat-flow">
                <div class="bubble user">${item.userMessage}</div>
                ${item.adminReply ? `<div class="bubble admin">${item.adminReply.replace(/\|\|\|/g, '<br>')}</div>` : '<p style="text-align:center; color:#999;">尚未有客服回覆</p>'}
            </div>
            <button class="submit-btn-full" style="background:#e74c3c" onclick="deleteTicket(${item.id})">強制刪除工單</button>
        </div>
    `).join('');
}

async function deleteTicket(id) {
    if(!confirm("身為 Admin，您確定要刪除此工單嗎？")) return;
    const res = await fetch(`http://localhost:5164/api/Tickets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) loadMessages();
}