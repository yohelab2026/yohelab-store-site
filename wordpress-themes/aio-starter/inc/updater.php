<?php
/**
 * Theme auto-updater.
 *
 * Checks yohelab.com for a newer version and shows the update notice
 * in WP Admin > Appearance > Themes, just like themes from WordPress.org.
 *
 * Update manifest URL: https://yohelab.com/api/theme-update/aio-starter.json
 * Expected JSON shape:
 *   {
 *     "version": "0.1.4",
 *     "details_url": "https://yohelab.com/products/wordpress-theme-beta/",
 *     "package": "https://yohelab.com/downloads/aio-starter.zip"
 *   }
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AIO_STARTER_UPDATE_URL', 'https://yohelab.com/api/theme-update/aio-starter.json');
define('AIO_STARTER_THEME_SLUG', 'aio-starter');

/**
 * Fetch update manifest with 12-hour transient cache.
 *
 * @return array|false Associative array from JSON, or false on failure.
 */
function aio_starter_fetch_update_data() {
    $cached = get_transient('aio_starter_update_data');
    if (is_array($cached)) {
        return $cached;
    }

    $response = wp_remote_get(AIO_STARTER_UPDATE_URL, array(
        'timeout'    => 10,
        'user-agent' => 'AIO-Starter/' . AIO_STARTER_VERSION . '; WordPress/' . get_bloginfo('version') . '; ' . home_url('/'),
        'headers'    => array('Accept' => 'application/json'),
    ));

    if (is_wp_error($response) || (int) wp_remote_retrieve_response_code($response) !== 200) {
        return false;
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    if (!isset($data['version'])) {
        return false;
    }

    // サニタイズ
    $clean = array(
        'version'     => sanitize_text_field($data['version']),
        'details_url' => esc_url_raw($data['details_url'] ?? ''),
        'package'     => esc_url_raw($data['package'] ?? ''),
    );

    set_transient('aio_starter_update_data', $clean, 12 * HOUR_IN_SECONDS);
    return $clean;
}

/**
 * Inject update info into the WordPress theme update transient.
 *
 * @param object $transient The update_themes transient object.
 * @return object
 */
add_filter('pre_set_site_transient_update_themes', 'aio_starter_check_for_update');
function aio_starter_check_for_update($transient) {
    if (empty($transient->checked)) {
        return $transient;
    }

    // このテーマが有効化されているときだけ動かす
    if (!isset($transient->checked[AIO_STARTER_THEME_SLUG])) {
        return $transient;
    }

    $data = aio_starter_fetch_update_data();
    if (!$data) {
        return $transient;
    }

    if (version_compare($data['version'], AIO_STARTER_VERSION, '>')) {
        $transient->response[AIO_STARTER_THEME_SLUG] = array(
            'theme'       => AIO_STARTER_THEME_SLUG,
            'new_version' => $data['version'],
            'url'         => $data['details_url'],
            'package'     => $data['package'],
            'requires'    => '6.5',
            'requires_php'=> '8.0',
        );
    } else {
        // アップデート不要の場合は no_update に登録（通知を出さない）
        $transient->no_update[AIO_STARTER_THEME_SLUG] = array(
            'theme'       => AIO_STARTER_THEME_SLUG,
            'new_version' => AIO_STARTER_VERSION,
            'url'         => $data['details_url'],
            'package'     => $data['package'],
        );
    }

    return $transient;
}

/**
 * テーマ詳細ポップアップに更新ページへのリンクを差し込む。
 *
 * @param false|object $override  Allows bypassing the Themes API.
 * @param string       $action    API action requested.
 * @param object       $args      Request arguments.
 * @return false|object
 */
add_filter('themes_api', 'aio_starter_themes_api', 10, 3);
function aio_starter_themes_api($override, $action, $args) {
    if ($action !== 'theme_information' || empty($args->slug) || $args->slug !== AIO_STARTER_THEME_SLUG) {
        return $override;
    }

    $data = aio_starter_fetch_update_data();
    if (!$data) {
        return $override;
    }

    return (object) array(
        'name'          => 'AIO Starter',
        'slug'          => AIO_STARTER_THEME_SLUG,
        'version'       => $data['version'],
        'author'        => 'YoheLab',
        'homepage'      => 'https://yohelab.com/',
        'sections'      => array(
            'description' => 'AIO/LLMO対応の軽量WordPressテーマ。FAQ・構造化データ・llms.txt・内部解析・GA4設定内蔵。',
            'changelog'   => sprintf(
                '<p><a href="%s" target="_blank" rel="noopener noreferrer">変更履歴を見る →</a></p>',
                esc_url($data['details_url'])
            ),
        ),
        'download_link' => $data['package'],
        'requires'      => '6.5',
        'requires_php'  => '8.0',
        'last_updated'  => current_time('Y-m-d'),
        'external'      => true,
    );
}

/**
 * アップデート完了後にキャッシュを消去する。
 *
 * @param WP_Upgrader $upgrader  Upgrader instance.
 * @param array       $hook_extra Extra data about the upgrade.
 */
add_action('upgrader_process_complete', 'aio_starter_purge_update_cache', 10, 2);
function aio_starter_purge_update_cache($upgrader, $hook_extra) {
    if (
        isset($hook_extra['type'], $hook_extra['themes']) &&
        $hook_extra['type'] === 'theme' &&
        in_array(AIO_STARTER_THEME_SLUG, (array) $hook_extra['themes'], true)
    ) {
        delete_transient('aio_starter_update_data');
    }
}

/**
 * 管理画面の設定ページに「アップデート確認」ボタンを追加するためのリンク。
 * settings.php から呼び出し可能なヘルパー。
 *
 * @return string HTML
 */
function aio_starter_update_status_html() {
    $data    = aio_starter_fetch_update_data();
    $current = AIO_STARTER_VERSION;

    if (!$data) {
        $label = esc_html__('更新情報を取得できませんでした', 'aio-starter');
        $color = '#b8bfca';
    } elseif (version_compare($data['version'], $current, '>')) {
        $label = sprintf(
            /* translators: 1: current version, 2: new version */
            esc_html__('現在 %1$s → 新バージョン %2$s あり', 'aio-starter'),
            esc_html($current),
            esc_html($data['version'])
        );
        $color = '#0d8f72';
    } else {
        $label = sprintf(
            /* translators: version number */
            esc_html__('最新版（%s）を使用中', 'aio-starter'),
            esc_html($current)
        );
        $color = '#536174';
    }

    return '<span style="color:' . esc_attr($color) . ';font-weight:700;">' . $label . '</span>';
}
