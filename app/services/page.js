import { getContent } from '../../lib/store.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const c = await getContent();
  return { title: `服務項目 — ${c.site.name}`, description: c.services.lede };
}

export default async function ServicesPage() {
  const c = await getContent();

  return (
    <main>
      <header className="top">
        <p className="eyebrow">SERVICES</p>
        <h1>{c.services.heading}</h1>
        <p className="lede">{c.services.lede}</p>
      </header>

      <section className="items">
        {(c.services.items || []).map((s) => (
          <a key={s.name} className="item" href={`/services/${s.slug || ''}`}>
            <div className="head">
              <h2>{s.name}</h2>
              <div className="tags">
                <span className="dur">{s.duration}</span>
                <span className="price">{s.price}</span>
              </div>
            </div>
            <p className="desc">{s.desc}</p>
            <span className="go">看詳細介紹 →</span>
          </a>
        ))}
      </section>

      {(c.services.faq?.length || 0) > 0 && (
        <section className="faq">
          <h3>常見問題</h3>
          {(c.services.faq || []).map((f, i) => (
            <details key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )}

      <nav className="foot">
        <a href="/about">← 關於我</a>
        <a href="/">免費生成人類圖 →</a>
      </nav>

      <style>{`
        main { max-width: 820px; margin: 0 auto; padding: 56px 20px 80px; }
        .top { text-align: center; margin-bottom: 44px; }
        .eyebrow { font-size: 12px; letter-spacing: 5px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 38px; font-weight: 700; margin: 0 0 16px; letter-spacing: 6px; }
        .lede { font-size: 15px; color: var(--faint); margin: 0; line-height: 2; }

        .items { display: grid; gap: 14px; }
        .item {
          display: block; text-decoration: none; color: inherit;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 26px 26px;
        }
        .item:hover { border-color: var(--coffee); background: #fff; }
        .go { display: inline-block; margin-top: 14px; font-size: 14px; color: var(--coffee); }
        .head {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
        }
        h2 { font-size: 20px; margin: 0; font-weight: 700; letter-spacing: 1px; }
        .tags { display: flex; gap: 10px; align-items: center; }
        .dur { font-size: 13px; color: var(--faint); }
        .price {
          font-size: 13px; padding: 4px 14px; border-radius: 16px;
          background: var(--gold); color: #fff; white-space: nowrap;
        }
        .desc { margin: 0; font-size: 15px; line-height: 2; color: var(--ink); }

        .booking {
          margin-top: 56px; padding: 36px 28px; text-align: center;
          background: var(--paper); border: 1px solid var(--line); border-radius: 18px;
        }
        h3 { font-size: 15px; letter-spacing: 5px; color: var(--coffee); margin: 0 0 14px; }
        .sub { font-size: 15px; color: var(--ink); margin: 0 0 22px; }
        .embed { border-radius: 12px; overflow: hidden; border: 1px solid var(--line); }
        .embed iframe { width: 100%; height: 620px; border: 0; display: block; }
        .note { font-size: 14px; color: var(--faint); line-height: 2; margin: 0 0 22px; }
        .cform { max-width: 560px; margin: 0 auto; }

        .faq { margin-top: 56px; }
        details {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px 22px; margin-bottom: 10px;
        }
        summary { font-size: 16px; font-weight: 700; cursor: pointer; }
        details p { margin: 14px 0 0; font-size: 15px; line-height: 2; color: var(--faint); }

        .foot {
          display: flex; justify-content: space-between;
          margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--line);
        }
        .foot a { font-size: 15px; text-decoration: none; }

        @media (max-width: 720px) {
          main { padding: 40px 16px 60px; }
          h1 { font-size: 28px; letter-spacing: 4px; }
          .item { padding: 20px; }
          .embed iframe { height: 520px; }
        }
      `}</style>
    </main>
  );
}
