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

    return '<details class="aio-faq"><summary>' . esc_html($atts['question']) . '</summary><div class="aio-faq-answer">' . wpautop(do_shortcode($content)) . '</div></details>';
}

add_shortcode('aio_summary', 'aio_starter_shortcode_summary');
function aio_starter_shortcode_summary($atts, $content = '') {
    $atts = shortcode_atts(array('title' => 'この記事のポイント'), $atts, 'aio_summary');
    return '<div class="aio-summary"><strong>' . esc_html($atts['title']) . '</strong>' . wpautop(do_shortcode($content)) . '</div>';
}

add_shortcode('aio_author', 'aio_starter_shortcode_author');
function aio_starter_shortcode_author() {
    $author_id = get_the_author_meta('ID');
    if (!$author_id) {
        return '';
    }

    return '<div class="aio-author-box">' .
        get_avatar($author_id, 144) .
        '<div><strong>' . esc_html(get_the_author_meta('display_name', $author_id)) . '</strong>' .
        '<p>' . esc_html(get_the_author_meta('description', $author_id)) . '</p></div>' .
        '</div>';
}

add_shortcode('aio_compare', 'aio_starter_shortcode_compare');
function aio_starter_shortcode_compare($atts, $content = '') {
    return '<div class="aio-compare">' . do_shortcode($content) . '</div>';
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
