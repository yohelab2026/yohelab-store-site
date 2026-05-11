const postsEl = document.getElementById('posts');
const fallbackPosts = [
  {
    title: '文標のバージョンアップ履歴：最初のベータから今までに良くしたこと',
    slug: 'bunsirube-version-history',
    date: '2026-05-12',
    excerpt: '文標を最初のベータからどう育ててきたか。追加したもの、良くしたところ、不安を減らしたところをまとめました。',
    body: '文標は、いきなり完成品として置いたテーマではありません。最初のベータから、記事を書く前の迷い、公開前の不安、購入後の分かりにくさを一つずつ減らしてきました。\n\nv0.1系ではCTA、FAQ、SEO出力、更新確認の土台を作りました。v0.2系では比較表、導線解析、投稿前チェックを強くしました。v0.3系では.htaccess、子テーマ、サポート範囲、配色を整理しました。\n\n派手な機能より、書く人と買う人の不安を減らす方向で更新しています。',
    tags: ['文標', '更新履歴'],
    eyecatch: '/assets/blog/bunsirube-version-history/bunsirube-history-cover.png',
  },
  {
    title: '商品ページ改善レビューで実際に返す内容のサンプル',
    slug: 'page-review-sample',
    date: '2026-05-02',
    excerpt: '980円レビューで何が返ってくるのかを、購入前に見られる形でまとめました。',
    body: '商品ページ改善レビューでは、1ページだけを見て「読まれない理由」と「直す文」を短く返します。\n\n返す内容は、弱点3つ、最初に置く見出し案、説明文の書き換え案、FAQ案、SNSや検索で使える短い要約文です。\n\nBASE、note、自社サイト、LP、商品紹介記事に向いています。',
    tags: ['商品ページ改善', 'サンプル'],
  },
  {
    title: '3キーワード記事メーカーの使い方：無料版で1本作る流れ',
    slug: 'research-writer-free-flow',
    date: '2026-05-02',
    excerpt: '無料版で記事材料を1セット作るときの、入力から仕上げまでの流れです。',
    body: '3キーワード記事メーカーは、記事を自動で完成させる道具ではありません。リサーチ候補、見出し、FAQ、出典メモをまとめて受け取り、自分の言葉で仕上げるための道具です。\n\nテーマ、読者、切り口を入れて、情報源を選び、記事材料を確認してから仕上げます。\n\n数字、制度、料金、規約は公開前に公式情報で確認してください。',
    tags: ['記事メーカー', '使い方'],
  },
  {
    title: '文標を入れる前に確認すること：既存記事・バックアップ・環境',
    slug: 'bunsirube-before-install',
    date: '2026-05-02',
    excerpt: 'WordPressテーマを変える前に、最低限ここだけは見ておきたいという確認リストです。',
    body: 'テーマ変更で投稿本文そのものが消えることは通常ありません。ただし、見た目、ショートコード、ウィジェット、テーマ固有の装飾は変わることがあります。\n\n変更前にバックアップを取り、対応環境を確認し、役割が重なるプラグインを見直してください。\n\n文標は比較記事、レビュー記事、FAQ記事の見え方をデモページで確認できます。',
    tags: ['文標', 'WordPress'],
  },
  {
    title: 'AI検索向けにFAQと出典を置く理由',
    slug: 'faq-source-ai-search',
    date: '2026-05-02',
    excerpt: 'Google AI Overviews等での表示保証はありません。だからこそ、読者にも検索にも読み取りやすい構造を作ります。',
    body: 'AI検索向けに大事なのは、特別な裏技ではありません。結論、理由、根拠、FAQ、出典を分かりやすく置くことです。\n\nFAQは購入前や問い合わせ前の不安を減らす場所です。出典は数字や制度の確認場所になります。\n\n「表示を約束する」のではなく、「AIにも読み取られやすい構造にする」と考えるほうが安全です。',
    tags: ['AI検索', 'FAQ'],
  },
  {
    title: 'BASE・note・自サイトの商品ページでよくある失敗',
    slug: 'sales-page-common-mistakes',
    date: '2026-05-02',
    excerpt: '商品は悪くないのに、ページの順番で損していることがあります。',
    body: '商品ページで大事なのは、かっこいい文章より「買う前の迷いが減る順番」です。\n\nよくある失敗は、誰向けかが遅い、届くものが見えない、不安への答えがない、CTAが弱い、の4つです。\n\n1ページだけでも、見出し、説明文、FAQ、購入ボタン周りを直すと印象は変わります。',
    tags: ['販売ページ', '改善'],
  },
];

