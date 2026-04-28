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
      <a class="post-card" href="${url}">
        ${img}
        <div class="post-card-body">
          <div class="post-card-meta">
            <span>${esc(post.date)}</span>
            ${tags}
          </div>
          <div class="post-card-title">${esc(post.title)}</div>
          ${post.excerpt ? `<div class="post-card-excerpt">${esc(post.excerpt)}</div>` : ''}
          <div class="post-card-footer">続きを読む →</div>
        </div>
      </a>
    `;
  }).join('');
}

loadPosts();
