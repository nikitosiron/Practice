const form = document.querySelector('#login-form');
const errorEl = document.querySelector('#error');
const submitBtn = document.querySelector('#submit');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    submitBtn.disabled = true;

    const login = document.querySelector('#login').value.trim();
    const password = document.querySelector('#password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ login, password })
        });
        const body = await res.json();

        if (!res.ok || !body.success) {
            errorEl.textContent = body.message || 'Ошибка входа';
            submitBtn.disabled = false;
            return;
        }

        window.location.href = '/admin/';
    } catch (err) {
        errorEl.textContent = 'Не удалось связаться с сервером';
        submitBtn.disabled = false;
    }
});
