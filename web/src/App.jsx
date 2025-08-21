import { useEffect, useState } from 'react';
import { getVideos, importUrl, toggle, del, enableAll, disableAll } from './api';

function VideoCard({ v, onToggle, onDelete }) {
  const [checking, setChecking] = useState(false);
  const [img, setImg] = useState(v.thumbMax);

  return (
    <div className="card">
      <img src={img} onError={() => setImg(v.thumbHQ)} alt={v.id} />
      <div className="row">
        <label className="switch">
          <input type="checkbox" checked={v.enabled} onChange={async e => { setChecking(true); await onToggle(v.id, e.target.checked); setChecking(false); }} />
          <span> {v.enabled ? 'Enabled' : 'Disabled'} </span>
        </label>
        <button className="danger" disabled={checking} onClick={() => onDelete(v.id)}>Delete</button>
      </div>
      <small>{(v.size/1_000_000).toFixed(1)} MB · {new Date(v.mtimeMs).toLocaleString()}</small>
    </div>
  );
}

export default function App() {
  const [list, setList] = useState([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => setList(await getVideos());

  useEffect(() => { refresh(); }, []);

  const doImport = async () => {
    if (!url) return;
    setBusy(true);
    const r = await importUrl(url);
    setBusy(false);
    if (r.error) alert(r.error);
    setUrl('');
    refresh();
  };

  const onToggle = async (id, enabled) => {
    const r = await toggle(id, enabled);
    if (r.error) alert(r.error);
    refresh();
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    const r = await del(id);
    if (r.error) alert(r.error);
    refresh();
  };

  return (
    <div className="wrap">
      <h1>Plex Pre-Roll Manager</h1>
      <div className="import">
        <input placeholder="Paste YouTube video URL…" value={url} onChange={e=>setUrl(e.target.value)} />
        <button disabled={busy} onClick={doImport}>{busy ? 'Importing…' : 'Import'}</button>
      </div>

      <div className="bulk">
        <button onClick={async ()=>{ await enableAll(); refresh(); }}>Enable All</button>
        <button onClick={async ()=>{ await disableAll(); refresh(); }}>Disable All</button>
      </div>

      <div className="grid">
        {list.map(v => <VideoCard key={v.id} v={v} onToggle={onToggle} onDelete={onDelete} />)}
      </div>

      <style>{`
        .wrap { max-width: 1100px; margin: 24px auto; font: 14px system-ui, sans-serif; }
        h1 { margin: 0 0 16px; }
        .import { display:flex; gap:8px; margin-bottom: 12px; }
        input { flex:1; padding:10px; }
        button { padding:10px 14px; cursor:pointer; }
        .bulk { display:flex; gap:8px; margin: 6px 0 18px; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
        .card { border:1px solid #ddd; border-radius:12px; padding:10px; display:flex; flex-direction:column; gap:8px; }
        .card img { width:100%; border-radius:8px; aspect-ratio:16/9; object-fit:cover; background:#f3f3f3; }
        .row { display:flex; justify-content:space-between; align-items:center; }
        .danger { background:#c62828; color:#fff; }
        .switch input { transform: scale(1.2); margin-right: 6px; }
      `}</style>
    </div>
  );
}
