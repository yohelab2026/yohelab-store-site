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
        'main_color'         => '#0d8f72',
        'text_color'         => '#0b1220',
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

function aio_starter_hex_to_rgb($hex) {
    $hex = ltrim((string) $hex, '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }

    if (strlen($hex) !== 6) {
        return null;
    }

    return array(
        hexdec(substr($hex, 0, 2)),
        hexdec(substr($hex, 2, 2)),
        hexdec(substr($hex, 4, 2)),
    );
}

function aio_starter_adjust_color($hex, $ratio = 0.8) {
    $rgb = aio_starter_hex_to_rgb($hex);
    if (!$rgb) {
        return $hex;
    }

    $ratio = max(0, min(1, (float) $ratio));
    $rgb = array_map(static function ($value) use ($ratio) {
        return max(0, min(255, (int) round($value * $ratio)));
    }, $rgb);

    return sprintf('#%02x%02x%02x', $rgb[0], $rgb[1], $rgb[2]);
}

function aio_starter_mix_color($hex, $target = '#ffffff', $ratio = 0.14) {
    $rgb = aio_starter_hex_to_rgb($hex);
    $mix = aio_starter_hex_to_rgb($target);
    if (!$rgb || !$mix) {
        return $hex;
    }

    $ratio = max(0, min(1, (float) $ratio));
    $output = array();
    foreach ($rgb as $index => $value) {
        $output[] = (int) round($value * (1 - $ratio) + $mix[$index] * $ratio);
    }

    return sprintf('#%02x%02x%02x', $output[0], $output[1], $output[2]);
}

function aio_starter_normalize_hex_color($value, $default) {
    $color = sanitize_hex_color($value);
    return $color ?: $default;
}
