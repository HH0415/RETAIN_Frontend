function handleReply() {
            const reply = prompt("請輸入回覆內容：", "系統已初步診斷北區基地台運作正常，主因為高密度建築干擾，建議您前往資費健檢頁面轉換方案。");
            if (reply) {
                alert("回覆已送出並同步至使用者頻道。");
            }
        }