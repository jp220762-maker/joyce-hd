'use client';
import { useEffect, useState } from 'react';

export default function PostManager({ adminKey }) {
  const [posts, setPosts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // 正在編輯的文章物件或 'new'
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('posts');

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/posts?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' });
    const d = await r.json();
    setPosts(d.posts || []);
    setCats(d.categories || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function send(payload) {
    setMsg('處理中…');
    const r = await fetch(`/api/posts?key=${encodeURIComponent(adminKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) { setMsg('✗ ' + (d.error || '失敗')); return false; }
    setMsg('✓ 已儲存');
    await load();
    setTimeout(() => setMsg(''), 2500);
    return true;
  }

  function exportAll() {
    const blob = new Blob([JSON.stringify({ posts, categories: cats }, null, 2)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `文章備份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  if (loading) return <p className="loading">載入中…</p>;

  return (
    <div className="mgr">
      <div className="head">
        <div className="tabs">
          <button className={tab === 'posts' ? 'on' : ''} onClick={() => setTab('posts')}>
            文章（{posts.length}）
          </button>
          <button className={tab === 'cats' ? 'on' : ''} onClick={() => setTab('cats')}>
            分類（{cats.length}）
          </button>
        </div>
        <div className="acts">
          {msg && <span className="msg">{msg}</span>}
          <button className="ghost" onClick={exportAll}>匯出備份</button>
          {tab === 'posts' && (
            <button className="primary" onClick={() => setEditing('new')}>+ 新增文章</button>
          )}
        </div>
      </div>

      {tab === 'posts' && (
        <ul className="plist">
          {posts.map((p, i) => (
            <li key={p.id}>
              <div className="info">
                <span className="tag">{p.category}</span>
                <b>{p.title}</b>
                <span className="sub">{p.chars} 字 · 約 {p.minutes} 分鐘</span>
              </div>
              <div className="ops">
                <button onClick={() => send({ action: 'move', id: p.id, dir: 'up' })} disabled={i === 0}>↑</button>
                <button onClick={() => send({ action: 'move', id: p.id, dir: 'down' })} disabled={i === posts.length - 1}>↓</button>
                <a className="view" href={`/articles/${p.id}`} target="_blank" rel="noopener">預覽</a>
                <button onClick={() => setEditing(p)}>編輯</button>
                <button className="danger" onClick={() => {
                  if (confirm(`確定刪除「${p.title}」？此動作無法復原。`)) send({ action: 'delete', id: p.id });
                }}>刪除</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'cats' && <CatManager cats={cats} posts={posts} send={send} />}

      {editing && (
        <Editor
          post={editing === 'new' ? null : editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            const ok = await send({
              action: editing === 'new' ? 'create' : 'update',
              id: editing === 'new' ? undefined : editing.id,
              ...data,
            });
            if (ok) setEditing(null);
          }}
        />
      )}

      <style jsx>{`
        .mgr { margin-top: 8px; }
        .loading { color: var(--faint); padding: 40px; text-align: center; }
        .head {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px; margin-bottom: 18px;
        }
        .tabs { display: flex; gap: 6px; }
        .tabs button {
          font-size: 14px; padding: 8px 18px; border-radius: 20px; cursor: pointer;
          border: 1px solid var(--line); background: var(--paper); color: var(--ink);
        }
        .tabs button.on { background: var(--coffee); color: var(--bg); border-color: var(--coffee); }
        .acts { display: flex; align-items: center; gap: 8px; }
        .msg { font-size: 13px; color: var(--coffee); }
        .acts button {
          font-size: 14px; padding: 8px 16px; border-radius: 8px; cursor: pointer; border: none;
        }
        .ghost { background: transparent; border: 1px solid var(--line) !important; color: var(--ink); }
        .primary { background: var(--terracotta); color: #fff; font-weight: 700; }
        .plist { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .plist li {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 10px; padding: 12px 14px; flex-wrap: wrap;
        }
        .info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .tag {
          font-size: 11px; padding: 3px 10px; border-radius: 12px;
          background: var(--gold); color: #fff; white-space: nowrap;
        }
        .info b { font-size: 15px; }
        .sub { font-size: 12px; color: var(--faint); }
        .ops { display: flex; gap: 6px; align-items: center; }
        .ops button, .ops .view {
          font-size: 13px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
          border: 1px solid var(--line); background: #fff; color: var(--ink);
          text-decoration: none;
        }
        .ops button:disabled { opacity: .35; cursor: default; }
        .ops .danger { color: var(--red); border-color: #E8C9C4; }
      `}</style>
    </div>
  );
}

function CatManager({ cats, posts, send }) {
  const [newCat, setNewCat] = useState('');
  const count = (c) => posts.filter((p) => p.category === c).length;

  return (
    <div>
      <div className="add">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
               placeholder="新分類名稱" />
        <button onClick={async () => {
          if (!newCat.trim()) return;
          const ok = await send({ action: 'cat-add', name: newCat });
          if (ok) setNewCat('');
        }}>新增分類</button>
      </div>

      <ul className="clist">
        {cats.map((c, i) => (
          <li key={c}>
            <div>
              <b>{c}</b>
              <span className="n">{count(c)} 篇</span>
            </div>
            <div className="ops">
              <button onClick={() => send({ action: 'cat-move', name: c, dir: 'up' })} disabled={i === 0}>↑</button>
              <button onClick={() => send({ action: 'cat-move', name: c, dir: 'down' })} disabled={i === cats.length - 1}>↓</button>
              <button onClick={() => {
                const v = prompt('新的分類名稱', c);
                if (v && v.trim() && v !== c) send({ action: 'cat-rename', oldName: c, newName: v });
              }}>改名</button>
              <button className="danger" onClick={() => {
                if (count(c) > 0) { alert('此分類仍有文章，請先移動或刪除文章'); return; }
                if (confirm(`刪除分類「${c}」？`)) send({ action: 'cat-delete', name: c });
              }}>刪除</button>
            </div>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .add { display: flex; gap: 8px; margin-bottom: 16px; }
        .add input {
          flex: 1; padding: 10px 12px; font-size: 15px;
          border: 1px solid var(--line); border-radius: 8px; background: #fff;
        }
        .add button {
          padding: 10px 20px; background: var(--coffee); color: var(--bg);
          border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
        }
        .clist { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .clist li {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 10px; padding: 14px 16px;
        }
        .clist b { font-size: 16px; }
        .n { font-size: 12px; color: var(--faint); margin-left: 10px; }
        .ops { display: flex; gap: 6px; }
        .ops button {
          font-size: 13px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
          border: 1px solid var(--line); background: #fff; color: var(--ink);
        }
        .ops button:disabled { opacity: .35; cursor: default; }
        .ops .danger { color: var(--red); border-color: #E8C9C4; }
      `}</style>
    </div>
  );
}

function Editor({ post, cats, onClose, onSave }) {
  const [title, setTitle] = useState(post?.title || '');
  const [category, setCategory] = useState(post?.category || cats[0] || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [body, setBody] = useState((post?.body || []).join('\n'));

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel">
        <div className="ptop">
          <h3>{post ? '編輯文章' : '新增文章'}</h3>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <label>標題
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章標題" />
        </label>

        <label>分類
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>摘要（列表頁顯示，留空會自動取首段）
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="50 字內的導讀" />
        </label>

        <label>內文（一段一行，空行會自動忽略）
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16}
                    placeholder="直接貼上文章內容，每一段換行即可" />
        </label>

        <div className="pfoot">
          <span className="cnt">{body.replace(/\n/g, '').length} 字</span>
          <div>
            <button className="ghost" onClick={onClose}>取消</button>
            <button className="primary" onClick={() => onSave({ title, category, excerpt, body })}>
              儲存
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(68,58,49,.45);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; z-index: 50;
        }
        .panel {
          background: var(--bg); border-radius: 16px; padding: 24px;
          width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto;
        }
        .ptop { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        h3 { margin: 0; font-size: 20px; letter-spacing: 2px; }
        .x { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--faint); }
        label {
          display: block; margin-bottom: 16px;
          font-size: 13px; color: var(--faint); letter-spacing: 1px;
        }
        input, select, textarea {
          display: block; width: 100%; margin-top: 6px;
          padding: 11px 12px; font-size: 15px; box-sizing: border-box;
          border: 1px solid var(--line); border-radius: 8px;
          background: #fff; color: var(--ink); font-family: inherit;
        }
        textarea { line-height: 1.9; resize: vertical; }
        .pfoot { display: flex; align-items: center; justify-content: space-between; }
        .cnt { font-size: 13px; color: var(--faint); }
        .pfoot button {
          padding: 11px 24px; border-radius: 9px; font-size: 15px;
          cursor: pointer; margin-left: 8px; border: none;
        }
        .ghost { background: transparent; border: 1px solid var(--line) !important; color: var(--ink); }
        .primary { background: var(--terracotta); color: #fff; font-weight: 700; }
      `}</style>
    </div>
  );
}
