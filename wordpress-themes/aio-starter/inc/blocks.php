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
        // すでにidがあれば上書きしない
        if (strpos($attrs, 'id=') !== false) {
            return $m[0];
        }
        return '<h' . $level . $attrs . ' id="' . esc_attr($id) . '">' . $text . '</h' . $level . '>';
    }, $content);
    return $content;
}

add_action('init', 'aio_starter_register_patterns');
function aio_starter_register_patterns() {
    if (!function_exists('register_block_pattern')) {
        return;
    }

    register_block_pattern('aio-starter/article-template', array(
        'title' => 'AIO記事テンプレート',
        'categories' => array('text'),
        'content' => '<!-- wp:paragraph --><p>[aio_summary]結論を先に3行でまとめます。[/aio_summary]</p><!-- /wp:paragraph --><!-- wp:heading --><h2>結論</h2><!-- /wp:heading --><!-- wp:paragraph --><p>読者が最初に知りたい答えを書きます。</p><!-- /wp:paragraph --><!-- wp:heading --><h2>よくある質問</h2><!-- /wp:heading --><!-- wp:paragraph --><p>[aio_faq question="質問を入れる"]回答を入れます。[/aio_faq]</p><!-- /wp:paragraph -->',
    ));
}
