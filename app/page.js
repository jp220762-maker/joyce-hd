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

  // 依後台設定的順序渲染各區塊；找不到內容或被設為隱藏的區塊自動略過
  const order = (c.homepage?.order && c.homepage.order.length) ? c.homepage.order
    : ['ambience', 'services', 'chart', 'testimonials', 'cases', 'posts'];

  const sections = {
    ambience: c.site.showAmbience && c.site.ambienceUrl && (
      <section key="ambience" className="ambience">
        <img src={c.site.ambienceUrl} alt="" />
        {c.site.ambienceQuote ? (
          <div className="quote"><p>{c.site.ambienceQuote}</p></div>
        ) : null}
      </section>
    ),

    services: c.services?.show !== false && (c.services?.items?.length > 0) && (
      <section key="services" className="services">
        <h2>我能陪你做的</h2>
        <div className="grid">
          {(c.services.items || []).slice(0, 3).map((s) => (
            <a key={s.name} className="card" href={`/services/${s.slug || ''}`}>
              <h3>{s.name}</h3>
              <p className="meta">{s.duration}</p>
              <p className="desc">{s.desc}</p>
            </a>
          ))}
        </div>
        <p className="more"><a href="/services">看所有服務項目 →</a></p>
      </section>
    ),

    chart: (
      <section key="chart" id="chart" className="chart-sec">
        <h2>先從認識自己開始</h2>
        <p className="sub">
          輸入出生日期、時間與地點，生成專屬人體圖。<br />
          出生時間越精確，人生角色與輪迴交叉的判定越準確。
        </p>
        <BirthForm />
      </section>
    ),

    testimonials: c.testimonials?.show !== false && (c.testimonials?.items?.length > 0) && (
      <section key="testimonials" className="voices">
        <h2>{c.testimonials.heading}</h2>
        {c.testimonials.lede && <p className="vsub">{c.testimonials.lede}</p>}
        <div className="vgrid">
          {(c.testimonials.items || []).map((t, i) => (
            <figure key={i}>
              <blockquote>{t.text}</blockquote>
              <figcaption>
                <b>{t.name}</b>
                {t.title && <span>{t.title}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    ),

    cases: c.cases?.show !== false && (c.cases?.items?.length > 0) && (
      <section key="cases" className="cases">
        <h2>{c.cases.heading}</h2>
        <div className="cgrid">
          {(c.cases.items || []).map((k, i) => (
            <article key={i} className={k.image && k.showImage !== false ? 'with-img' : ''}>
              {k.image && k.showImage !== false && (
                <div className="cimg"><img src={k.image} alt="" /></div>
              )}
              <div className="ctext">
                <h3>{k.title}</h3>
                <p className="who">{k.who}</p>
                <p className="story">{k.story}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="disclaimer">{c.cases.lede}</p>
      </section>
    ),

    posts: c.postsSection?.show !== false && featured.length > 0 && (
      <section key="posts" className="posts">
        <h2>{c.postsSection?.heading || '最近的文字'}</h2>
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
    ),
  };

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
            {c.about?.show !== false && <a className="ghost" href="/about">關於我</a>}
          </div>
        </div>
        <div className="portrait">
          <img
            src={c.site.portraitUrl || '/images/joyce.jpg'}
            alt="Joyce"
            style={{
              width: `${c.site.portraitSize || 240}px`,
              aspectRatio: c.site.portraitShape === 'original' ? 'auto' : '1 / 1',
              objectFit: c.site.portraitShape === 'original' ? 'contain' : 'cover',
              borderRadius: c.site.portraitShape === 'circle' ? '50%'
                : c.site.portraitShape === 'square' ? '16px' : '16px',
            }}
          />
        </div>
      </section>

      {order.map((key) => sections[key] || null)}

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
        .portrait { display: flex; justify-content: center; }
        .portrait img {
          max-width: 100%; height: auto; display: block;
          box-shadow: 0 8px 32px rgba(68,58,49,.14);
        }

        .ambience {
          position: relative; border-radius: 20px; overflow: hidden;
          margin-bottom: 88px; box-shadow: 0 10px 40px rgba(68,58,49,.10);
        }
        .ambience img { width: 100%; height: auto; display: block; }
        .quote {
          position: absolute; inset: auto 0 0 0;
          padding: 40px 32px 30px;
          background: linear-gradient(to top, rgba(246,241,231,.96), rgba(246,241,231,0));
        }
        .quote p {
          margin: 0; text-align: center; font-size: 16px; line-height: 2.1;
          color: var(--ink); letter-spacing: 1px; max-width: 720px;
          margin-left: auto; margin-right: auto;
        }

        .voices { margin-bottom: 88px; }
        .vsub { text-align: center; font-size: 14px; color: var(--faint); margin: -14px 0 28px; }
        .vgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .vgrid figure {
          margin: 0; background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 26px 24px;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        blockquote {
          margin: 0 0 18px; font-size: 15px; line-height: 2.05; color: var(--ink);
          position: relative; padding-top: 18px;
        }
        blockquote::before {
          content: '\\201C'; position: absolute; top: -6px; left: -2px;
          font-size: 42px; color: var(--gold); line-height: 1; font-family: Georgia, serif;
        }
        figcaption { display: flex; align-items: baseline; gap: 10px; }
        figcaption b { font-size: 14px; }
        figcaption span { font-size: 12px; color: var(--faint); }

        h2 {
          font-size: 15px; letter-spacing: 5px; color: var(--coffee);
          margin: 0 0 28px; font-weight: 700; text-align: center;
        }

        .services { margin-bottom: 88px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .card {
          display: block; text-decoration: none; color: inherit;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 26px 24px;
        }
        .card:hover { border-color: var(--coffee); background: #fff; }
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

        .cases { margin-bottom: 88px; }
        .cgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cgrid article {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 28px 26px;
        }
        .cgrid article.with-img {
          grid-column: 1 / -1; display: flex; gap: 28px; align-items: flex-start;
        }
        .cgrid .cimg { flex: 0 0 260px; }
        .cgrid .cimg img {
          width: 100%; height: auto; display: block; border-radius: 10px;
          border: 1px solid var(--line);
        }
        .cgrid .ctext { flex: 1; min-width: 0; }
        .cgrid h3 { font-size: 19px; margin: 0 0 6px; font-weight: 700; line-height: 1.5; }
        .cgrid .who { font-size: 12px; color: var(--gold); margin: 0 0 14px; letter-spacing: 1px; }
        .cgrid .story { font-size: 15px; line-height: 2.05; margin: 0; color: var(--ink); }
        .disclaimer {
          text-align: center; font-size: 12px; color: var(--faint);
          margin: 20px 0 0; line-height: 1.9;
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
          .vgrid { grid-template-columns: 1fr; }
          .cgrid { grid-template-columns: 1fr; }
          .cgrid article.with-img { flex-direction: column; }
          .cgrid .cimg { flex: none; width: 100%; }
          .ambience { margin-bottom: 56px; }
          .quote { padding: 28px 18px 20px; }
          .quote p { font-size: 14px; line-height: 1.95; }
          .chart-sec { padding: 32px 18px; }
          main { padding: 28px 16px 60px; }
        }
      `}</style>
    </main>
  );
}
