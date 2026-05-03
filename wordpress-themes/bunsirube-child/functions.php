<?php
/**
 * 文標 子テーマ functions.php
 *
 * 親テーマ「文標」を直接編集せず、追加CSSや小さな関数だけをここに書きます。
 */

if (!defined('ABSPATH')) {
    exit;
}

define('BUNSIRUBE_CHILD_VERSION', '0.1.1');

add_action('wp_enqueue_scripts', 'bunsirube_child_assets', 30);
function bunsirube_child_assets() {
    wp_enqueue_style(
        'bunsirube-child-style',
        get_stylesheet_uri(),
        array('bunsirube-style'),
        BUNSIRUBE_CHILD_VERSION
    );
}

/*
 * 追加カスタマイズ例:
 *
 * add_filter('excerpt_length', function () {
 *     return 80;
 * });
 */
