const postsEl = document.getElementById('posts');
const fallbackPosts = [
  {
    title: 'よへラボのブログで残していくもの',
    slug: 'yohelab-blog-start',
    date: '2026-04-29',
    excerpt: 'ツールの使い方、作った理由、改善の記録を、短く読める形で残していく。',
    body: 'よへラボのブログは、ただのお知らせ置き場ではなく、作ったものの背景を残す場所にする。\n\n記事メーカーなら、なぜ3キーワードから始めるのか。WordPressテーマなら、なぜFAQや構造化データを最初から入れるのか。そういう判断の理由を短く読める形で置いていく。\n\n問い合わせの前に見られる説明、購入前に知っておきたいこと、実験で分かったこともここに寄せる。',
    tags: ['ブログ', '運用メモ', 'よへラボ'],
  },
  {
    title: 'AI検索記事スターターキットを作った理由',
    slug: 'starter-kit',
    date: '2026-04-28',
    excerpt: '最初の1本を迷わず出すために、記事の型を先に置くようにした。',
    body: '記事を書く前に迷う時間を減らすために、レビュー、比較、ランキング、FAQ、商品紹介を先に分けるようにした。\n\n見出しの順番が決まると、書く側の負担がかなり減る。検索にも人にも伝わる形を先に置くのが大事だと思っている。',
    tags: ['記事テンプレート', 'WordPress'],
  },
  {
    title: 'WordPressテーマで減らしたいもの',
    slug: 'theme-note',
    date: '2026-04-28',
    excerpt: 'プラグインを増やしすぎず、最初から入れておくものを絞る。',
    body: 'テーマは見た目だけじゃなくて、記事を書く時の迷いも減らしたい。\n\nFAQ、構造化データ、llms.txt、簡単な解析だけ先に置いて、あとから足すものを減らす。そうすると初期設定がかなり軽くなる。',
    tags: ['WordPress', 'テーマ'],
  },
];

let currentPage = 1;
let totalPages = 1;

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadPosts(page = 1) {
  postsEl.innerHTML = '<div class="empty">読み込み中...</div>';
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
      render(fallbackPosts, false);
    }
  } catch(e) {
    render(fallbackPosts, false);
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
    const url = `/blog/post/?slug=${encodeURIComponent(post.slug)}`;
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
            ${hasLink ? `<a class="open-link" href="${url}">記事ページへ →</a>` : ''}
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
        const url = `/blog/post/?slug=${encodeURIComponent(slug)}`;
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
