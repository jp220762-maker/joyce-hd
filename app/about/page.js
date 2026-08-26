import { getContent } from '../../lib/store.js';
import SocialIcon from '../SocialIcon';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const c = await getContent();
  return { title: `關於我 — ${c.site.name}`, description: c.about.body[0] };
}

export default async function AboutPage() {
  const c = await getContent();

  return (
    <main>
      <header className="top">
        <p className="eyebrow">ABOUT</p>
        <h1>{c.about.heading}</h1>
      </header>

      <section className="intro">
        <div className="photo">
          <img src="/images/joyce.jpg" alt="Joyce" />
        </div>
        <div className="text">
          {c.about.body.map((p, i) => (
            <p key={i} className={i === c.about.body.length - 1 ? 'last' : ''}>{p}</p>
          ))}
        </div>
      </section>

      {c.about.credentials?.length > 0 && (
        <section className="block">
          <h2>學習與認證</h2>
          <ul className="creds">
            {c.about.credentials.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </section>
      )}

      <section className="block">
        <h2>我的人類圖</h2>
        <figure className="chart">
          <img src="/images/joyce-chart.jpg" alt="Joyce 的人類圖" />
          <figcaption>{c.about.chartCaption}</figcaption>
        </figure>
      </section>

      <section className="block">
        <h2>聯絡與追蹤</h2>
        <p className="ctext">
          想聊聊或預約解讀，歡迎透過 <a href="/services#contact">聯絡表單</a> 留言給我，
          我會盡快回覆。也可以在這些地方找到我：
        </p>
        <div className="social">
          {c.contact.social.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
              <SocialIcon type={s.icon} size={18} />
              {s.name}
            </a>
          ))}
        </div>
      </section>

      <nav className="foot">
        <a href="/">← 回首頁</a>
        <a href="/services">看服務項目 →</a>
      </nav>

      <style>{`
        main { max-width: 860px; margin: 0 auto; padding: 56px 20px 80px; }
        .top { text-align: center; margin-bottom: 48px; }
        .eyebrow { font-size: 12px; letter-spacing: 5px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 38px; font-weight: 700; margin: 0; letter-spacing: 6px; }

        .intro { display: grid; grid-template-columns: .8fr 1.2fr; gap: 40px; align-items: start; }
        .photo img {
          width: 100%; height: auto; display: block;
          border-radius: 16px; box-shadow: 0 8px 28px rgba(68,58,49,.12);
        }
        .text p {
          font-size: 16px; line-height: 2.2; margin: 0 0 22px; color: var(--ink);
        }
        .text p.last {
          font-weight: 700; color: var(--coffee); border-left: 3px solid var(--gold);
          padding-left: 18px; line-height: 2.1;
        }

        .block { margin-top: 64px; }
        h2 {
          font-size: 14px; letter-spacing: 5px; color: var(--coffee);
          margin: 0 0 20px; font-weight: 700;
        }
        .creds { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
        .creds li {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 22px; padding: 9px 20px; font-size: 14px;
        }

        .chart { margin: 0; }
        .chart img {
          width: 100%; max-width: 620px; height: auto; display: block;
          margin: 0 auto; border-radius: 12px; border: 1px solid var(--line);
        }
        figcaption {
          text-align: center; font-size: 13px; color: var(--faint);
          margin-top: 14px; letter-spacing: 1px;
        }

        .ctext { font-size: 15px; line-height: 2; color: var(--ink); margin: 0; }
        .ctext a { color: var(--coffee); font-weight: 700; }
        .social { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
        .social a {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; padding: 10px 20px; border-radius: 22px;
          background: var(--paper); border: 1px solid var(--line);
          text-decoration: none; color: var(--ink);
        }
        .social a:hover { border-color: var(--coffee); background: #fff; }

        .foot {
          display: flex; justify-content: space-between;
          margin-top: 64px; padding-top: 28px; border-top: 1px solid var(--line);
        }
        .foot a { font-size: 15px; text-decoration: none; }

        @media (max-width: 760px) {
          main { padding: 40px 16px 60px; }
          h1 { font-size: 28px; letter-spacing: 4px; }
          .intro { grid-template-columns: 1fr; gap: 28px; }
          .photo { max-width: 280px; margin: 0 auto; }
        }
      `}</style>
    </main>
  );
}
