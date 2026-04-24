<?php
/**
 * AIO Starter theme bootstrap.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AIO_STARTER_VERSION', '0.1.3');
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
    'inc/content-assistant.php',
    'inc/updater.php',
);

foreach ($aio_starter_includes as $aio_starter_file) {
    require_once AIO_STARTER_DIR . '/' . $aio_starter_file;
}

add_action('after_setup_theme', 'aio_starter_setup');
function aio_starter_setup() {
    load_theme_textdomain('aio-starter', AIO_STARTER_DIR . '/languages');

    add_theme_support('title-tag');
    add_theme_support('automatic-feed-links');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo', array(
        'height'      => 96,
        'width'       => 96,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
    add_theme_support('editor-styles');
    add_theme_support('custom-header', array(
        'default-image' => '',
        'width'         => 1600,
        'height'        => 520,
        'flex-width'    => true,
        'flex-height'   => true,
    ));
    add_theme_support('custom-background', array(
        'default-color' => 'f7faf8',
    ));
    add_editor_style('assets/css/editor.css');

    register_nav_menus(array(
        'primary' => __('Primary Menu', 'aio-starter'),
    ));
}

add_action('widgets_init', 'aio_starter_widgets_init');
function aio_starter_widgets_init() {
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

add_action('init', 'aio_starter_register_block_styles');
function aio_starter_register_block_styles() {
    register_block_style('core/quote', array(
        'name'  => 'aio-citation',
        'label' => __('AIO Citation', 'aio-starter'),
    ));

    register_block_style('core/list', array(
        'name'  => 'aio-checklist',
        'label' => __('AIO Checklist', 'aio-starter'),
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
    $main_soft = aio_starter_mix_color($main, '#ffffff', 0.86);

    $inline = sprintf(
        ':root{--aio-green:%1$s;--aio-green-dark:%2$s;--aio-green-soft:%3$s;--aio-text:%4$s;}',
        esc_html($main),
        esc_html($main_dark),
        esc_html($main_soft),
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
    // Google Search Console 認証
    $gsc = aio_starter_get_option('gsc_verification', '');
    if ($gsc) {
        echo '<meta name="google-site-verification" content="' . esc_attr($gsc) . '">' . "\n";
    }

    if (is_singular()) {
        global $post;
        $title   = get_the_title($post);
        $url     = get_permalink($post);
        $excerpt = aio_starter_excerpt($post, 160);

        // meta description
        if ($excerpt) {
            echo '<meta name="description" content="' . esc_attr($excerpt) . '">' . "\n";
        }

        // OGP
        echo '<meta property="og:type" content="article">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:locale" content="ja_JP">' . "\n";
        if ($excerpt) {
            echo '<meta property="og:description" content="' . esc_attr($excerpt) . '">' . "\n";
        }

        // og:image — アイキャッチ → サイトアイコン の順でフォールバック
        $img_url = '';
        if (has_post_thumbnail($post)) {
            $img_url = (string) get_the_post_thumbnail_url($post, 'large');
        }
        if (!$img_url) {
            $img_url = (string) get_site_icon_url(512);
        }
        if ($img_url) {
            echo '<meta property="og:image" content="' . esc_url($img_url) . '">' . "\n";
        }

        // twitter:card — 画像ありなら large_image、なければ summary
        $card = $img_url ? 'summary_large_image' : 'summary';
        echo '<meta name="twitter:card" content="' . esc_attr($card) . '">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        if ($excerpt) {
            echo '<meta name="twitter:description" content="' . esc_attr($excerpt) . '">' . "\n";
        }
        if ($img_url) {
            echo '<meta name="twitter:image" content="' . esc_url($img_url) . '">' . "\n";
        }

    } elseif (is_front_page() || is_home()) {
        $name = get_bloginfo('name');
        $desc = get_bloginfo('description');
        $url  = home_url('/');
        if ($desc) {
            echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
        }
        echo '<meta property="og:type" content="website">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($name) . '">' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '">' . "\n";
        echo '<meta property="og:locale" content="ja_JP">' . "\n";
        if ($desc) {
            echo '<meta property="og:description" content="' . esc_attr($desc) . '">' . "\n";
        }
        $icon = (string) get_site_icon_url(512);
        if ($icon) {
            echo '<meta property="og:image" content="' . esc_url($icon) . '">' . "\n";
        }
        echo '<meta name="twitter:card" content="summary">' . "\n";
    }
}

add_action('wp_head', 'aio_starter_ga4_tag', 20);
function aio_starter_ga4_tag() {
    $ga4 = aio_starter_get_option('ga4_id', '');
    if (!$ga4) {
        return;
    }
    ?>
    <script>
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
      window.gtag('js', new Date());
      window.gtag('config', '<?php echo esc_js($ga4); ?>');
      (window.requestIdleCallback || function(cb){window.setTimeout(cb, 1200);})(function(){
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=<?php echo esc_js(rawurlencode($ga4)); ?>';
        document.head.appendChild(script);
      });
    </script>
    <?php
}
