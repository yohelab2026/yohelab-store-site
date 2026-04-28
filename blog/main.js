const postsRoot = import.meta.glob('/content/blog/posts/*.json', { eager: true });

const posts = Object.entries(postsRoot)
  .map(([path, mod]) => ({
    path,
    ...mod.default,
  }))
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

const postsEl = document.getElementById('posts');

function renderPosts() {
  if (!posts.length) {
    postsEl.innerHTML = '<div class="empty">まだ記事がありません。よへが最初の記事を追加するとここに出る。</div>';
    return;
  }
  postsEl.innerHTML = posts.map((post) => `
    <article class="post">
      <div class="meta">${post.date || ''}${post.tags?.length ? ' · ' + post.tags.join(' / ') : ''}</div>
      <h2>${post.title || ''}</h2>
      <p>${post.excerpt || ''}</p>
    </article>
  `).join('');
}

renderPosts();
