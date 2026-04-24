<?php
/**
 * AIO content blocks as shortcodes and patterns.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_shortcode('aio_faq', 'aio_starter_shortcode_faq');
function aio_starter_shortcode_faq($atts, $content = '') {
    $atts = shortcode_atts(array('question' => ''), $atts, 'aio_faq');
    if (!$atts['question']) {
        return '';
    }

    $allowed = array(
        'a'      => array('href' => true, 'title' => true, 'target' => true, 'rel' => true),
        'br'     => array(),
        'em'     => array(),
        'strong' => array(),
        'p'      => array(),
        'ul'     => array(),
        'ol'     => array(),
        'li'     => array(),
        'code'   => array(),
        'span'   => array('class' => true),
    );

    return '<details class="aio-faq"><summary>' . esc_html($atts['question']) . '</summary><div class="aio-faq-answer">' . wpautop(wp_kses(do_shortcode($content), $allowed)) . '</div></details>';
}

add_shortcode('aio_summary', 'aio_starter_shortcode_summary');
function aio_starter_shortcode_summary($atts, $content = '') {
    $atts = shortcode_atts(array('title' => 'この記事のポイント'), $atts, 'aio_summary');
    return '<div class="aio-summary"><strong>' . esc_html($atts['title']) . '</strong>' . wpautop(wp_kses_post(do_shortcode($content))) . '</div>';
}

add_shortcode('aio_author', 'aio_starter_shortcode_author');
function aio_starter_shortcode_author($atts) {
    $atts = shortcode_atts(array(
        'twitter' => '',
        'x'       => '',
        'website' => '',
        'expertise' => '',
    ), $atts, 'aio_author');

    global $post;
    $author_id = $post ? (int) $post->post_author : 0;
    if (!$author_id) {
        return '';
    }

    $name        = get_the_author_meta('display_name', $author_id);
    $description = get_the_author_meta('description', $author_id);
    $author_url  = get_author_posts_url($author_id);

    // 専門分野（shortcode 属性 または カスタムフィールド）
    $expertise   = $atts['expertise'] ?: get_the_author_meta('aio_expertise', $author_id);

    // SNS リンク（shortcode 属性 → カスタムフィールド の順で取得）
    $twitter = $atts['twitter'] ?: $atts['x'] ?: get_the_author_meta('twitter', $author_id);
    $website = $atts['website'] ?: get_the_author_meta('user_url', $author_id);

    $social = '';
    if ($twitter) {
        $handle  = ltrim($twitter, '@');
        $social .= '<a class="aio-author-sns" href="https://twitter.com/' . esc_attr($handle) . '" target="_blank" rel="noopener noreferrer">𝕏 @' . esc_html($handle) . '</a>';
    }
    if ($website) {
        $social .= '<a class="aio-author-sns" href="' . esc_url($website) . '" target="_blank" rel="noopener noreferrer">🌐 ウェブサイト</a>';
    }

    $expertise_html = $expertise ? '<span class="aio-author-expertise">' . esc_html($expertise) . '</span>' : '';

    return '<div class="aio-author-box">' .
        get_avatar($author_id, 144, '', esc_attr($name), array('class' => 'aio-author-avatar')) .
        '<div class="aio-author-info">' .
            '<strong class="aio-author-name">' . esc_html($name) . '</strong>' .
            $expertise_html .
            '<p class="aio-author-bio">' . esc_html($description) . '</p>' .
            ($social ? '<div class="aio-author-links">' . $social . '</div>' : '') .
        '</div>' .
        '</div>';
}

add_shortcode('aio_compare', 'aio_starter_shortcode_compare');
function aio_starter_shortcode_compare($atts, $content = '') {
    return '<div class="aio-compare">' . wp_kses_post(do_shortcode($content)) . '</div>';
}

// 引用・出典ブロック
add_shortcode('aio_cite', 'aio_starter_shortcode_cite');
function aio_starter_shortcode_cite($atts, $content = '') {
    $atts = shortcode_atts(array('source' => '', 'url' => ''), $atts, 'aio_cite');
    $source_html = '';
    if ($atts['url']) {
        $source_html = '<cite class="aio-cite-source"><a href="' . esc_url($atts['url']) . '" target="_blank" rel="noopener noreferrer">' . esc_html($atts['source'] ?: $atts['url']) . '</a></cite>';
    } elseif ($atts['source']) {
        $source_html = '<cite class="aio-cite-source">' . esc_html($atts['source']) . '</cite>';
    }
    return '<blockquote class="aio-blockquote">' . wpautop(wp_kses_post(do_shortcode($content))) . $source_html . '</blockquote>';
}

// 目次ブロック（h2/h3 自動生成）
add_shortcode('aio_toc', 'aio_starter_shortcode_toc');
function aio_starter_shortcode_toc($atts, $content = '') {
    $atts = shortcode_atts(array('title' => '目次'), $atts, 'aio_toc');

    // 現在の投稿コンテンツからh2/h3を抽出
    global $post;
    if (!$post) {
        return '';
    }
    $raw = $post->post_content;
    if (!preg_match_all('/<h([23])[^>]*>(.*?)<\/h[23]>/is', $raw, $matches, PREG_SET_ORDER)) {
        return '';
    }

    $items   = '';
    $counter = 1;
    foreach ($matches as $m) {
        $level   = (int) $m[1];
        $text    = wp_strip_all_tags($m[2]);
        $id      = 'aio-toc-' . $counter++;
        // 見出しにIDを付与するフィルターは add_filter('the_content') で別途処理
        $indent  = $level === 3 ? ' aio-toc-sub' : '';
        $items  .= '<li class="aio-toc-item' . $indent . '"><a href="#' . esc_attr($id) . '">' . esc_html($text) . '</a></li>';
    }

    if (!$items) {
        return '';
    }

    return '<nav class="aio-toc" aria-label="目次"><strong class="aio-toc-title">' . esc_html($atts['title']) . '</strong><ol class="aio-toc-list">' . wp_kses_post($items) . '</ol></nav>';
}

// 目次用：h2/h3 に id を付与
add_filter('the_content', 'aio_starter_add_heading_ids');
function aio_starter_add_heading_ids($content) {
    $counter = 1;
    $content = preg_replace_callback('/<h([23])([^>]*)>(.*?)<\/h[23]>/is', function ($m) use (&$counter) {
        $level   = $m[1];
        $attrs   = $m[2];
        $text    = $m[3];
        $id      = 'aio-toc-' . $counter++;
        // すでにidがあれば aio-toc-N のidで上書き（TOCリンクと一致させる）
        $attrs = preg_replace('/\s*id="[^"]*"/', '', $attrs);
        return '<h' . $level . $attrs . ' id="' . esc_attr($id) . '">' . $text . '</h' . $level . '>';
    }, $content);
    return $content;
}

add_action('init', 'aio_starter_register_patterns');
function aio_starter_register_patterns() {
    if (!function_exists('register_block_pattern')) {
        return;
    }

    if (function_exists('register_block_pattern_category')) {
        register_block_pattern_category('aio-starter-templates', array(
            'label' => __('AIO記事テンプレート', 'aio-starter'),
        ));
    }

    $patterns = array(
        'aio-article-template' => array(
            'title'       => __('AIO向け基本記事テンプレート', 'aio-starter'),
            'description' => __('結論、根拠、注意点、FAQ、要点まとめを最初から入れた基本型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="この記事の結論"]結論を3行で書きます。誰に向いているか、何が分かるか、先に答えを書きます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>結論</h2><!-- /wp:heading --><!-- wp:paragraph --><p>読者が最初に知りたい答えを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>根拠</h2><!-- /wp:heading --><!-- wp:paragraph --><p>なぜそう言えるのか、データ、体験、公式情報などを整理します。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>注意点</h2><!-- /wp:heading --><!-- wp:paragraph --><p>向いていないケースや、誤解されやすいポイントを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>よくある質問</h2><!-- /wp:heading --><!-- wp:shortcode -->[aio_faq question="よくある質問を入れる"]回答を短く具体的に書きます。[/aio_faq]<!-- /wp:shortcode -->',
        ),
        'comparison-template' => array(
            'title'       => __('比較記事テンプレート', 'aio-starter'),
            'description' => __('複数商品やサービスの比較記事に使う型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="比較の結論"]迷ったら最初に選ぶべきもの、条件別のおすすめ、選ばない方がいいケースを書きます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>比較するもの</h2><!-- /wp:heading --><!-- wp:paragraph --><p>比較対象と、この記事で見る基準を先に書きます。</p><!-- /wp:paragraph --><!-- wp:shortcode -->[aio_compare]<table><thead><tr><th>項目</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>価格</td><td>入力</td><td>入力</td><td>入力</td></tr><tr><td>向いている人</td><td>入力</td><td>入力</td><td>入力</td></tr><tr><td>注意点</td><td>入力</td><td>入力</td><td>入力</td></tr></tbody></table>[/aio_compare]<!-- /wp:shortcode --><!-- wp:heading --><h2>選び方</h2><!-- /wp:heading --><!-- wp:paragraph --><p>価格、目的、使いやすさ、サポートなどの判断基準を書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>FAQ</h2><!-- /wp:heading --><!-- wp:shortcode -->[aio_faq question="どれを選べばいいですか？"]条件別に短く答えます。[/aio_faq]<!-- /wp:shortcode -->',
        ),
        'review-template' => array(
            'title'       => __('レビュー記事テンプレート', 'aio-starter'),
            'description' => __('体験、メリット、デメリット、向いている人を整理するレビュー型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="レビューの結論"]実際に使った結論、良かった点、注意点を先にまとめます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>使って分かったこと</h2><!-- /wp:heading --><!-- wp:paragraph --><p>体験ベースで、何が良かったかを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>メリット</h2><!-- /wp:heading --><!-- wp:list {"className":"is-style-aio-checklist"} --><ul class="is-style-aio-checklist"><li>良かった点を入れる</li><li>便利だった場面を入れる</li><li>他と違う点を入れる</li></ul><!-- /wp:list --><!-- wp:heading --><h2>デメリット・注意点</h2><!-- /wp:heading --><!-- wp:paragraph --><p>合わない人、気になる点、事前に知るべきことを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>向いている人</h2><!-- /wp:heading --><!-- wp:paragraph --><p>どんな人なら満足しやすいかを書きます。</p><!-- /wp:paragraph -->',
        ),
        'case-introduction-template' => array(
            'title'       => __('案件紹介記事テンプレート', 'aio-starter'),
            'description' => __('案件、サービス、募集内容を分かりやすく紹介する型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="この案件の要点"]誰向けか、何をする案件か、応募前に見るべき点をまとめます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>案件の概要</h2><!-- /wp:heading --><!-- wp:paragraph --><p>案件名、内容、対象者、報酬や条件を書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>向いている人</h2><!-- /wp:heading --><!-- wp:list {"className":"is-style-aio-checklist"} --><ul class="is-style-aio-checklist"><li>向いている条件を入れる</li><li>必要なスキルを入れる</li><li>応募前に確認することを入れる</li></ul><!-- /wp:list --><!-- wp:heading --><h2>応募前の注意点</h2><!-- /wp:heading --><!-- wp:paragraph --><p>確認すべき条件やリスクを書きます。</p><!-- /wp:paragraph --><!-- wp:shortcode -->[aio_faq question="初心者でも応募できますか？"]条件に分けて回答します。[/aio_faq]<!-- /wp:shortcode -->',
        ),
        'ai-faq-template' => array(
            'title'       => __('AI検索向けFAQ記事テンプレート', 'aio-starter'),
            'description' => __('質問と回答を中心に、AIにも人にも読み取りやすくする型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="先に答え"]この記事で扱う質問への答えを短くまとめます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>基本の答え</h2><!-- /wp:heading --><!-- wp:paragraph --><p>検索ユーザーが最初に知りたい答えを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>よくある質問</h2><!-- /wp:heading --><!-- wp:shortcode -->[aio_faq question="質問1"]回答1を具体的に書きます。[/aio_faq]<!-- /wp:shortcode --><!-- wp:shortcode -->[aio_faq question="質問2"]回答2を具体的に書きます。[/aio_faq]<!-- /wp:shortcode --><!-- wp:shortcode -->[aio_faq question="質問3"]回答3を具体的に書きます。[/aio_faq]<!-- /wp:shortcode --><!-- wp:heading --><h2>補足と注意点</h2><!-- /wp:heading --><!-- wp:paragraph --><p>例外、注意点、古くなりやすい情報を書きます。</p><!-- /wp:paragraph -->',
        ),
        'ranking-template' => array(
            'title'       => __('ランキング記事テンプレート', 'aio-starter'),
            'description' => __('ランキングの根拠と選び方を明確にする型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="ランキングの結論"]1位、2位、3位と、選んだ理由を短くまとめます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>ランキングの基準</h2><!-- /wp:heading --><!-- wp:paragraph --><p>価格、使いやすさ、機能、信頼性など、評価基準を明記します。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>おすすめランキング</h2><!-- /wp:heading --><!-- wp:list {"ordered":true} --><ol><li><strong>1位：名称</strong><br>理由と向いている人を書きます。</li><li><strong>2位：名称</strong><br>理由と向いている人を書きます。</li><li><strong>3位：名称</strong><br>理由と向いている人を書きます。</li></ol><!-- /wp:list --><!-- wp:heading --><h2>選ぶときの注意点</h2><!-- /wp:heading --><!-- wp:paragraph --><p>ランキングだけで決めない方がいい条件を書きます。</p><!-- /wp:paragraph -->',
        ),
        'product-introduction-template' => array(
            'title'       => __('商品紹介記事テンプレート', 'aio-starter'),
            'description' => __('商品説明、Q&A、注意点、購入前チェックを整理する型。', 'aio-starter'),
            'content'     => '<!-- wp:shortcode -->[aio_summary title="商品の要点"]何の商品か、誰に向いているか、購入前の注意点をまとめます。[/aio_summary]<!-- /wp:shortcode --><!-- wp:heading --><h2>商品の特徴</h2><!-- /wp:heading --><!-- wp:paragraph --><p>特徴、強み、使える場面を書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>購入前に見るポイント</h2><!-- /wp:heading --><!-- wp:list {"className":"is-style-aio-checklist"} --><ul class="is-style-aio-checklist"><li>価格と内容が合っているか</li><li>自分の用途に合うか</li><li>注意点を理解しているか</li></ul><!-- /wp:list --><!-- wp:heading --><h2>よくある質問</h2><!-- /wp:heading --><!-- wp:shortcode -->[aio_faq question="どんな人に向いていますか？"]向いている人を具体的に書きます。[/aio_faq]<!-- /wp:shortcode --><!-- wp:shortcode -->[aio_cite source="参考リンク" url="https://example.com"]参考にした情報や公式情報を書きます。[/aio_cite]<!-- /wp:shortcode -->',
        ),
    );

    foreach ($patterns as $slug => $pattern) {
        register_block_pattern('aio-starter/' . $slug, array(
            'title'       => $pattern['title'],
            'description' => $pattern['description'],
            'categories'  => array('aio-starter-templates', 'text'),
            'content'     => $pattern['content'],
        ));
    }
}
