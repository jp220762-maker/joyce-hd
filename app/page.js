import { getContent, getAllPosts } from '../lib/store.js';
import BirthForm from './BirthForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const c = await getContent();
  return {
    title: `${c.site.name} — 人類圖排盤與解讀`,
    description: c.site.tagline,
  };
}

export default async function Home() {
  const [c, posts] = await Promise.all([getContent(), getAllPosts()]);
  const featured = posts.slice(0, 4);

  return (
    <main>
      {/* 品牌開場 */}
      <section className="hero">
        <div className="words">
          <p className="brand">{c.site.name}</p>
          <h1>{c.site.intro}</h1>
          <p className="tagline">{c.site.tagline}</p>
          <div className="cta">
            <a className="primary" href="#chart">免費生成人類圖</a>
            <a className="ghost" href="/about">關於我</a>
          </div>
        </div>
        <div className="portrait">
          <img src="/images/joyce.jpg" alt="Joyce" />
        </div>
      </section>

      {/* 服務簡介 */}
      <section className="services">
        <h2>我能陪你做的</h2>
        <div className="grid">
          {c.services.items.slice(0, 3).map((s) => (
            <div key={s.name} className="card">
              <h3>{s.name}</h3>
              <p className="meta">{s.duration}</p>
              <p className="desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="more"><a href="/services">看所有服務項目 →</a></p>
      </section>

      {/* 免費排盤 */}
      <section id="chart" className="chart-sec">
        <h2>先從認識自己開始</h2>
        <p className="sub">
          輸入出生日期、時間與地點，生成專屬人體圖。<br />
          出生時間越精確，人生角色與輪迴交叉的判定越準確。
        </p>
        <BirthForm />
      </section>

      {/* 文章精選 */}
      {featured.length > 0 && (
        <section className="posts">
          <h2>最近的文字</h2>
          <ul>
            {featured.map((p) => (
              <li key={p.id}>
                <a href={`/articles/${p.id}`}>
                  <span className="cat">{p.category}</span>
                  <b>{p.title}</b>
                  <span className="ex">{p.excerpt}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="more"><a href="/articles">閱讀更多文章 →</a></p>
        </section>
      )}

      <style>{`
        main { max-width: 1060px; margin: 0 auto; padding: 40px 20px 80px; }

        .hero {
          display: grid; grid-template-columns: 1.15fr .85fr;
          gap: 48px; align-items: center; margin-bottom: 88px;
        }
        .brand {
          font-size: 14px; letter-spacing: 8px; color: var(--coffee);
          margin: 0 0 20px; font-weight: 700;
        }
        h1 {
          font-size: 38px; font-weight: 700; line-height: 1.6;
          margin: 0 0 24px; letter-spacing: 2px;
        }
        .tagline {
          font-size: 16px; line-height: 2.2; color: var(--faint);
          margin: 0 0 32px;
        }
        .cta { display: flex; gap: 12px; flex-wrap: wrap; }
        .cta a {
          display: inline-block; padding: 14px 32px; border-radius: 10px;
          font-size: 16px; font-weight: 700; letter-spacing: 2px; text-decoration: none;
        }
        .cta .primary { background: var(--coffee); color: var(--bg); }
        .cta .primary:hover { background: var(--ink); }
        .cta .ghost { border: 1px solid var(--line); color: var(--ink); background: var(--paper); }
        .cta .ghost:hover { border-color: var(--coffee); }
        .portrait img {
          width: 100%; height: auto; display: block;
          border-radius: 16px; box-shadow: 0 8px 32px rgba(68,58,49,.12);
        }

        h2 {
          font-size: 15px; letter-spacing: 5px; color: var(--coffee);
          margin: 0 0 28px; font-weight: 700; text-align: center;
        }

        .services { margin-bottom: 88px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .card {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 26px 24px;
        }
        .card h3 { font-size: 18px; margin: 0 0 6px; font-weight: 700; }
        .card .meta { font-size: 12px; color: var(--gold); margin: 0 0 12px; letter-spacing: 1px; }
        .card .desc { font-size: 14px; line-height: 1.9; color: var(--faint); margin: 0; }
        .more { text-align: center; margin: 24px 0 0; }
        .more a { font-size: 14px; text-decoration: none; }
        .more a:hover { text-decoration: underline; }

        .chart-sec {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 20px; padding: 44px 32px; margin-bottom: 88px;
        }
        .sub {
          text-align: center; font-size: 15px; line-height: 2;
          color: var(--faint); margin: 0 0 32px;
        }

        .posts ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .posts a {
          display: block; text-decoration: none; color: inherit;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px 22px;
        }
        .posts a:hover { border-color: var(--coffee); background: #fff; }
        .posts .cat {
          display: inline-block; font-size: 11px; padding: 3px 10px;
          border-radius: 12px; background: var(--gold); color: #fff; margin-bottom: 10px;
        }
        .posts b { display: block; font-size: 17px; margin-bottom: 6px; line-height: 1.5; }
        .posts .ex { font-size: 13px; color: var(--faint); line-height: 1.8; }

        @media (max-width: 860px) {
          .hero { grid-template-columns: 1fr; gap: 32px; text-align: center; margin-bottom: 64px; }
          .portrait { order: -1; max-width: 300px; margin: 0 auto; }
          .cta { justify-content: center; }
          h1 { font-size: 28px; }
          .grid { grid-template-columns: 1fr; }
          .chart-sec { padding: 32px 18px; }
          main { padding: 28px 16px 60px; }
        }
      `}</style>
    </main>
  );
}
