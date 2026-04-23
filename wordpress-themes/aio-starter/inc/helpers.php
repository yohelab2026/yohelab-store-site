<?php
/**
 * Shared helpers.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

function aio_starter_get_options() {
    $defaults = array(
        'color_preset'       => 'green',
        'ga4_id'             => '',
        'gsc_verification'   => '',
        'internal_analytics' => '1',
        'static_cache'       => '0',
        'llms_extra'         => '',
    );

    $options = get_option('aio_starter_options', array());
    return wp_parse_args(is_array($options) ? $options : array(), $defaults);
}

function aio_starter_get_option($key, $default = '') {
    $options = aio_starter_get_options();
    return isset($options[$key]) ? $options[$key] : $default;
}

function aio_starter_excerpt($post_id = null, $length = 140) {
    $post = get_post($post_id);
    if (!$post) {
        return '';
    }

    $text = has_excerpt($post) ? get_the_excerpt($post) : wp_strip_all_tags(strip_shortcodes($post->post_content));
    return mb_substr(trim(preg_replace('/\s+/u', ' ', $text)), 0, $length);
}
