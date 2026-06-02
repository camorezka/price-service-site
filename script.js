const API_URL = "https://price-service-51a3.onrender.com";
const tg = window.Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe?.user?.id || 12345;
console.log(tg.initDataUnsafe);
console.log(userId);



document.getElementById('auth-btn').onclick = async () => {
    const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: userId,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        })
    });
    
    if (response.ok) {
        document.getElementById('auth-form').classList.add('hidden');
        document.getElementById('task-form').classList.remove('hidden');
    }
};

document.getElementById('add-task-btn').onclick = async () => {
    await fetch(`${API_URL}/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: userId,
            url: document.getElementById('url').value,
            type: document.getElementById('type').value
        })
    });
    alert("Мониторинг успешно запущен!");
};
