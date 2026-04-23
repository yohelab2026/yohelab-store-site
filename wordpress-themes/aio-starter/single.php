<?php
/**
 * Single post template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main>
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class('aio-article'); ?>>
          <div class="aio-meta">
            <span><?php echo esc_html(get_the_date()); ?></span>
            <span>更新: <?php echo esc_html(get_the_modified_date()); ?></span>
            <span><?php the_author_posts_link(); ?></span>
          </div>
          <h1 class="aio-post-title"><?php the_title(); ?></h1>
          <?php if (has_post_thumbnail()) : ?>
            <figure><?php the_post_thumbnail('large'); ?></figure>
          <?php endif; ?>
          <div class="aio-entry"><?php the_content(); ?></div>
          <?php echo do_shortcode('[aio_author]'); ?>
        </article>
      <?php endwhile; ?>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
