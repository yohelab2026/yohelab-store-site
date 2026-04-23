<?php
/**
 * Lightweight internal analytics.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('template_redirect', 'aio_starter_track_view');
function aio_starter_track_view() {
    if (aio_starter_get_option('internal_analytics', '1') !== '1' || !is_singular() || is_user_logged_in()) {
        return;
    }

    $post_id = get_queried_object_id();
    $views = (int) get_post_meta($post_id, '_aio_starter_views', true);
    update_post_meta($post_id, '_aio_starter_views', $views + 1);

    $ref = isset($_SERVER['HTTP_REFERER']) ? esc_url_raw(wp_unslash($_SERVER['HTTP_REFERER'])) : '';
    if ($ref && strpos($ref, home_url()) !== 0) {
        $host = wp_parse_url($ref, PHP_URL_HOST);
        if ($host) {
            $refs = get_option('aio_starter_referrers', array());
            $refs = is_array($refs) ? $refs : array();
            $refs[$host] = isset($refs[$host]) ? (int) $refs[$host] + 1 : 1;
            arsort($refs);
            update_option('aio_starter_referrers', array_slice($refs, 0, 30, true), false);
        }
    }
}

add_action('wp_dashboard_setup', 'aio_starter_dashboard_widget');
function aio_starter_dashboard_widget() {
    wp_add_dashboard_widget('aio_starter_analytics', 'AIO Starter 軽量解析', 'aio_starter_dashboard_widget_render');
}

function aio_starter_dashboard_widget_render() {
    $posts = get_posts(array(
        'posts_per_page' => 5,
        'meta_key'       => '_aio_starter_views',
        'orderby'        => 'meta_value_num',
        'order'          => 'DESC',
        'post_status'    => 'publish',
    ));

    echo '<h3>人気記事</h3><ol>';
    foreach ($posts as $post) {
        $views = (int) get_post_meta($post->ID, '_aio_starter_views', true);
        echo '<li><a href="' . esc_url(get_edit_post_link($post->ID)) . '">' . esc_html(get_the_title($post)) . '</a> - ' . esc_html(number_format_i18n($views)) . ' PV</li>';
    }
    echo '</ol>';

    $refs = get_option('aio_starter_referrers', array());
    if ($refs) {
        echo '<h3>流入元</h3><ol>';
        foreach (array_slice($refs, 0, 5, true) as $host => $count) {
            echo '<li>' . esc_html($host) . ' - ' . esc_html(number_format_i18n((int) $count)) . '</li>';
        }
        echo '</ol>';
    }
}
