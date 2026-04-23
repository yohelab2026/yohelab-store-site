<?php
/**
 * Page template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main id="content">
  <div class="aio-wrap"><?php aio_starter_breadcrumb_html(); ?></div>
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class('aio-article'); ?>>
          <h1 class="aio-post-title"><?php the_title(); ?></h1>
          <div class="aio-entry">
            <?php
            the_content();
            wp_link_pages(array(
                'before' => '<nav class="aio-page-links" aria-label="' . esc_attr__('Page links', 'aio-starter') . '">',
                'after'  => '</nav>',
            ));
            ?>
          </div>
          <?php comments_template(); ?>
        </article>
      <?php endwhile; ?>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
