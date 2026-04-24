<?php
/**
 * Lightweight per-post AIO writing assistant.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('add_meta_boxes', 'aio_starter_add_content_assistant_box');
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

function aio_starter_content_assistant_defaults() {
    return array(
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
        'conclusion' => __('上部に結論ボックスがある', 'aio-starter'),
        'evidence'   => __('根拠・比較・参考リンクがある', 'aio-starter'),
        'caution'    => __('注意点や向かない人を書いた', 'aio-starter'),
        'faq'        => __('FAQを入れた', 'aio-starter'),
        'summary'    => __('最後に要点まとめがある', 'aio-starter'),
        'updated'    => __('更新日と情報の鮮度を確認した', 'aio-starter'),
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
          'reader'     => __('誰に向けた記事か', 'aio-starter'),
          'intent'     => __('検索意図・知りたい答え', 'aio-starter'),
          'conclusion' => __('最初に出す結論', 'aio-starter'),
          'evidence'   => __('根拠・比較・参考リンク', 'aio-starter'),
          'caution'    => __('注意点・向かない人', 'aio-starter'),
          'cta'        => __('最後に促す行動', 'aio-starter'),
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
