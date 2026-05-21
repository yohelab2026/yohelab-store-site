const postsEl = document.getElementById('posts');
const blogSearchEl = document.getElementById('blog-search');
const filterStatusEl = document.getElementById('filter-status');
const categoryTabEls = Array.from(document.querySelectorAll('.category-tab'));
let categoryChildEls = Array.from(document.querySelectorAll('.category-child'));
const categoryPanelEls = Array.from(document.querySelectorAll('.child-category-panel'));
let activeFilter = 'all';
let activeParent = 'ai-news';
let aiToolTags = ['ai-news','chatgpt','claude','gemini','perplexity','genspark','grok','copilot','midjourney'];
const aiRumorTags = ['rumor-chatgpt','rumor-claude','rumor-gemini','rumor-perplexity','rumor-genspark','rumor-grok','rumor-copilot','rumor-midjourney','rumor-other'];
let categoryGroups = {
  'group:ai-news': aiToolTags,
  'group:ai-rumor': aiRumorTags,
  'group:earn': ['earn','article'],
  'group:wordpress': ['wordpress','template'],
  'group:home-work': ['home-work'],
};
let categoryParentByKey = {
  'ai-news': 'ai-news',
  chatgpt: 'ai-news',
  claude: 'ai-news',
  gemini: 'ai-news',
  perplexity: 'ai-news',
  genspark: 'ai-news',
  grok: 'ai-news',
  copilot: 'ai-news',
  midjourney: 'ai-news',
  faq: 'ai-news',
  'ai-rumor': 'ai-rumor',
  'rumor-chatgpt': 'ai-rumor',
  'rumor-claude': 'ai-rumor',
  'rumor-gemini': 'ai-rumor',
  'rumor-perplexity': 'ai-rumor',
  'rumor-genspark': 'ai-rumor',
  'rumor-grok': 'ai-rumor',
  'rumor-copilot': 'ai-rumor',
  'rumor-midjourney': 'ai-rumor',
  'rumor-other': 'ai-rumor',
  earn: 'earn',
  article: 'earn',
  wordpress: 'wordpress',
  template: 'wordpress',
  'home-work': 'home-work',
};
let categoryOrder = ['ai-news','chatgpt','claude','gemini','perplexity','genspark','grok','copilot','midjourney','faq','rumor-chatgpt','rumor-claude','rumor-gemini','rumor-perplexity','rumor-genspark','rumor-grok','rumor-copilot','rumor-midjourney','rumor-other','earn','template','article','wordpress','home-work'];
let categoryLabels = {
  all: 'すべて',
  'group:ai-news': 'AIニュース全部',
  'group:ai-rumor': 'AIの噂全部',
  'group:earn': '副業ネタ全部',
  'group:wordpress': 'ツール全部',
  'group:home-work': '在宅ヒント全部',
  'ai-news': 'AIニュース',
  'ai-rumor': 'AIの噂',
  'rumor-chatgpt': 'ChatGPT',
  'rumor-claude': 'Claude',
  'rumor-gemini': 'Gemini',
  'rumor-perplexity': 'Perplexity',
  'rumor-genspark': 'Genspark',
  'rumor-grok': 'Grok',
  'rumor-copilot': 'Copilot',
  'rumor-midjourney': 'Midjourney',
  'rumor-other': 'その他',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  genspark: 'Genspark',
  grok: 'Grok',
  copilot: 'Copilot',
  midjourney: 'Midjourney',
  faq: 'FAQ',
  earn: '収益化ネタ',
  wordpress: 'WordPress・文標',
  article: '記事づくり',
  'home-work': '在宅ワーク習慣',
  template: '記事テンプレ',
};
let categoryColors = {};
const queryOnlyCategoryFilters = new Set(['group:ai-rumor', 'ai-rumor', 'ai-leak', 'ai-prediction', ...aiRumorTags]);
const postCategoryOverrides = {
  'ai-news-selling-ideas': ['ai-news', 'chatgpt', 'claude', 'gemini'],
  'faq-source-ai-search': ['ai-news', 'faq'],
  'home-work-rhythm': ['home-work'],
  'sales-page-common-mistakes': ['earn', 'article'],
  'comparison-article-template': ['template', 'article'],
  'free-theme-vs-bunsirube': ['wordpress'],
  'bunsirube-version-history': ['wordpress'],
  'bunsirube-before-install': ['wordpress'],
};
const staticBlogSlugs = new Set([
  'ai-news-selling-ideas',
  'home-work-rhythm',
  'bunsirube-version-history',
  'free-theme-vs-bunsirube',
  'comparison-article-template',
  'bunsirube-before-install',
  'faq-source-ai-search',
  'sales-page-common-mistakes',
]);
let staticManifestPosts = [];
const fallbackPosts = [
  {
    title: '家で作業すると運動不足になるので、先に動く仕組みを作る',
    slug: 'home-work-rhythm',
    date: '2026-05-18',
    excerpt: 'AIニュースを調べる、WordPressを触る、ブログを書く。家で続ける人向けに、座りっぱなしを避ける小さい仕組みをまとめました。',
    body: '家で作業できることは増えています。ただ、移動がない日は体を動かすきっかけも減ります。25分作業したら立つ、飲み物を少し遠くに置く、昼に短く外へ出る。まずはそのくらい小さく作業の流れに混ぜるのが現実的です。',
    tags: ['在宅作業', '続け方', 'home-work', 'article'],
  },
  {
    title: 'AIニュースを記事ネタに変える方法。よへラボでこれからやること',
    slug: 'ai-news-selling-ideas',
    date: '2026-05-17',
    excerpt: 'ChatGPT、Claude、GeminiなどのAIニュースを、ブログ記事、note、X投稿、テンプレ、商品案に分けて使う考え方です。',
    body: 'AIニュースは、読んで終わりにすると流れていきます。よへラボでは、ChatGPT、Claude、Geminiなどのニュースを、記事ネタ、投稿ネタ、テンプレ、小さな商品案に変える前提で整理します。',
    tags: ['AIニュース', 'ChatGPT', 'Claude', 'Gemini', 'ai-news', 'chatgpt', 'claude', 'gemini', 'earn', 'article', 'template'],
  },
  {
    title: '文標のバージョンアップ履歴：初期版から今までに良くしたこと',
    slug: 'bunsirube-version-history',
    date: '2026-05-12',
    excerpt: '文標を初期版からどう育ててきたか。追加したもの、良くしたところ、不安を減らしたところをまとめました。',
    body: '文標は、いきなり完成品として置いたテーマではありません。初期版から、記事を書く前の迷い、公開前の不安、購入後の分かりにくさを一つずつ減らしてきました。\n\nv0.1系ではCTA、FAQ、SEO出力、更新確認の土台を作りました。v0.2系では比較表、導線解析、投稿前チェックを強くしました。v0.3系では.htaccess、子テーマ、対応範囲、配色を整理しました。\n\n派手な機能より、書く人と買う人の不安を減らす方向で更新しています。',
    tags: ['文標', '更新履歴', 'wordpress', 'article', 'template'],
    eyecatch: '/assets/blog/bunsirube-version-history/eyecatch.webp',
  },
  {
    title: '文標を入れる前に確認すること：既存記事・バックアップ・環境',
    slug: 'bunsirube-before-install',
    date: '2026-05-02',
    excerpt: 'WordPressテーマを変える前に、最低限ここだけは見ておきたいという確認リストです。',
    body: 'テーマ変更で投稿本文そのものが消えることは通常ありません。ただし、見た目、ショートコード、ウィジェット、テーマ固有の装飾は変わることがあります。\n\n変更前にバックアップを取り、対応環境を確認し、役割が重なるプラグインを見直してください。\n\n文標は比較記事、レビュー記事、FAQ記事の見え方をデモページで確認できます。',
    tags: ['文標', 'WordPress', 'wordpress', 'article'],
    eyecatch: '/assets/blog/bunsirube-before-install/eyecatch.webp',
  },
  {
    title: 'AI検索向けにFAQと出典を置く理由',
    slug: 'faq-source-ai-search',
    date: '2026-05-02',
    excerpt: 'Google AI Overviews等での表示保証はありません。だからこそ、読者にも検索にも読み取りやすい構造を作ります。',
    body: 'AI検索向けに大事なのは、特別な裏技ではありません。結論、理由、根拠、FAQ、出典を分かりやすく置くことです。\n\nFAQは購入前や問い合わせ前の不安を減らす場所です。出典は数字や制度の確認場所になります。\n\n「表示を約束する」のではなく、「AIにも読み取られやすい構造にする」と考えるほうが安全です。',
    tags: ['AI検索', 'FAQ', 'ai-news', 'article', 'wordpress'],
    eyecatch: '/assets/blog/faq-source-ai-search/eyecatch.webp',
  },
  {
    title: 'BASE・note・自サイトの商品ページでよくある失敗',
    slug: 'sales-page-common-mistakes',
    date: '2026-05-02',
    excerpt: '商品は悪くないのに、ページの順番で損していることがあります。',
    body: '商品ページで大事なのは、かっこいい文章より「買う前の迷いが減る順番」です。\n\nよくある失敗は、誰向けかが遅い、届くものが見えない、不安への答えがない、CTAが弱い、の4つです。\n\n1ページだけでも、見出し、説明文、FAQ、購入ボタン周りを直すと印象は変わります。',
    tags: ['販売ページ', '改善', 'earn', 'article', 'template'],
    eyecatch: '/assets/blog/sales-page-common-mistakes/eyecatch.webp',
  },
];