let currentPage = 1;
let totalPages = 1;

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadPosts(page = 1) {
  try {
    const res = await fetch(`/api/blog-posts?page=${page}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.posts && data.posts.length) {
      currentPage = data.page || 1;
      totalPages = data.totalPages || 1;
      render(data.posts, true);
      renderPagination();
    } else {
      if (!postsEl.children.length) render(fallbackPosts, false);
    }
  } catch(e) {
    if (!postsEl.children.length) render(fallbackPosts, false);
  }
}

function renderPagination() {
  let pager = document.getElementById('pager');
  if (!pager) {
    pager = document.createElement('div');
    pager.id = 'pager';
    pager.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:12px;margin:40px 0 20px;';
    postsEl.after(pager);
  }
  if (totalPages <= 1) { pager.innerHTML = ''; return; }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  pager.innerHTML = `
    <button id="btn-prev" ${prevDisabled ? 'disabled' : ''} style="padding:8px 20px;border-radius:999px;border:1.5px solid var(--border);background:${prevDisabled?'#f5f5f5':'#fff'};color:${prevDisabled?'#aaa':'var(--text)'};font-weight:700;cursor:${prevDisabled?'default':'pointer'};font-size:14px;">← 前へ</button>
    <span style="font-size:14px;color:var(--muted);font-weight:700;">${currentPage} / ${totalPages}</span>
    <button id="btn-next" ${nextDisabled ? 'disabled' : ''} style="padding:8px 20px;border-radius:999px;border:1.5px solid var(--border);background:${nextDisabled?'#f5f5f5':'var(--green)'};color:${nextDisabled?'#aaa':'#fff'};font-weight:700;cursor:${nextDisabled?'default':'pointer'};font-size:14px;">次へ →</button>
  `;
  if (!prevDisabled) {
    document.getElementById('btn-prev').addEventListener('click', () => {
      loadPosts(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (!nextDisabled) {
    document.getElementById('btn-next').addEventListener('click', () => {
      loadPosts(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function render(posts, hasLink = true) {
  if (!posts.length) {
    postsEl.innerHTML = '<div class="empty">まだ記事がありません。</div>';
    return;
  }
  postsEl.innerHTML = posts.map(post => {
    const url = `/blog/${encodeURIComponent(post.slug)}/`;
    const tags = (post.tags||[]).slice(0,2).map(t=>`<span class="post-card-tag">${esc(t)}</span>`).join('');
    const img = post.eyecatch
      ? `<img class="post-card-img" src="${esc(post.eyecatch)}" alt="${esc(post.title)}" loading="lazy" />`
      : `<div class="post-card-img-placeholder">📝</div>`;
    return `
      <article class="post-card" data-slug="${esc(post.slug)}">
        ${img}
        <div class="post-card-body">
          <div class="post-card-meta">
            <span>${esc(post.date)}</span>
            ${tags}
          </div>
          <div class="post-card-title">${esc(post.title)}</div>
          ${post.excerpt ? `<div class="post-card-excerpt">${esc(post.excerpt)}</div>` : '<div class="post-card-excerpt">記事本文の先頭を読み込みます。</div>'}
          <div class="post-card-preview"></div>
          <div class="post-card-footer">
            <button class="read-more" type="button" data-action="toggle">続きを読む</button>
            ${hasLink ? `<a class="open-link" href="${url}">${esc(post.title)}を読む →</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  postsEl.querySelectorAll('[data-action="toggle"]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const card = button.closest('.post-card');
      if (!card) return;
      const excerpt = card.querySelector('.post-card-excerpt');
      const preview = card.querySelector('.post-card-preview');
      const slug = card.getAttribute('data-slug');
      const open = preview.classList.contains('is-open');

      if (open) {
        preview.classList.remove('is-open');
        excerpt?.classList.remove('is-open');
        preview.innerHTML = '';
        button.textContent = '続きを読む';
        return;
      }

      button.disabled = true;
      button.textContent = '読み込み中...';

      try {
        if (!preview.dataset.loaded) {
          let post = fallbackPosts.find((item) => item.slug === slug) || {};
          try {
            const res = await fetch(`/api/blog-post-get?slug=${encodeURIComponent(slug)}`);
            if (res.ok) {
              const data = await res.json();
              post = data.post || post;
            }
          } catch (_) {}
          const body = post.bodyHtml || '';
          const text = body
            ? body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
            : (post.body || '').replace(/\s+/g, ' ').trim();
          preview.innerHTML = `<div style="font-weight:800;margin-bottom:8px;">本文プレビュー</div><div>${esc(text || '本文がありません。')}</div>`;
          preview.dataset.loaded = '1';
        }
        preview.classList.add('is-open');
        excerpt?.classList.add('is-open');
        button.textContent = '閉じる';
      } catch (error) {
        const url = `/blog/${encodeURIComponent(slug)}/`;
        preview.innerHTML = `<div style="color:var(--muted);">本文の読み込みに失敗した。<a href="${url}">記事ページで開く</a></div>`;
        preview.classList.add('is-open');
        button.textContent = '閉じる';
      } finally {
        button.disabled = false;
      }
    });
  });
}

loadPosts();
