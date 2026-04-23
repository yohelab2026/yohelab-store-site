<?php
/**
 * Archive template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main id="content">
  <section class="aio-hero">
    <div class="aio-wrap">
      <div class="aio-hero-card">
        <span class="aio-eyebrow">Archive</span>
        <h1 class="aio-title"><?php the_archive_title(); ?></h1>
        <p class="aio-lead"><?php the_archive_description(); ?></p>
      </div>
    </div>
  </section>
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class('aio-article'); ?>>
          <h2 class="aio-post-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
          <div class="aio-entry"><?php the_excerpt(); ?></div>
        </article>
      <?php endwhile; ?>
      <?php the_posts_pagination(); ?>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
