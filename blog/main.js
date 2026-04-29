const postsEl = document.getElementById('posts');

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadPosts() {
  postsEl.innerHTML = '<div class="empty">読み込み中...</div>';
  try {
    const res = await fetch('/api/blog-posts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data.posts || []);
  } catch(e) {
    postsEl.innerHTML = '<div class="empty">記事を取得できませんでした。</div>';
  }
}

function render(posts) {
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
            <a class="open-link" href="${url}">記事ページへ →</a>
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
          const res = await fetch(`/api/blog-post-get?slug=${encodeURIComponent(slug)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const post = data.post || {};
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
