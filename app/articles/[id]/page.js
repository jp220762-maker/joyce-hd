import { getAllPosts, getPostById } from '../../../lib/store.js';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const post = await getPostById(params.id);
  if (!post) return { title: '文章不存在' };
  return { title: `${post.title} — 人類圖`, description: post.excerpt };
}

export default async function ArticlePage({ params }) {
  const [post, all] = await Promise.all([getPostById(params.id), getAllPosts()]);
  if (!post) notFound();

  const i = all.findIndex((p) => p.id === post.id);
  const prev = all[i - 1];
  const next = all[i + 1];
  const hasImage = !!(post.image && post.showImage !== false);

  return (
    <main className={hasImage ? 'wide' : ''}>
      <nav className="top">
        <a href="/articles">← 所有文章</a>
        <span className="cat">{post.category}</span>
      </nav>

      <div className={hasImage ? 'layout' : ''}>
        {hasImage && (
          <div className="artimg">
            <img src={post.image} alt="" />
          </div>
        )}
        <article>
          <h1>{post.title}</h1>
          <p className="meta">閱讀約 {post.minutes} 分鐘</p>
          <div className="body">
            {post.body.map((para, k) => <p key={k}>{para}</p>)}
          </div>
        </article>
      </div>

      <nav className="pager">
        {prev ? (
          <a className="p" href={`/articles/${prev.id}`}>
            <span>上一篇</span><b>{prev.title}</b>
          </a>
        ) : <span />}
        {next ? (
          <a className="n" href={`/articles/${next.id}`}>
            <span>下一篇</span><b>{next.title}</b>
          </a>
        ) : <span />}
      </nav>

      <style>{`
        main { max-width: 720px; margin: 0 auto; padding: 32px 20px 72px; }
        main.wide { max-width: 1060px; }
        .top { display: flex; align-items: center; justify-content: space-between;
               margin-bottom: 36px; gap: 12px; }
        .top a { font-size: 14px; text-decoration: none; }
        .top a:hover { text-decoration: underline; }
        .cat { font-size: 12px; letter-spacing: 2px; color: var(--bg);
               background: var(--coffee); padding: 5px 14px; border-radius: 20px; }
        .layout { display: grid; grid-template-columns: 340px 1fr; gap: 40px; align-items: start; }
        .artimg { position: sticky; top: 24px; }
        .artimg img {
          width: 100%; height: auto; display: block; border-radius: 14px;
          border: 1px solid var(--line); box-shadow: 0 8px 32px rgba(68,58,49,.10);
        }
        h1 { font-size: 32px; font-weight: 700; line-height: 1.5;
             margin: 0 0 12px; letter-spacing: 1px; }
        .meta { font-size: 13px; color: var(--faint); margin: 0 0 36px;
                padding-bottom: 24px; border-bottom: 1px solid var(--line); }
        .body p { font-size: 17px; line-height: 2.1; margin: 0 0 26px;
                  color: var(--ink); letter-spacing: .3px; }
        .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
                 margin-top: 56px; padding-top: 32px; border-top: 1px solid var(--line); }
        .pager a { display: block; text-decoration: none; color: inherit;
                   background: var(--paper); border: 1px solid var(--line);
                   border-radius: 12px; padding: 16px 18px; }
        .pager a:hover { border-color: var(--coffee); background: #fff; }
        .pager .n { text-align: right; }
        .pager span { display: block; font-size: 12px; color: var(--faint); margin-bottom: 6px; }
        .pager b { font-size: 15px; font-weight: 700; line-height: 1.5; }
        @media (max-width: 860px) {
          .layout { grid-template-columns: 1fr; gap: 24px; }
          .artimg { position: static; max-width: 320px; margin: 0 auto; }
        }
        @media (max-width: 720px) {
          main { padding: 24px 16px 56px; }
          h1 { font-size: 25px; }
          .body p { font-size: 16px; line-height: 2; }
          .pager { grid-template-columns: 1fr; }
          .pager .n { text-align: left; }
        }
      `}</style>
    </main>
  );
}
