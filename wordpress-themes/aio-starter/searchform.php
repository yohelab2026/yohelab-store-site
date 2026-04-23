<?php
/**
 * Custom search form.
 *
 * @package AIO_Starter
 */
?>
<form role="search" method="get" class="aio-search-form" action="<?php echo esc_url(home_url('/')); ?>">
  <label class="screen-reader-text" for="aio-search-field"><?php esc_html_e('Search for:', 'aio-starter'); ?></label>
  <input type="search" id="aio-search-field" class="aio-search-input" placeholder="<?php esc_attr_e('キーワードを入力', 'aio-starter'); ?>" value="<?php echo esc_attr(get_search_query()); ?>" name="s" />
  <button type="submit" class="aio-btn"><?php esc_html_e('検索', 'aio-starter'); ?></button>
</form>
