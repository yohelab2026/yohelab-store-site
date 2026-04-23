<?php
/**
 * Simple static cache.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('template_redirect', 'aio_starter_cache_start', 0);
function aio_starter_cache_start() {
    $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper(sanitize_text_field(wp_unslash($_SERVER['REQUEST_METHOD']))) : 'GET';
    if (aio_starter_get_option('static_cache', '0') !== '1' || is_user_logged_in() || is_admin() || is_search() || is_404() || is_feed() || $method !== 'GET') {
        return;
    }

    $file = aio_starter_cache_file();
    if (!$file) {
        return;
    }

    if (file_exists($file) && filemtime($file) > time() - HOUR_IN_SECONDS) {
        header('X-AIO-Starter-Cache: HIT');
        readfile($file);
        exit;
    }

    ob_start('aio_starter_cache_store');
}

function aio_starter_cache_store($html) {
    $file = aio_starter_cache_file();
    if ($file && strlen($html) > 500 && false !== stripos($html, '</html>')) {
        wp_mkdir_p(dirname($file));
        file_put_contents($file, $html, LOCK_EX);
    }
    return $html;
}

function aio_starter_cache_file() {
    $upload = wp_upload_dir();
    if (!empty($upload['error'])) {
        return '';
    }

    $uri = isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : '/';
    return trailingslashit($upload['basedir']) . 'aio-starter-cache/' . md5($uri) . '.html';
}

add_action('save_post', 'aio_starter_cache_purge');
add_action('switch_theme', 'aio_starter_cache_purge');
function aio_starter_cache_purge() {
    $upload = wp_upload_dir();
    $dir = trailingslashit($upload['basedir']) . 'aio-starter-cache';
    if (!is_dir($dir)) {
        return;
    }
    foreach (glob($dir . '/*.html') as $file) {
        @unlink($file);
    }
}
