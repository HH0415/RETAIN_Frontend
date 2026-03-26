document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('retain_jwt');
    if (!token) return;

    try {
        const res = await fetch('http://localhost:5164/api/User/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const userData = await res.json();
            document.getElementById('profile-username').value = userData.username;
            document.getElementById('profile-name').value = userData.realName || '';
            document.getElementById('profile-phone').value = userData.phone || '';
            document.getElementById('profile-email').value = userData.email || '';
            if (userData.currentProvider) {
                document.getElementById('profile-provider').value = userData.currentProvider;
                document.getElementById('profile-bill').value = userData.currentBill;
                document.getElementById('profile-usage').value = userData.avgUsage;
            }
        } else {
            console.error("無法取得個人資料");
        }
    } catch (error) {
        console.error("載入失敗:", error);
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitData = {
            RealName: document.getElementById('profile-name').value.trim(),
            Phone: document.getElementById('profile-phone').value.trim(),
            Email: document.getElementById('profile-email').value.trim(),
            CurrentProvider: document.getElementById('profile-provider').value,
            CurrentBill: parseInt(document.getElementById('profile-bill').value),
            AvgUsage: parseInt(document.getElementById('profile-usage').value)
        };

        if (isNaN(submitData.CurrentBill) || isNaN(submitData.AvgUsage)) {
            alert("合約費率與用量格式錯誤！");
            return;
        }

        try {
            const updateRes = await fetch('http://localhost:5164/api/User/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (updateRes.ok) {
                alert("個人資料與方案設定已成功更新！系統將依據新資料重新為您推薦。");
                window.location.href = '../user/dashboard.html';
            } else {
                const errorMsg = await updateRes.text();
                alert("更新失敗：" + errorMsg);
            }
        } catch (error) {
            console.error("更新失敗:", error);
            alert("系統連線異常，請稍後再試。");
        }
    });
});