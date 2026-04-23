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

    echo '# ' . get_bloginfo('name') . "\n\n";
    echo '> ' . get_bloginfo('description') . "\n\n";
    echo 'Site: ' . home_url('/') . "\n";
    echo 'Sitemap: ' . home_url('/sitemap.xml') . "\n\n";
    echo "## Important pages\n";

    $posts = get_posts(array(
        'posts_per_page' => 20,
        'post_status' => 'publish',
        'post_type' => array('post', 'page'),
    ));

    foreach ($posts as $post) {
        echo '- [' . get_the_title($post) . '](' . get_permalink($post) . '): ' . aio_starter_excerpt($post, 120) . "\n";
    }

    $extra = aio_starter_get_option('llms_extra', '');
    if ($extra) {
        echo "\n## Notes\n" . $extra . "\n";
    }
    exit;
}