let currentPage = 1;
let totalPages = 1;

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDisplayDate(value) {
  return String(value || '').replace(/\b(20\d{2})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => `${y}年${Number(m)}月${Number(d)}日`);
}

async function loadCategorySettings() {
  try {
    const res = await fetch('/api/blog-categories', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.categories)) return;
    applyCategorySettings(data.categories);
  } catch (_) {}
}

function applyCategorySettings(categories) {
  const groups = {};
  const order = [];
  const labels = { ...categoryLabels };
  const colors = { ...categoryColors };
  const parents = {};

  categories.forEach(parent => {
    const parentKey = sanitizeCategoryKey(parent.key);
    if (!parentKey) return;
    const children = Array.isArray(parent.children) ? parent.children : [];
    labels[`group:${parentKey}`] = `${parent.label || parentKey}全部`;
    labels[parentKey] = parent.label || labels[parentKey] || parentKey;
    colors[parentKey] = parent.color || colors[parentKey] || '#0b8f72';
    parents[parentKey] = parentKey;
    groups[`group:${parentKey}`] = children.map(child => sanitizeCategoryKey(child.key)).filter(Boolean);
    children.forEach(child => {
      const key = sanitizeCategoryKey(child.key);
      if (!key) return;
      order.push(key);
      labels[key] = child.label || labels[key] || key;
      colors[key] = child.color || colors[key] || parent.color || '#0b8f72';
      parents[key] = parentKey;
    });
  });

  categoryGroups = { ...categoryGroups, ...groups };
  categoryOrder = order.length
    ? [...order, ...categoryOrder.filter(key => !order.includes(key))]
    : categoryOrder;
  categoryParentByKey = { ...categoryParentByKey, ...parents };
  aiToolTags = categoryGroups['group:ai-news'] || aiToolTags;
  categoryLabels = labels;
  categoryColors = colors;
  applyCategoryLabelsToNav();
}

