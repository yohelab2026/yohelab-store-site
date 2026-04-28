const postsEl = document.getElementById('posts');

async function loadPosts() {
  postsEl.innerHTML = '<div class="empty">読み込み中...</div>';
  try {
    const res = await fetch('/api/blog-posts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPosts(data.posts || []);
  } catch (err) {
    postsEl.innerHTML = '<div class="empty">記事を取得できませんでした。</div>';
  }
}

function renderPosts(posts) {
  if (!posts.length) {
    postsEl.innerHTML = '<div class="empty">まだ記事がありません。よへが最初の記事を追加するとここに出る。</div>';
    return;
  }
  postsEl.innerHTML = posts.map((post) => `
    <article class="post">
      ${post.eyecatch ? `<div class="post-eyecatch"><img src="${escHtml(post.eyecatch)}" alt="${escHtml(post.title)}" loading="lazy" /></div>` : ''}
      <div class="meta">${escHtml(post.date)}${post.tags?.length ? ' · ' + post.tags.map(escHtml).join(' / ') : ''}</div>
      <h2>${escHtml(post.title)}</h2>
      <p>${escHtml(post.excerpt)}</p>
    </article>
  `).join('');
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadPosts();
