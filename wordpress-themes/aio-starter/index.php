<?php
/**
 * Main template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main>
  <section class="aio-hero">
    <div class="aio-wrap">
      <div class="aio-hero-card">
        <span class="aio-eyebrow">AIO Starter</span>
        <h1 class="aio-title"><?php bloginfo('name'); ?></h1>
        <p class="aio-lead"><?php bloginfo('description'); ?></p>
      </div>
    </div>
  </section>
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
          <article <?php post_class('aio-article'); ?>>
            <h2 class="aio-post-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
            <div class="aio-meta">
              <span><?php echo esc_html(get_the_date()); ?></span>
              <span><?php the_author_posts_link(); ?></span>
            </div>
            <div class="aio-entry"><?php the_excerpt(); ?></div>
          </article>
        <?php endwhile; ?>
        <?php the_posts_pagination(); ?>
      <?php else : ?>
        <article class="aio-article"><p>記事がまだありません。</p></article>
      <?php endif; ?>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
