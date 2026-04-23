<?php
/**
 * Comments template.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

if (post_password_required()) {
    return;
}
?>
<section class="aio-comments">
  <?php if (have_comments()) : ?>
    <h2 class="aio-comments-title">
      <?php
      printf(
          esc_html(_nx('%1$s comment', '%1$s comments', get_comments_number(), 'comments title', 'aio-starter')),
          esc_html(number_format_i18n(get_comments_number()))
      );
      ?>
    </h2>
    <ol class="aio-comments-list">
      <?php wp_list_comments(array('style' => 'ol', 'short_ping' => true)); ?>
    </ol>
    <?php the_comments_navigation(); ?>
  <?php endif; ?>

  <?php if (!comments_open() && get_comments_number()) : ?>
    <p class="aio-comments-closed">コメントは終了しました。</p>
  <?php endif; ?>

  <?php comment_form(array(
      'class_form'    => 'aio-comment-form',
      'title_reply'   => 'コメントを書く',
      'comment_field' => '<p class="comment-form-comment"><label for="comment">コメント</label><textarea id="comment" name="comment" cols="45" rows="6" required></textarea></p>',
  )); ?>
</section>