function sanitizeCategoryKey(value) {
  return String(value || '').trim().toLowerCase();
}

function applyCategoryLabelsToNav() {
  categoryTabEls.forEach(btn => {
    const label = btn.querySelector('.category-tab-label');
    const key = normalizeFilter(btn.dataset.filter);
    if (label && categoryLabels[key]) label.textContent = categoryLabels[key].replace(/全部$/, '');
  });
  categoryPanelEls.forEach(panel => {
    const title = panel.querySelector('.child-category-title');
    const parent = panel.dataset.parentPanel;
    const parentName = categoryLabels[`group:${parent}`]?.replace(/全部$/, '') || categoryLabels[parent] || parent;
    if (title) title.textContent = `${parentName}の子カテゴリ`;
  });
  categoryChildEls.forEach(btn => {
    const key = normalizeFilter(btn.dataset.filter);
    if (key.startsWith('group:')) {
      btn.dataset.filter = 'all';
      if (btn.tagName === 'A') btn.setAttribute('href', '/blog/');
      btn.textContent = 'すべて';
      return;
    }
    if (categoryLabels[key]) btn.textContent = categoryLabels[key];
  });
  applyFilters();
}

function postUrl(slug) {
  return staticBlogSlugs.has(slug)
    ? `/blog/${encodeURIComponent(slug)}/`
    : `/blog/post/?slug=${encodeURIComponent(slug)}`;
}

