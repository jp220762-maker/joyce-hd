import { getContent } from '../../../lib/store.js';
import { notFound } from 'next/navigation';
import ContactForm from '../../ContactForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const c = await getContent();
  const s = (c.services.items || []).find((x) => x.slug === params.slug);
  if (!s) return { title: '找不到這個服務' };
  return { title: `${s.name} — ${c.site.name}`, description: s.desc };
}

export default async function ServiceDetail({ params }) {
  const c = await getContent();
  const items = c.services.items || [];
  const s = items.find((x) => x.slug === params.slug);
  if (!s || s.show === false) notFound();

  const others = items.filter((x) => x.slug !== s.slug && x.show !== false).slice(0, 3);

  return (
    <main>
      <nav className="top">
        <a href="/services">← 所有服務</a>
      </nav>

      <header className="hd">
        <h1>{s.name}</h1>
        <div className="tags">
          <span className="dur">{s.duration}</span>
          <span className="price">{s.price}</span>
          <span className="mode">線上／實體皆可</span>
          {s.available === false && <span className="unavail">暫不開放預約</span>}
        </div>
        <p className="lead">{s.desc}</p>
      </header>

      {s.intro?.length > 0 && (
        <section className="intro">
          {s.intro.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )}

      {s.gains?.length > 0 && (
        <section className="block gains">
          <h2>你會帶走什麼</h2>
          <ul>
            {s.gains.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </section>
      )}

      {s.forWho?.length > 0 && (
        <section className="block">
          <h2>適合這樣的你</h2>
          <ul className="who">
            {s.forWho.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>
      )}

      {s.flow?.length > 0 && (
        <section className="block">
          <h2>進行方式</h2>
          <ol className="flow">
            {s.flow.map((f, i) => <li key={i}><span>{i + 1}</span>{f}</li>)}
          </ol>
        </section>
      )}

      {/* 預約：在服務介紹之後 */}
      <section id="booking" className="booking">
        {s.available === false ? (
          <>
            <h2 className="bh">目前暫不開放預約</h2>
            <p className="bsub">歡迎透過以下方式直接與我聯繫，我會盡快回覆你。</p>
            <div className="unavail-contact">
              {c.contact?.email && (
                <a className="cbtn mail" href={`mailto:${c.contact.email}?subject=${encodeURIComponent(`【服務詢問】${s.name}`)}`}>
                  ✉️ Email 聯繫：{c.contact.email}
                </a>
              )}
              {c.contact?.line && (
                <a className="cbtn line" href={`https://line.me/ti/p/~${encodeURIComponent(c.contact.line)}`} target="_blank" rel="noopener">
                  💬 加 LINE 好友：{c.contact.line}
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="bh">{c.booking.heading}</h2>
            <p className="bsub">{c.booking.lede}</p>
            {c.booking.embedUrl ? (
              <div className="embed">
                <iframe src={c.booking.embedUrl} title="預約時段" loading="lazy" />
              </div>
            ) : (
              <p className="note">{c.booking.note}</p>
            )}
            <div className="cform">
              <ContactForm services={items.map((x) => x.name)} />
            </div>
          </>
        )}
      </section>

      {others.length > 0 && (
        <section className="others">
          <h2>其他服務</h2>
          <div className="ogrid">
            {others.map((o) => (
              <a key={o.slug} href={`/services/${o.slug}`}>
                <b>{o.name}</b>
                <span>{o.duration}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <style>{`
        main { max-width: 760px; margin: 0 auto; padding: 32px 20px 80px; }
        .top { margin-bottom: 28px; }
        .top a { font-size: 14px; text-decoration: none; }
        .top a:hover { text-decoration: underline; }

        .hd { margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid var(--line); }
        h1 { font-size: 32px; font-weight: 700; margin: 0 0 16px; letter-spacing: 2px; line-height: 1.5; }
        .tags { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
        .tags span { font-size: 13px; padding: 5px 15px; border-radius: 16px; }
        .dur { background: var(--paper); border: 1px solid var(--line); color: var(--ink); }
        .price { background: var(--gold); color: #fff; }
        .mode { background: var(--paper); border: 1px solid var(--line); color: var(--faint); }
        .unavail { background: var(--faint); color: #fff; }
        .lead { font-size: 16px; line-height: 2; color: var(--faint); margin: 0; }

        .intro p { font-size: 17px; line-height: 2.15; margin: 0 0 24px; color: var(--ink); }

        .block { margin-top: 48px; }
        h2 { font-size: 14px; letter-spacing: 4px; color: var(--coffee); margin: 0 0 20px; font-weight: 700; }

        .gains ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .gains li {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 16px 20px 16px 46px;
          font-size: 15px; line-height: 1.9; position: relative;
        }
        .gains li::before {
          content: ''; position: absolute; left: 20px; top: 22px;
          width: 8px; height: 8px; border-radius: 50%; background: var(--gold);
        }
        .who { margin: 0; padding-left: 22px; }
        .who li { font-size: 15px; line-height: 2.1; margin-bottom: 6px; }

        .flow { list-style: none; margin: 0; padding: 0; counter-reset: step; }
        .flow li {
          display: flex; gap: 14px; align-items: flex-start;
          font-size: 15px; line-height: 1.9; margin-bottom: 14px;
        }
        .flow li span {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%;
          background: var(--coffee); color: var(--bg);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
        }

        .booking {
          margin-top: 56px; padding: 36px 28px;
          background: var(--paper); border: 1px solid var(--line); border-radius: 18px;
        }
        .bh { text-align: center; }
        .bsub { text-align: center; font-size: 15px; margin: 0 0 24px; }
        .embed { border-radius: 12px; overflow: hidden; border: 1px solid var(--line); margin-bottom: 28px; }
        .embed iframe { width: 100%; height: 620px; border: 0; display: block; }
        .note { text-align: center; font-size: 14px; color: var(--faint); line-height: 2; margin: 0 0 24px; }
        .cform { max-width: 520px; margin: 0 auto; }
        .unavail-contact { display: flex; flex-direction: column; gap: 12px; max-width: 440px; margin: 0 auto; }
        .cbtn {
          display: block; text-decoration: none; text-align: center;
          padding: 16px 20px; border-radius: 12px; font-size: 15px; font-weight: 700;
          border: 1px solid var(--line); background: #fff; color: var(--ink);
        }
        .cbtn:hover { border-color: var(--coffee); }
        .cbtn.mail { color: var(--coffee); }
        .cbtn.line { color: #06C755; }

        .others { margin-top: 56px; }
        .ogrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .ogrid a {
          display: block; text-decoration: none; color: inherit;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px; text-align: center;
        }
        .ogrid a:hover { border-color: var(--coffee); background: #fff; }
        .ogrid b { display: block; font-size: 15px; margin-bottom: 6px; }
        .ogrid span { font-size: 12px; color: var(--faint); }

        @media (max-width: 720px) {
          main { padding: 24px 16px 60px; }
          h1 { font-size: 25px; }
          .intro p { font-size: 16px; }
          .ogrid { grid-template-columns: 1fr; }
          .booking { padding: 26px 18px; }
          .embed iframe { height: 520px; }
        }
      `}</style>
    </main>
  );
}
