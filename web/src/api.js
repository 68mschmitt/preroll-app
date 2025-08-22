const API = import.meta.env.VITE_API || 'http://localhost:5175';
export const getVideos = () =>
    fetch(`${API}/api/videos`)
    .then(r => r.json());

export const importUrl = (url) =>
    fetch(
        `${API}/api/import`,
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ url }) 
        })
        .then(r => r.json());

export const toggle = (id, enabled) =>
    fetch(
        `${API}/api/videos/${id}/toggle`,
        {
            method:'PATCH',
            headers:{'Content-Type':'application/json' },
            body: JSON.stringify({ enabled })
        })
        .then(r => r.json());

export const del = (id) => fetch(`${API}/api/videos/${id}`, { method:'DELETE' }).then(r => r.json());
export const enableAll = () => fetch(`${API}/api/enableAll`, { method:'POST' }).then(r => r.json());
export const disableAll= () => fetch(`${API}/api/disableAll`,{ method:'POST' }).then(r => r.json());