function categoryUrl(filter) {
  const value = normalizeFilter(filter);
  if (queryOnlyCategoryFilters.has(value)) return `/blog/?category=${encodeURIComponent(value)}`;
  if (value.startsWith('group:')) return `/blog/category/${encodeURIComponent(value.replace('group:', ''))}/`;
  return `/blog/category/${encodeURIComponent(value)}/`;
}

function tagUrl(tag) {
  const value = normalizeFilter(tag);
  if (queryOnlyCategoryFilters.has(value)) return `/blog/?category=${encodeURIComponent(value)}`;
  return `/blog/tag/${encodeURIComponent(value)}/`;
}

async function loadPosts(page = 1) {
  const staticPublished = await loadStaticPublishedPosts();
  let dynamicPosts = [];
  try {
    const res = await fetch(`/api/blog-posts?page=${page}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    dynamicPosts = (data.posts || []).filter(isVisiblePublicPost);
    currentPage = data.page || 1;
    totalPages = data.totalPages || 1;
  } catch(e) {
    currentPage = 1;
    totalPages = 1;
  }
  const merged = mergePosts([...dynamicPosts, ...staticPublished]);
  render(merged.length ? merged : fallbackPosts, true);
  renderPagination();
}

function isVisiblePublicPost(post) {
  const title = String(post?.title || '');
  if (!title.trim()) return false;
  if (title.includes('【下書き】') || title.includes('下書き')) return false;
  if (title.includes('公開テスト') || title.toLowerCase().includes('test')) return false;
  return true;
}

async function loadStaticPublishedPosts() {
  if (staticManifestPosts.length) return staticManifestPosts;
  try {
    const res = await fetch('/blog/admin/static-posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    staticManifestPosts = (data.posts || [])
      .filter(post => post.status !== 'draft')
      .map(post => {
        staticBlogSlugs.add(post.slug);
        return post;
      });
  } catch {
    staticManifestPosts = fallbackPosts;
  }
  return staticManifestPosts;
}

function mergePosts(posts) {
  const seen = new Set();
  return posts
    .filter(post => post && post.slug && post.title)
    .filter(post => {
      const key = post.url || post.slug;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(compareByCategory);
}

function compareByCategory(a, b) {
  return categoryRank(a) - categoryRank(b)
    || String(b.date || '').localeCompare(String(a.date || ''))
    || String(a.title || '').localeCompare(String(b.title || ''), 'ja');
}

function categoryRank(post) {
  const keys = categoryKeysForPost(post);
  const found = categoryOrder.findIndex(tag => keys.includes(tag));
  return found === -1 ? 999 : found;
}

function normalizePostTags(post) {
  const raw = [...(post.tags || []), post.title || '', post.excerpt || ''].join(' ').toLowerCase();
  const tags = new Set(String(raw).split(/\s+|,|、/).filter(Boolean));
  if (raw.includes('chatgpt') || raw.includes('openai')) tags.add('chatgpt');
  if (raw.includes('claude') || raw.includes('anthropic')) tags.add('claude');
  if (raw.includes('gemini') || raw.includes('google')) tags.add('gemini');
  if (raw.includes('perplexity')) tags.add('perplexity');
  if (raw.includes('genspark')) tags.add('genspark');
  if (raw.includes('grok')) tags.add('grok');
  if (raw.includes('copilot') || raw.includes('microsoft')) tags.add('copilot');
  if (raw.includes('midjourney')) tags.add('midjourney');
  const rumorCue = raw.includes('噂') || raw.includes('うわさ') || raw.includes('リーク') || raw.includes('未発表') || raw.includes('予測') || raw.includes('今後') || tags.has('ai-rumor') || tags.has('ai-leak') || tags.has('ai-prediction');
  if (rumorCue) {
    let matchedRumorTool = false;
    if (raw.includes('chatgpt') || raw.includes('openai')) { tags.add('rumor-chatgpt'); matchedRumorTool = true; }
    if (raw.includes('claude') || raw.includes('anthropic')) { tags.add('rumor-claude'); matchedRumorTool = true; }
    if (raw.includes('gemini') || raw.includes('google')) { tags.add('rumor-gemini'); matchedRumorTool = true; }
    if (raw.includes('perplexity')) { tags.add('rumor-perplexity'); matchedRumorTool = true; }
    if (raw.includes('genspark')) { tags.add('rumor-genspark'); matchedRumorTool = true; }
    if (raw.includes('grok')) { tags.add('rumor-grok'); matchedRumorTool = true; }
    if (raw.includes('copilot') || raw.includes('microsoft')) { tags.add('rumor-copilot'); matchedRumorTool = true; }
    if (raw.includes('midjourney')) { tags.add('rumor-midjourney'); matchedRumorTool = true; }
    if (!matchedRumorTool) tags.add('rumor-other');
  }
  if (raw.includes('wordpress') || raw.includes('文標')) tags.add('wordpress');
  if (raw.includes('副業') || raw.includes('稼')) tags.add('earn');
  if (raw.includes('テンプレ') || raw.includes('比較記事')) tags.add('template');
  if (raw.includes('在宅') || raw.includes('家で作業')) tags.add('home-work');
  if (raw.includes('aiニュース') || raw.includes('ai検索')) tags.add('ai-news');
  if (raw.includes('faq')) tags.add('faq');
  return [...tags];
}

function categoryKeyFromTag(value) {
  const key = normalizeFilter(value);
  return key.startsWith('group:') ? key.replace('group:', '') : key;
}

function categoryKeysFromTags(tags) {
  const seen = new Set();
  const normalized = parseTagValues(tags).map(categoryKeyFromTag);
  const keys = normalized
    .filter(key => {
      if (!key || ['ai-rumor', 'ai-leak', 'ai-prediction'].includes(key) || !categoryParentByKey[key] || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (!keys.some(key => key.startsWith('rumor-')) && normalized.some(key => ['ai-rumor', 'ai-leak', 'ai-prediction'].includes(key))) {
    keys.push('rumor-other');
  }
  return keys;
}

function parseTagValues(value) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
  return String(value || '').split(/[\s,、]+/).map(item => item.trim()).filter(Boolean);
}

function fallbackCategoryKeys(post) {
  const override = postCategoryOverrides[post?.slug];
  if (override) return override.filter(key => categoryParentByKey[key]);
  return [];
}

function categoryKeysForPost(post) {
  const fallback = fallbackCategoryKeys(post);
  if (fallback.length) return fallback.slice(0, 4);
  return categoryKeysFromTags(post?.tags || []).slice(0, 4);
}

function primaryParentForPost(post) {
  const keys = categoryKeysForPost(post);
  return categoryParentByKey[keys[0]] || '';
}

function categoryKeysFromCard(card) {
  const hasExplicitKeys = card.hasAttribute('data-category-keys');
  const explicit = categoryKeysFromTags(card.dataset.categoryKeys || '');
  if (hasExplicitKeys || explicit.length) return explicit;
  return postCategoryOverrides[card.dataset.slug] || [];
}

function parentFromCard(card) {
  const parent = normalizeFilter(card.dataset.parentCategory || '');
  if (parent && parent !== 'all') return parent.startsWith('group:') ? parent.replace('group:', '') : parent;
  const keys = categoryKeysFromCard(card);
  return categoryParentByKey[keys[0]] || '';
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
    const url = post.url || postUrl(post.slug);
    const categoryKeys = categoryKeysForPost(post);
    const parentCategory = primaryParentForPost(post);
    const normalizedTags = [...new Set([...(post.tags||[]), ...normalizePostTags(post)])];
    const tags = categoryKeys
      .slice(0, 4)
      .map(tag => `<a class="post-card-tag" href="${tagUrl(tag)}">${esc(getFilterLabel(tag))}</a>`)
      .join('');
    const img = post.eyecatch
      ? `<img class="post-card-img" src="${esc(post.eyecatch)}" alt="${esc(post.title)}" loading="lazy" />`
      : `<div class="post-card-img-placeholder">📝</div>`;
    return `
      <article class="post-card" data-slug="${esc(post.slug)}" data-tags="${esc(normalizedTags.join(' ').toLowerCase())}" data-category-keys="${esc(categoryKeys.join(' '))}" data-parent-category="${esc(parentCategory)}" data-search="${esc([post.title, post.excerpt, ...normalizedTags].join(' ').toLowerCase())}">
        ${img}
        <div class="post-card-body">
          <div class="post-card-meta">
            <span>${esc(formatDisplayDate(post.date))}</span>
            ${tags}
          </div>
          <div class="post-card-title">${esc(post.title)}</div>
          ${post.excerpt ? `<div class="post-card-excerpt">${esc(post.excerpt)}</div>` : '<div class="post-card-excerpt">記事本文の先頭を読み込みます。</div>'}
          <div class="post-card-preview"></div>
          <div class="post-card-footer">
            <a class="read-more" href="${url}">続きを読む</a>
            ${hasLink ? `<a class="open-link" href="${url}">${esc(post.title)}を読む →</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');

  prepareCardLinks();
  applyFilters();
}

function prepareCardLinks() {
  postsEl.querySelectorAll('.post-card').forEach((card) => {
    const link = card.querySelector('.read-more, .open-link');
    if (!link) return;
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', link.textContent.trim());
  });
}

postsEl.addEventListener('click', (event) => {
  const card = event.target.closest('.post-card');
  if (!card) return;
  if (event.target.closest('a')) return;
  const link = card.querySelector('.read-more, .open-link');
  if (link) window.location.href = link.href;
});

postsEl.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.post-card');
  if (!card) return;
  event.preventDefault();
  const link = card.querySelector('.read-more, .open-link');
  if (link) window.location.href = link.href;
});

prepareCardLinks();

function normalizeFilter(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'all';
  if (v.startsWith('group:')) return v;
  if (['ai', 'aiニュース', 'ai-news'].includes(v)) return 'ai-news';
  if (['ai-news-all', 'aiニュースすべて', 'aiニュース全部'].includes(v)) return 'group:ai-news';
  if (['ai-rumor-all', 'aiの噂すべて', 'aiの噂全部', 'aiの噂・予測全部', 'ai-rumor'].includes(v)) return 'group:ai-rumor';
  if (['aiの噂', 'ai噂', 'うわさ'].includes(v)) return 'group:ai-rumor';
  if (['リーク', '未発表', 'リーク・未発表', 'ai-leak', '今後の予測', '予測', 'ai-prediction'].includes(v)) return 'rumor-other';
  if (['rumor-chatgpt', 'chatgptの噂', 'chatgpt噂'].includes(v)) return 'rumor-chatgpt';
  if (['rumor-claude', 'claudeの噂', 'claude噂'].includes(v)) return 'rumor-claude';
  if (['rumor-gemini', 'geminiの噂', 'gemini噂'].includes(v)) return 'rumor-gemini';
  if (['rumor-perplexity', 'perplexityの噂', 'perplexity噂'].includes(v)) return 'rumor-perplexity';
  if (['rumor-genspark', 'gensparkの噂', 'genspark噂'].includes(v)) return 'rumor-genspark';
  if (['rumor-grok', 'grokの噂', 'grok噂'].includes(v)) return 'rumor-grok';
  if (['rumor-copilot', 'copilotの噂', 'copilot噂'].includes(v)) return 'rumor-copilot';
  if (['rumor-midjourney', 'midjourneyの噂', 'midjourney噂'].includes(v)) return 'rumor-midjourney';
  if (['rumor-other', 'その他の噂'].includes(v)) return 'rumor-other';
  if (['副業すべて', '副業ネタ全部', 'earn-all'].includes(v)) return 'group:earn';
  if (['wordpressすべて', 'ツール全部', 'wordpress-all'].includes(v)) return 'group:wordpress';
  if (['在宅すべて', '在宅ヒント全部', 'home-work-all'].includes(v)) return 'group:home-work';
  if (['chatgpt', 'openai', 'gpt', 'chatgptニュース'].includes(v)) return 'chatgpt';
  if (['claude', 'anthropic', 'claudeニュース'].includes(v)) return 'claude';
  if (['gemini', 'google-ai', 'googleai', 'geminiニュース'].includes(v)) return 'gemini';
  if (['稼ぎ方', '収益化ネタ', '商品案', 'earn', 'money'].includes(v)) return 'earn';
  if (['wp', 'wordpress', 'wordPress'.toLowerCase()].includes(v)) return 'wordpress';
  if (['記事', '記事づくり', 'article', 'writing'].includes(v)) return 'article';
  if (['在宅', '在宅ワーク習慣', 'home', 'home-work'].includes(v)) return 'home-work';
  if (['テンプレ', '記事テンプレ', 'テンプレ販売', 'template'].includes(v)) return 'template';
  return v;
}

function applyFilters() {
  const q = (blogSearchEl?.value || '').trim().toLowerCase();
  let visible = 0;
  const cards = Array.from(postsEl.querySelectorAll('.post-card'));
  const filterLabel = getFilterLabel(activeFilter);
  cards.forEach(card => {
    const text = ((card.dataset.search || '') + ' ' + card.innerText).toLowerCase();
    const tagOk = filterMatches(activeFilter, card);
    const queryOk = !q || text.includes(q);
    const show = tagOk && queryOk;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  if (filterStatusEl) {
    filterStatusEl.textContent = cards.length
      ? `${filterLabel}の記事を${visible}件表示中`
      : '記事を読み込んでいます。';
  }
}

function filterMatches(filter, card) {
  const normalized = normalizeFilter(filter);
  if (normalized === 'all') return true;

  const keys = categoryKeysFromCard(card);
  if (normalized.startsWith('group:')) {
    const parent = normalized.replace('group:', '');
    return keys.some(key => categoryParentByKey[key] === parent);
  }

  const requiredParent = categoryParentByKey[normalized] || '';
  if (requiredParent) return keys.includes(normalized);

  const tagText = (card.dataset.tags || card.innerText || '').toLowerCase();
  return tagText.includes(normalized);
}

function parentForFilter(filter) {
  if (filter.startsWith('group:')) return filter.replace('group:', '');
  if (categoryParentByKey[filter]) return categoryParentByKey[filter];
  return activeParent || 'ai-news';
}

function getFilterLabel(value) {
  return categoryLabels[value] || value;
}

function setActiveFilter(value, parent) {
  activeFilter = normalizeFilter(value);
  activeParent = parent || parentForFilter(activeFilter);
  categoryTabEls.forEach(btn => {
    const isActive = btn.dataset.parent === activeParent;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  categoryPanelEls.forEach(panel => {
    panel.classList.toggle('is-active', panel.dataset.parentPanel === activeParent);
  });
  const activeChildren = categoryChildEls.filter(btn => btn.dataset.parent === activeParent);
  const hasExactChild = activeChildren.some(btn => normalizeFilter(btn.dataset.filter) === activeFilter);
  categoryChildEls.forEach(btn => {
    const inActiveParent = btn.dataset.parent === activeParent;
    const isActive = inActiveParent && (hasExactChild
      ? normalizeFilter(btn.dataset.filter) === activeFilter
      : normalizeFilter(btn.dataset.filter) === `group:${activeParent}`);
    btn.classList.toggle('is-active', isActive);
  });
  applyFilters();
}

categoryTabEls.forEach(btn => {
  if (btn.tagName === 'A' && !btn.getAttribute('href')) btn.setAttribute('href', categoryUrl(btn.dataset.filter));
  btn.addEventListener('click', () => setActiveFilter(btn.dataset.filter, btn.dataset.parent));
});

categoryChildEls.forEach(btn => {
  if (btn.tagName === 'A' && !btn.getAttribute('href')) btn.setAttribute('href', categoryUrl(btn.dataset.filter));
  btn.addEventListener('click', () => setActiveFilter(btn.dataset.filter, btn.dataset.parent));
});

if (blogSearchEl) {
  blogSearchEl.addEventListener('input', applyFilters);
}

const params = new URLSearchParams(location.search);
const pathCategory = location.pathname.match(/^\/blog\/category\/([^/]+)\/?$/);
const pathTag = location.pathname.match(/^\/blog\/tag\/([^/]+)\/?$/);
if (pathCategory) setActiveFilter(decodeURIComponent(pathCategory[1]));
else if (pathTag) setActiveFilter(decodeURIComponent(pathTag[1]));
else if (params.get('category')) setActiveFilter(params.get('category'));
else if (params.get('tag')) setActiveFilter(params.get('tag'));
else setActiveFilter(activeFilter, activeParent);
if (params.get('q') && blogSearchEl) {
  blogSearchEl.value = params.get('q');
  applyFilters();
}

loadCategorySettings().finally(() => loadPosts());
