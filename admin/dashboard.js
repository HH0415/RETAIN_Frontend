const mockData = [
    { id: '#USR-9921', risk: '92.4%', reason: '價格敏感' },
    { id: '#USR-4412', risk: '88.1%', reason: '訊號不滿' }
];
const list = document.getElementById('churnList');
mockData.forEach(item => {
    list.innerHTML += `<tr><td>${item.id}</td><td style="color:var(--danger)">${item.risk}</td><td>${item.reason}</td></tr>`;
});