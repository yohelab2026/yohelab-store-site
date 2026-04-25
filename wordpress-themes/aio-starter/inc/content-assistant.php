<?php
/**
 * Lightweight per-post AIO writing assistant.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

function aio_starter_add_content_assistant_box() {
    add_meta_box(
        'aio-starter-content-assistant',
        __('AIO記事設計メモ', 'aio-starter'),
        'aio_starter_render_content_assistant_box',
        array('post', 'page'),
        'side',
        'high'
    );
}

add_action('init', 'aio_starter_register_content_assistant_meta');
function aio_starter_register_content_assistant_meta() {
    $text_fields = array('type', 'reader', 'intent', 'conclusion', 'evidence', 'caution', 'cta');
    foreach ($text_fields as $field) {
        register_post_meta('', '_aio_assistant_' . $field, array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_textarea_field',
            'auth_callback'     => static function () {
                return current_user_can('edit_posts');
            },
        ));
    }

    foreach (array_keys(aio_starter_content_assistant_checks()) as $field) {
        register_post_meta('', '_aio_assistant_check_' . $field, array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => static function () {
                return current_user_can('edit_posts');
            },
        ));
    }
}

add_action('enqueue_block_editor_assets', 'aio_starter_enqueue_content_assistant_sidebar');
function aio_starter_enqueue_content_assistant_sidebar() {
    wp_enqueue_script(
        'aio-starter-editor-sidebar',
        AIO_STARTER_URI . '/assets/js/editor-sidebar.js',
        array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-i18n', 'wp-blocks', 'wp-block-editor'),
        AIO_STARTER_VERSION,
        true
    );
}

function aio_starter_content_assistant_defaults() {
    return array(
        'type'       => 'basic',
        'reader'     => '',
        'intent'     => '',
        'conclusion' => '',
        'evidence'   => '',
        'caution'    => '',
        'cta'        => '',
        'checked'    => array(),
    );
}

function aio_starter_get_content_assistant($post_id) {
    $saved = get_post_meta($post_id, '_aio_content_assistant', true);
    $saved = is_array($saved) ? $saved : array();
    $data  = wp_parse_args($saved, aio_starter_content_assistant_defaults());

    $data['checked'] = is_array($data['checked']) ? $data['checked'] : array();
    return $data;
}

function aio_starter_content_assistant_checks() {
    return array(
        'conclusion' => __('最初に答えがある', 'aio-starter'),
        'evidence'   => __('理由・比較がある', 'aio-starter'),
        'caution'    => __('注意点がある', 'aio-starter'),
        'faq'        => __('FAQがある', 'aio-starter'),
        'summary'    => __('最後にまとめがある', 'aio-starter'),
        'updated'    => __('情報が古くない', 'aio-starter'),
    );
}

function aio_starter_render_content_assistant_box($post) {
    $data   = aio_starter_get_content_assistant($post->ID);
    $checks = aio_starter_content_assistant_checks();
    $score  = count(array_intersect(array_keys($checks), $data['checked']));
    $total  = count($checks);

    wp_nonce_field('aio_starter_content_assistant_save', 'aio_starter_content_assistant_nonce');
    ?>
    <style>
      .aio-assistant-box{display:grid;gap:10px}
      .aio-assistant-score{padding:10px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #b7ead6;font-weight:700;color:#047857}
      .aio-assistant-box label{font-weight:700}
      .aio-assistant-box textarea{width:100%;min-height:58px}
      .aio-assistant-checks{display:grid;gap:8px;margin-top:4px}
      .aio-assistant-checks label{font-weight:400;line-height:1.45}
      .aio-assistant-help{color:#646970;font-size:12px;margin:0}
    </style>
    <div class="aio-assistant-box">
      <div class="aio-assistant-score">
        <?php echo esc_html(sprintf(__('AIO準備度 %1$d/%2$d', 'aio-starter'), $score, $total)); ?>
      </div>
      <p class="aio-assistant-help">無料テーマとの差別化用。記事を書く前に、読者・検索意図・結論・根拠を固定します。</p>

      <?php
      $fields = array(
        'intent'     => __('この記事で答えること', 'aio-starter'),
        'conclusion' => __('先に出す答え', 'aio-starter'),
        'evidence'   => __('理由・比較・参考リンク', 'aio-starter'),
        'caution'    => __('注意点・補足', 'aio-starter'),
      );
      foreach ($fields as $key => $label) :
          ?>
          <p>
            <label for="aio-assistant-<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label>
            <textarea id="aio-assistant-<?php echo esc_attr($key); ?>" name="aio_content_assistant[<?php echo esc_attr($key); ?>]"><?php echo esc_textarea($data[$key]); ?></textarea>
          </p>
      <?php endforeach; ?>

      <div class="aio-assistant-checks">
        <?php foreach ($checks as $key => $label) : ?>
          <label>
            <input type="checkbox" name="aio_content_assistant[checked][]" value="<?php echo esc_attr($key); ?>" <?php checked(in_array($key, $data['checked'], true)); ?>>
            <?php echo esc_html($label); ?>
          </label>
        <?php endforeach; ?>
      </div>
    </div>
    <?php
}

add_action('save_post', 'aio_starter_save_content_assistant');
function aio_starter_save_content_assistant($post_id) {
    if (!isset($_POST['aio_starter_content_assistant_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aio_starter_content_assistant_nonce'])), 'aio_starter_content_assistant_save')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $input  = isset($_POST['aio_content_assistant']) && is_array($_POST['aio_content_assistant']) ? wp_unslash($_POST['aio_content_assistant']) : array();
    $checks = aio_starter_content_assistant_checks();

    $data = array(
        'reader'     => sanitize_textarea_field($input['reader'] ?? ''),
        'intent'     => sanitize_textarea_field($input['intent'] ?? ''),
        'conclusion' => sanitize_textarea_field($input['conclusion'] ?? ''),
        'evidence'   => sanitize_textarea_field($input['evidence'] ?? ''),
        'caution'    => sanitize_textarea_field($input['caution'] ?? ''),
        'cta'        => sanitize_textarea_field($input['cta'] ?? ''),
        'checked'    => array(),
    );

    if (!empty($input['checked']) && is_array($input['checked'])) {
        $data['checked'] = array_values(array_intersect(array_map('sanitize_key', $input['checked']), array_keys($checks)));
    }

    update_post_meta($post_id, '_aio_content_assistant', $data);
}
