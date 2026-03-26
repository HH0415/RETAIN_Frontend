document.getElementById('submitQaBtn').addEventListener('click', async function(event) {
    event.preventDefault();

    const provider = document.getElementById('provider').value;
    const bill = parseInt(document.getElementById('bill').value);
    const usage = parseInt(document.getElementById('usage').value);

    if (!provider || isNaN(bill) || isNaN(usage)) {
        alert("請完整填寫所有問卷欄位！");
        return;
    }

    const token = localStorage.getItem('retain_jwt');

    try {
        const response = await fetch('http://localhost:5164/api/User/questionnaire', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                CurrentProvider: provider,
                CurrentBill: bill,
                AvgUsage: usage
            })
        });

        if (response.ok) {
            alert("資料已更新！正在為您生成專屬資費健檢報告...");
            window.location.href = 'dashboard.html'; 
        } else {
            if(response.status === 401) {
                alert("憑證已過期，請重新登入！");
                logout();
            } else {
                const errorMsg = await response.text();
                alert("儲存失敗：" + errorMsg);
            }
        }
    } catch (error) {
        console.error("API 連線錯誤:", error);
        alert("系統連線異常，請稍後再試。");
    }
});