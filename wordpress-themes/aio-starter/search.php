<?php
/**
 * Search results template.
 *
 * @package AIO_Starter
 */

get_header();
?>
<main id="content">
  <section class="aio-hero">
    <div class="aio-wrap">
      <div class="aio-hero-card">
        <span class="aio-eyebrow">Search</span>
        <h1 class="aio-title"><?php printf(esc_html__('Search results for: %s', 'aio-starter'), get_search_query()); ?></h1>
        <p class="aio-lead">探している記事を、できるだけすぐ見つけやすくする。</p>
      </div>
    </div>
  </section>
  <div class="aio-wrap aio-main">
    <div class="aio-content">
      <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
          <article <?php post_class('aio-article'); ?>>
            <h2 class="aio-post-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
            <div class="aio-entry"><?php the_excerpt(); ?></div>
          </article>
        <?php endwhile; ?>
        <?php the_posts_pagination(); ?>
      <?php else : ?>
        <article class="aio-article">
          <h2 class="aio-post-title">該当する記事がありません</h2>
          <p>別のキーワードで検索してみてください。</p>
        </article>
      <?php endif; ?>
    </div>
    <?php get_sidebar(); ?>
  </div>
</main>
<?php get_footer(); ?>
