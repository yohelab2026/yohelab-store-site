<?php
/**
 * llms.txt endpoint.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', 'aio_starter_llms_rewrite');
function aio_starter_llms_rewrite() {
    add_rewrite_rule('^llms\.txt$', 'index.php?aio_starter_llms=1', 'top');
    add_rewrite_tag('%aio_starter_llms%', '1');
}

add_action('after_switch_theme', 'aio_starter_flush_rewrite');
function aio_starter_flush_rewrite() {
    aio_starter_llms_rewrite();
    flush_rewrite_rules();
}

add_action('template_redirect', 'aio_starter_render_llms');
function aio_starter_render_llms() {
    if (get_query_var('aio_starter_llms') !== '1') {
        return;
    }

    nocache_headers();
    header('Content-Type: text/plain; charset=utf-8');

    $site_name = get_bloginfo('name');
    $site_desc = get_bloginfo('description');

    echo '# ' . $site_name . "\n\n";
    if ($site_desc) {
        echo '> ' . $site_desc . "\n\n";
    }
    echo 'Site: ' . home_url('/') . "\n";
    echo 'Sitemap: ' . home_url('/sitemap.xml') . "\n\n";

    // 固定ページ
    $pages = get_pages(array('sort_column' => 'menu_order', 'post_status' => 'publish'));
    if ($pages) {
        echo "## Pages\n";
        foreach ($pages as $page) {
            $excerpt = aio_starter_excerpt($page, 120);
            echo '- [' . get_the_title($page) . '](' . get_permalink($page) . ')'
                . ($excerpt ? ': ' . $excerpt : '') . "\n";
        }
        echo "\n";
    }

    // 投稿（最新30件）
    $posts = get_posts(array(
        'posts_per_page' => 30,
        'post_status'    => 'publish',
        'post_type'      => 'post',
        'orderby'        => 'date',
        'order'          => 'DESC',
    ));
    if ($posts) {
        echo "## Posts\n";
        foreach ($posts as $post) {
            $excerpt = aio_starter_excerpt($post, 120);
            echo '- [' . get_the_title($post) . '](' . get_permalink($post) . ')'
                . ($excerpt ? ': ' . $excerpt : '') . "\n";
        }
        echo "\n";
    }

    // カテゴリー
    $cats = get_categories(array('hide_empty' => true));
    if ($cats) {
        echo "## Categories\n";
        foreach ($cats as $cat) {
            echo '- [' . $cat->name . '](' . get_category_link($cat) . ')'
                . ($cat->description ? ': ' . $cat->description : '') . "\n";
        }
        echo "\n";
    }

    $extra = aio_starter_get_option('llms_extra', '');
    if ($extra) {
        echo "## Notes\n" . $extra . "\n";
    }
    exit;
}
