<?php
/**
 * Header.
 *
 * @package AIO_Starter
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="aio-skip-link" href="#content">本文へスキップ</a>
<header class="aio-header">
  <div class="aio-wrap aio-header-inner">
    <a class="aio-brand" href="<?php echo esc_url(home_url('/')); ?>">
      <?php if (has_custom_logo()) : ?>
        <?php the_custom_logo(); ?>
      <?php endif; ?>
      <span><?php bloginfo('name'); ?></span>
    </a>
    <nav class="aio-nav" aria-label="<?php esc_attr_e('Primary menu', 'aio-starter'); ?>">
      <?php
      wp_nav_menu(array(
          'theme_location' => 'primary',
          'container'      => false,
          'fallback_cb'    => false,
          'items_wrap'     => '<ul>%3$s</ul>',
      ));
      ?>
    </nav>
  </div>
</header>
