document.addEventListener('DOMContentLoaded', function() {
    const role = localStorage.getItem('role');
    let navFile = '';

    if (role === 'admin') {
        navFile = '/shared/nav_admin.html'; 
    } else if (role === 'user') {
        navFile = '/shared/nav_admin.html';
    } else {
        navFile = '/shared/nav_public.html';
    }

    fetch(navFile)
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML('afterbegin', data); 

            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-links li a');
            navLinks.forEach(link => {
                if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').replace('..', ''))) {
                    link.classList.add('active');
                }
            });

            const logoutBtn = document.getElementById('logoutButton');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    localStorage.removeItem('token'); 
                    localStorage.removeItem('role');  
                    alert('已順利登出系統！期待您再次使用 RETAIN。');
                    window.location.href = '../auth/login.html'; 
                });
            }
        })
        .catch(error => console.error('Error loading navigation:', error));
});