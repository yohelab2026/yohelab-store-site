<?php
/**
 * 404 template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main id="content">
  <div class="aio-wrap" style="padding:80px 0 120px;text-align:center;">
    <span class="aio-eyebrow">404 Not Found</span>
    <h1 class="aio-post-title" style="margin:20px 0 16px;">
      ページが見つかりません
    </h1>
    <p style="color:var(--aio-muted);font-size:17px;line-height:1.8;max-width:560px;margin:0 auto 32px;">
      URLが間違っているか、ページが移動・削除された可能性があります。<br>
      トップページか検索からお探しください。
    </p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;">
      <a class="aio-btn" href="<?php echo esc_url(home_url('/')); ?>">← トップへ戻る</a>
    </div>
    <?php get_search_form(); ?>
    <?php
    $recent = get_posts(array('posts_per_page' => 5, 'post_status' => 'publish'));
    if ($recent) :
    ?>
    <div style="max-width:640px;margin:48px auto 0;text-align:left;">
      <h2 style="font-size:18px;font-weight:900;margin-bottom:16px;">最新の記事</h2>
      <ul style="display:grid;gap:10px;padding:0;list-style:none;">
        <?php foreach ($recent as $p) : ?>
          <li>
            <a href="<?php echo esc_url(get_permalink($p)); ?>" style="font-weight:700;">
              <?php echo esc_html(get_the_title($p)); ?>
            </a>
            <span style="color:var(--aio-muted);font-size:13px;margin-left:8px;">
              <?php echo esc_html(get_the_date('', $p)); ?>
            </span>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
    <?php endif; ?>
  </div>
</main>
<?php get_footer(); ?>
