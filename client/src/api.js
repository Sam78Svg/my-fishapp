export function apiFetch(input, options = {}) {
    const headers = new Headers(options.headers || {});
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
        try {
            const token = JSON.parse(rawUser)?.token;
            if (token) headers.set('Authorization', `Bearer ${token}`);
        } catch {
            localStorage.removeItem('user');
        }
    }
    return fetch(input, { ...options, headers });
}
