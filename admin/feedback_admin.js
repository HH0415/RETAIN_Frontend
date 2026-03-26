document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    const container = document.getElementById('msg-container');

    async function loadMessages() {
        try {
            const res = await fetch('http://localhost:5164/api/Tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:50px; border:3px solid #000;">目前沒有待處理的留言！🎉</div>';
                return;
            }

            container.innerHTML = '';
            data.forEach(item => {
                if (item.status === "已結案") return;

                const card = `
                    <div class="msg-card">
                        <div class="msg-header">
                            <h2 class="msg-id">留言編號：#MSG-${item.id}</h2>
                            <div class="status-tag">狀態：${item.status}</div>
                        </div>
                        
                        <div class="msg-info">
                            回報使用者：<b>${item.username || "匿名"}</b><br>
                            發生時間：${new Date(item.createdAt).toLocaleString()}
                        </div>

                        <div class="box-title">使用者訊息內容：</div>
                        <div class="user-content">${item.userMessage}</div>

                        <div class="box-title">管理員回覆內容：</div>
                        <textarea class="reply-area" id="reply-${item.id}" placeholder="輸入回覆內容..."></textarea>

                        <button class="submit-btn-full" onclick="handleReply(${item.id})">送出回覆並結案</button>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', card);
            });
        } catch (err) {
            container.innerHTML = '<div style="color:red; text-align:center;">連線失敗</div>';
        }
    }

    window.handleReply = async (id) => {
        const replyText = document.getElementById(`reply-${id}`).value.trim();
        if (!replyText) return alert("請輸入內容！");

        try {
            const res = await fetch(`http://localhost:5164/api/Tickets/${id}/reply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ReplyContent: replyText })
            });

            if (res.ok) {
                alert("回覆成功！");
                loadMessages();
            }
        } catch (err) {
            alert("網路異常");
        }
    };

    loadMessages();
});