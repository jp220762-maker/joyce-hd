import { getAllPosts, getCategories } from '../../lib/store.js';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: '文章 — 人類圖',
  description: '關於人類圖、關於走過的路，以及生活裡那些讓人停下來的時刻。',
};

export default async function ArticlesPage() {
  const [POSTS, CATEGORIES] = await Promise.all([getAllPosts(), getCategories()]);
  const grouped = {};
  POSTS.forEach((p) => { (grouped[p.category] ??= []).push(p); });
  const cats = CATEGORIES.filter((c) => grouped[c]?.length);
  // 分類清單以外的文章（例如分類被刪除）也顯示
  const orphan = POSTS.filter((p) => !CATEGORIES.includes(p.category));

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">ARTICLES</p>
        <h1>文章</h1>
        <p className="lede">
          關於人類圖，關於走過的路，<br />
          以及生活裡那些讓人停下來的時刻。
        </p>
      </header>

      <nav className="jump">
        {cats.map((c, k) => <a key={c} href={`#cat${k}`}>{c}</a>)}
      </nav>

      {cats.map((cat, k) => (
        <section key={cat} id={`cat${k}`} className="group">
          <h2>{cat}</h2>
          <ul className="list">
            {grouped[cat].map((p) => (
              <li key={p.id}>
                <a href={`/articles/${p.id}`}>
                  <h3>{p.title}</h3>
                  <p className="ex">{p.excerpt}</p>
                  <span className="meta">閱讀約 {p.minutes} 分鐘</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {orphan.length > 0 && (
        <section className="group">
          <h2>其他</h2>
          <ul className="list">
            {orphan.map((p) => (
              <li key={p.id}>
                <a href={`/articles/${p.id}`}>
                  <h3>{p.title}</h3>
                  <p className="ex">{p.excerpt}</p>
                  <span className="meta">閱讀約 {p.minutes} 分鐘</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="foot"><a href="/">← 回首頁</a></footer>

      <style>{`
        main { max-width: 860px; margin: 0 auto; padding: 56px 20px 80px; }
        .hero { text-align: center; margin-bottom: 32px; }
        .eyebrow { font-size: 12px; letter-spacing: 4px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 40px; font-weight: 700; margin: 0 0 16px; letter-spacing: 4px; }
        .lede { color: var(--faint); line-height: 2; margin: 0; font-size: 16px; }
        .jump {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
          margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid var(--line);
        }
        .jump a {
          font-size: 13px; padding: 7px 15px; border-radius: 20px;
          border: 1px solid var(--line); background: var(--paper);
          text-decoration: none; color: var(--ink);
        }
        .jump a:hover { border-color: var(--coffee); background: #fff; }
        .group { margin-bottom: 48px; scroll-margin-top: 24px; }
        h2 { font-size: 15px; letter-spacing: 4px; color: var(--coffee);
             margin: 0 0 20px; font-weight: 700; }
        .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
        .list a {
          display: block; text-decoration: none; color: inherit;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 22px 24px;
        }
        .list a:hover { border-color: var(--coffee); background: #fff; }
        h3 { font-size: 19px; margin: 0 0 8px; font-weight: 700; line-height: 1.5; }
        .ex { margin: 0 0 10px; font-size: 14px; color: var(--faint); line-height: 1.8; }
        .meta { font-size: 12px; color: var(--line); letter-spacing: 1px; }
        .foot { text-align: center; margin-top: 24px; }
        .foot a { font-size: 15px; text-decoration: none; }
        @media (max-width: 720px) {
          main { padding: 40px 16px 60px; }
          h1 { font-size: 30px; }
          .list a { padding: 18px; }
          h3 { font-size: 17px; }
        }
      `}</style>
    </main>
  );
}
