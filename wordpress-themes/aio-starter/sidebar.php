<?php
/**
 * Sidebar.
 *
 * @package AIO_Starter
 */
?>
<aside class="aio-sidebar">
  <?php if (is_active_sidebar('sidebar-1')) : ?>
    <?php dynamic_sidebar('sidebar-1'); ?>
  <?php endif; ?>
  <section class="aio-widget">
    <h2>サイト内検索</h2>
    <?php get_search_form(); ?>
  </section>
  <section class="aio-widget">
    <h2>人気記事</h2>
    <ol>
      <?php
      $popular = get_posts(array(
          'posts_per_page' => 5,
          'meta_key'       => '_aio_starter_views',
          'orderby'        => 'meta_value_num',
          'order'          => 'DESC',
      ));
      foreach ($popular as $post) :
          setup_postdata($post);
          ?>
          <li><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></li>
      <?php endforeach; wp_reset_postdata(); ?>
    </ol>
  </section>
</aside>
