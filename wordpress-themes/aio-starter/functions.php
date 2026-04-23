<?php
/**
 * AIO Starter theme bootstrap.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AIO_STARTER_VERSION', '0.1.2');
define('AIO_STARTER_DIR', get_template_directory());
define('AIO_STARTER_URI', get_template_directory_uri());

$aio_starter_includes = array(
    'inc/helpers.php',
    'inc/settings.php',
    'inc/json-ld.php',
    'inc/analytics.php',
    'inc/llms.php',
    'inc/cache.php',
    'inc/blocks.php',
);

foreach ($aio_starter_includes as $aio_starter_file) {
    require_once AIO_STARTER_DIR . '/' . $aio_starter_file;
}

add_action('after_setup_theme', 'aio_starter_setup');
function aio_starter_setup() {
    load_theme_textdomain('aio-starter', AIO_STARTER_DIR . '/languages');

    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo', array(
        'height'      => 96,
        'width'       => 96,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
    add_theme_support('editor-styles');
    add_editor_style('assets/css/editor.css');

    register_nav_menus(array(
        'primary' => __('Primary Menu', 'aio-starter'),
    ));

    register_sidebar(array(
        'name'          => __('Sidebar', 'aio-starter'),
        'id'            => 'sidebar-1',
        'description'   => __('Main sidebar for widgets.', 'aio-starter'),
        'before_widget' => '<section id="%1$s" class="aio-widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2>',
        'after_title'   => '</h2>',
    ));
}

add_action('wp_enqueue_scripts', 'aio_starter_assets');
function aio_starter_assets() {
    wp_enqueue_style('aio-starter-style', get_stylesheet_uri(), array(), AIO_STARTER_VERSION);
    wp_enqueue_script('aio-starter-main', AIO_STARTER_URI . '/assets/js/main.js', array(), AIO_STARTER_VERSION, true);

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }

    $options = aio_starter_get_options();
    $main = aio_starter_normalize_hex_color($options['main_color'] ?? '#0d8f72', '#0d8f72');
    $text = aio_starter_normalize_hex_color($options['text_color'] ?? '#0b1220', '#0b1220');
    $main_dark = aio_starter_adjust_color($main, 0.78);

    $inline = sprintf(
        ':root{--aio-green:%1$s;--aio-green-dark:%2$s;--aio-green-soft:color-mix(in srgb, %1$s 14%%, white);--aio-text:%3$s;}',
        esc_html($main),
        esc_html($main_dark),
        esc_html($text)
    );
    wp_add_inline_style('aio-starter-style', $inline);
}

add_filter('body_class', 'aio_starter_body_classes');
function aio_starter_body_classes($classes) {
    $preset = aio_starter_get_option('color_preset', 'green');
    $classes[] = 'aio-preset-' . sanitize_html_class($preset);
    return $classes;
}

add_filter('wp_get_attachment_image_attributes', 'aio_starter_image_attributes');
function aio_starter_image_attributes($attr) {
    if (empty($attr['loading'])) {
        $attr['loading'] = 'lazy';
    }
    if (empty($attr['decoding'])) {
        $attr['decoding'] = 'async';
    }
    if (!empty($attr['class']) && false === strpos($attr['class'], 'aio-responsive-image')) {
        $attr['class'] .= ' aio-responsive-image';
    }
    return $attr;
}

add_action('wp_head', 'aio_starter_head_meta', 4);
function aio_starter_head_meta() {
    $gsc = aio_starter_get_option('gsc_verification', '');
    if ($gsc) {
        echo '<meta name="google-site-verification" content="' . esc_attr($gsc) . '">' . "\n";
    }

    if (is_singular()) {
        global $post;
        echo '<meta property="og:type" content="article">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr(get_the_title($post)) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url(get_permalink($post)) . '">' . "\n";
        $excerpt = aio_starter_excerpt($post, 160);
        if ($excerpt) {
            echo '<meta name="description" content="' . esc_attr($excerpt) . '">' . "\n";
            echo '<meta property="og:description" content="' . esc_attr($excerpt) . '">' . "\n";
            echo '<meta name="twitter:description" content="' . esc_attr($excerpt) . '">' . "\n";
        }
        if (has_post_thumbnail($post)) {
            echo '<meta property="og:image" content="' . esc_url(get_the_post_thumbnail_url($post, 'large')) . '">' . "\n";
        }
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    }
}

add_action('wp_head', 'aio_starter_ga4_tag', 20);
function aio_starter_ga4_tag() {
    $ga4 = aio_starter_get_option('ga4_id', '');
    if (!$ga4) {
        return;
    }
    ?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?php echo esc_attr($ga4); ?>"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '<?php echo esc_js($ga4); ?>');
    </script>
    <?php
}
