document.addEventListener("DOMContentLoaded", () => {
    const questForm = document.getElementById('questForm');
    const msg = document.getElementById('statusMsg');
    const submitBtn = document.getElementById('submitBtn');
    const token = localStorage.getItem('retain_jwt');

    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const provider = document.getElementById('currentProvider').value;
        const bill = document.getElementById('currentBill').value;
        const usage = document.getElementById('avgUsage').value;
        const phone = document.getElementById('contactPhone').value;

        submitBtn.disabled = true;
        submitBtn.textContent = "分析中...";

        try {
            const response = await fetch('http://localhost:5164/api/User/questionnaire', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    CurrentProvider: provider, 
                    CurrentBill: parseInt(bill), 
                    AvgUsage: parseInt(usage),
                    Phone: phone
                })
            });

            if (response.ok) {
                if (msg) msg.innerHTML = "<span style='color: #2e7d32;'>資料已更新，正在為您生成建議方案...</span>";
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                if (msg) msg.innerHTML = "<span style='color: #d32f2f;'>更新失敗，請檢查權限</span>";
                submitBtn.disabled = false;
                submitBtn.textContent = "開始資費健檢";
            }
        } catch (error) {
            if (msg) msg.innerHTML = "<span style='color: #d32f2f;'>伺服器連線異常</span>";
            submitBtn.disabled = false;
            submitBtn.textContent = "開始資費健檢";
        }
    });
});

window.logout = () => {
    localStorage.removeItem('retain_jwt');
    window.location.href = '../auth/login.html';
};