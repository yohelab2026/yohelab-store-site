<?php
/**
 * JSON-LD output.
 *
 * @package AIO_Starter
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_head', 'aio_starter_json_ld', 30);
function aio_starter_json_ld() {
    $site_name = get_bloginfo('name');
    $site_desc = get_bloginfo('description');

    $website = array(
        '@type' => 'WebSite',
        '@id'   => home_url('/#website'),
        'url'   => home_url('/'),
        'name'  => $site_name,
        // AIO・LLMがサイト概要を把握しやすくする
        'potentialAction' => array(
            '@type'       => 'SearchAction',
            'target'      => array(
                '@type'       => 'EntryPoint',
                'urlTemplate' => home_url('/?s={search_term_string}'),
            ),
            'query-input' => 'required name=search_term_string',
        ),
    );
    if ($site_desc) {
        $website['description'] = $site_desc;
    }

    $graph = array($website);

    $publisher = array(
        '@type' => 'Organization',
        'name'  => get_bloginfo('name'),
    );

    $logo_id = get_theme_mod('custom_logo');
    if ($logo_id) {
        $logo = wp_get_attachment_image_src($logo_id, 'full');
        if (!empty($logo[0])) {
            $publisher['logo'] = array(
                '@type' => 'ImageObject',
                'url'   => $logo[0],
            );
        }
    }

    if (is_singular()) {
        $post = get_post();
        $author_id = (int) $post->post_author;

        $graph[] = array(
            '@type' => 'Person',
            '@id'   => get_author_posts_url($author_id) . '#person',
            'name'  => get_the_author_meta('display_name', $author_id),
            'url'   => get_author_posts_url($author_id),
        );

        $graph[] = array(
            '@type'         => is_singular('post') ? 'BlogPosting' : 'Article',
            '@id'           => get_permalink($post) . '#article',
            'headline'      => get_the_title($post),
            'description'   => aio_starter_excerpt($post, 180),
            'datePublished' => get_the_date(DATE_W3C, $post),
            'dateModified'  => get_the_modified_date(DATE_W3C, $post),
            'author'        => array('@id' => get_author_posts_url($author_id) . '#person'),
            'publisher'     => $publisher,
            'mainEntityOfPage' => get_permalink($post),
        );

        if (has_post_thumbnail($post)) {
            $graph[count($graph) - 1]['image'] = wp_get_attachment_image_url(get_post_thumbnail_id($post), 'large');
        }

        $graph[] = aio_starter_breadcrumb_schema($post);

        $faq = aio_starter_extract_faq_items($post->post_content);
        if ($faq) {
            $graph[] = array(
                '@type' => 'FAQPage',
                '@id'   => get_permalink($post) . '#faq',
                'mainEntity' => array_map(function ($item) {
                    return array(
                        '@type' => 'Question',
                        'name'  => $item['question'],
                        'acceptedAnswer' => array(
                            '@type' => 'Answer',
                            'text'  => $item['answer'],
                        ),
                    );
                }, $faq),
            );
        }

    } elseif (is_category() || is_tag() || is_tax()) {
        // カテゴリー・タグ・タクソノミーアーカイブ
        $term      = get_queried_object();
        $term_url  = get_term_link($term);
        $term_name = $term instanceof WP_Term ? $term->name : get_bloginfo('name');

        $graph[] = array(
            '@type' => 'BreadcrumbList',
            '@id'   => (is_string($term_url) ? $term_url : home_url('/')) . '#breadcrumb',
            'itemListElement' => array(
                array(
                    '@type'    => 'ListItem',
                    'position' => 1,
                    'name'     => get_bloginfo('name'),
                    'item'     => home_url('/'),
                ),
                array(
                    '@type'    => 'ListItem',
                    'position' => 2,
                    'name'     => $term_name,
                    'item'     => is_string($term_url) ? $term_url : home_url('/'),
                ),
            ),
        );

        // CollectionPage でアーカイブ自体を明示
        $graph[] = array(
            '@type'     => 'CollectionPage',
            '@id'       => is_string($term_url) ? $term_url . '#page' : home_url('/#page'),
            'name'      => $term_name,
            'url'       => is_string($term_url) ? $term_url : home_url('/'),
            'publisher' => $publisher,
        );

    } elseif (is_author()) {
        // 著者アーカイブ
        $author    = get_queried_object();
        $author_id = $author instanceof WP_User ? (int) $author->ID : 0;
        $author_url = get_author_posts_url($author_id);

        $graph[] = array(
            '@type' => 'BreadcrumbList',
            '@id'   => $author_url . '#breadcrumb',
            'itemListElement' => array(
                array(
                    '@type'    => 'ListItem',
                    'position' => 1,
                    'name'     => get_bloginfo('name'),
                    'item'     => home_url('/'),
                ),
                array(
                    '@type'    => 'ListItem',
                    'position' => 2,
                    'name'     => $author instanceof WP_User ? $author->display_name : '',
                    'item'     => $author_url,
                ),
            ),
        );

        if ($author_id) {
            $graph[] = array(
                '@type' => 'Person',
                '@id'   => $author_url . '#person',
                'name'  => $author instanceof WP_User ? $author->display_name : '',
                'url'   => $author_url,
            );
        }

    } elseif (is_date()) {
        // 日付アーカイブ
        $archive_url  = get_year_link(get_query_var('year'));
        $archive_name = get_the_archive_title();

        $graph[] = array(
            '@type' => 'BreadcrumbList',
            '@id'   => $archive_url . '#breadcrumb',
            'itemListElement' => array(
                array(
                    '@type'    => 'ListItem',
                    'position' => 1,
                    'name'     => get_bloginfo('name'),
                    'item'     => home_url('/'),
                ),
                array(
                    '@type'    => 'ListItem',
                    'position' => 2,
                    'name'     => $archive_name,
                    'item'     => $archive_url,
                ),
            ),
        );
    }

    echo '<script type="application/ld+json">' . wp_json_encode(array(
        '@context' => 'https://schema.org',
        '@graph'   => array_values(array_filter($graph)),
    ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
}

function aio_starter_breadcrumb_schema($post) {
    $items = array(
        array(
            '@type' => 'ListItem',
            'position' => 1,
            'name' => get_bloginfo('name'),
            'item' => home_url('/'),
        ),
    );

    $position = 2;
    if (is_singular('post')) {
        $categories = get_the_category($post->ID);
        if (!empty($categories)) {
            $cat = $categories[0];
            $items[] = array(
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $cat->name,
                'item' => get_category_link($cat),
            );
        }
    }

    $items[] = array(
        '@type' => 'ListItem',
        'position' => $position,
        'name' => get_the_title($post),
        'item' => get_permalink($post),
    );

    return array(
        '@type' => 'BreadcrumbList',
        '@id'   => get_permalink($post) . '#breadcrumb',
        'itemListElement' => $items,
    );
}

function aio_starter_extract_faq_items($content) {
    $items = array();
    if (preg_match_all('/\[aio_faq\s+question="([^"]+)"\](.*?)\[\/aio_faq\]/is', $content, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $items[] = array(
                'question' => wp_strip_all_tags(shortcode_unautop($match[1])),
                'answer'   => wp_strip_all_tags(shortcode_unautop($match[2])),
            );
        }
    }
    return $items;
}
