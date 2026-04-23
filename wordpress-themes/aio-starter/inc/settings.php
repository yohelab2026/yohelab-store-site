<?php
/**
 * Theme settings page.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', 'aio_starter_settings_menu');
function aio_starter_settings_menu() {
    add_theme_page(
        __('AIO Starter Settings', 'aio-starter'),
        __('AIO Starter', 'aio-starter'),
        'manage_options',
        'aio-starter',
        'aio_starter_settings_page'
    );
}

add_action('admin_init', 'aio_starter_register_settings');
function aio_starter_register_settings() {
    register_setting('aio_starter_options_group', 'aio_starter_options', array(
        'sanitize_callback' => 'aio_starter_sanitize_options',
    ));
}

function aio_starter_sanitize_options($input) {
    $input = is_array($input) ? $input : array();
    return array(
        'color_preset'       => in_array($input['color_preset'] ?? 'green', array('green', 'light', 'dark'), true) ? $input['color_preset'] : 'green',
        'main_color'         => aio_starter_normalize_hex_color($input['main_color'] ?? '#0d8f72', '#0d8f72'),
        'text_color'         => aio_starter_normalize_hex_color($input['text_color'] ?? '#0b1220', '#0b1220'),
        'ga4_id'             => sanitize_text_field($input['ga4_id'] ?? ''),
        'gsc_verification'   => sanitize_text_field($input['gsc_verification'] ?? ''),
        'internal_analytics' => !empty($input['internal_analytics']) ? '1' : '0',
        'static_cache'       => !empty($input['static_cache']) ? '1' : '0',
        'llms_extra'         => sanitize_textarea_field($input['llms_extra'] ?? ''),
    );
}

function aio_starter_settings_page() {
    $options = aio_starter_get_options();
    ?>
    <div class="wrap">
      <h1>AIO Starter</h1>
        <p>初心者向けに、AIOの土台、軽量解析、llms.txt、外部計測IDをまとめて設定します。</p>
      <form method="post" action="options.php">
        <?php settings_fields('aio_starter_options_group'); ?>
        <table class="form-table" role="presentation">
          <tr>
            <th scope="row"><label for="aio-color-preset">デザインプリセット</label></th>
            <td>
              <select id="aio-color-preset" name="aio_starter_options[color_preset]">
                <option value="green" <?php selected($options['color_preset'], 'green'); ?>>Green</option>
                <option value="light" <?php selected($options['color_preset'], 'light'); ?>>Light</option>
                <option value="dark" <?php selected($options['color_preset'], 'dark'); ?>>Dark</option>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="aio-main-color">メインカラー</label></th>
            <td>
              <input id="aio-main-color" type="color" name="aio_starter_options[main_color]" value="<?php echo esc_attr($options['main_color']); ?>">
              <p class="description">ボタン、リンク、見出しアクセントに使う色。</p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="aio-text-color">文字色</label></th>
            <td>
              <input id="aio-text-color" type="color" name="aio_starter_options[text_color]" value="<?php echo esc_attr($options['text_color']); ?>">
              <p class="description">本文やタイトルの基本色。</p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="aio-ga4-id">GA4 測定ID</label></th>
            <td><input id="aio-ga4-id" class="regular-text" name="aio_starter_options[ga4_id]" value="<?php echo esc_attr($options['ga4_id']); ?>" placeholder="G-XXXXXXXXXX"></td>
          </tr>
          <tr>
            <th scope="row"><label for="aio-gsc">Search Console 認証コード</label></th>
            <td><input id="aio-gsc" class="regular-text" name="aio_starter_options[gsc_verification]" value="<?php echo esc_attr($options['gsc_verification']); ?>"></td>
          </tr>
          <tr>
            <th scope="row">内部アクセス解析</th>
            <td><label><input type="checkbox" name="aio_starter_options[internal_analytics]" value="1" <?php checked($options['internal_analytics'], '1'); ?>> PV・人気記事・流入元を軽量記録する</label></td>
          </tr>
          <tr>
            <th scope="row">静的HTMLキャッシュ</th>
            <td><label><input type="checkbox" name="aio_starter_options[static_cache]" value="1" <?php checked($options['static_cache'], '1'); ?>> 未ログイン閲覧者向けに簡易キャッシュを使う</label></td>
          </tr>
          <tr>
            <th scope="row"><label for="aio-llms-extra">llms.txt 追加メモ</label></th>
            <td><textarea id="aio-llms-extra" class="large-text" rows="6" name="aio_starter_options[llms_extra]"><?php echo esc_textarea($options['llms_extra']); ?></textarea></td>
          </tr>
        </table>
        <?php submit_button(); ?>
      </form>
    </div>
    <?php
}
