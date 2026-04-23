<?php
/**
 * 404 template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main id="content">
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <article class="aio-article">
        <h1 class="aio-post-title">ページが見つかりません</h1>
        <p>URLが変わっているか、まだ公開されていないページです。</p>
        <p><a class="aio-btn" href="<?php echo esc_url(home_url('/')); ?>">トップへ戻る</a></p>
      </article>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
