=== AIO Starter ===
Contributors: yohelab
Requires at least: 6.5
Tested up to: 6.9.4
Requires PHP: 8.0
Stable tag: 0.1.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A lightweight WordPress theme for beginner bloggers who want AIO/LLMO-ready structure, FAQ schema, author signals, llms.txt, and simple analytics.

== Description ==

AIO Starter is built around three goals: keep the front end light, make common AIO/LLMO settings easy, and reduce the number of extra plugins needed for a small content site.

Core features:

* Article, WebSite, Person, BreadcrumbList, and FAQPage JSON-LD output.
* FAQ, summary, comparison, citation, table of contents, and author shortcodes.
* Block patterns for comparison posts, reviews, case introductions, AI-search FAQ posts, rankings, and product introductions.
* Lightweight AIO writing memo on post and page edit screens.
* llms.txt endpoint.
* Simple internal analytics and optional GA4/Google Search Console settings.
* Transient-based page cache option.
* Main color and text color controls in the theme settings screen.

== Installation ==

1. Upload the aio-starter theme folder or ZIP file from Appearance > Themes > Add New.
2. Activate AIO Starter.
3. Open Appearance > AIO Starter and set the site profile, analytics mode, colors, and AIO options.

== Frequently Asked Questions ==

= Is this a plugin replacement? =

No. It reduces the need for common SEO/AIO helper plugins on small sites, but payment, form delivery, advanced security, backup, and full cache/CDN features should remain outside the theme.

= Which plugins are usually unnecessary? =

Simple FAQ schema, table of contents, GA4 tag insertion, Search Console verification, llms.txt generation, and simple analytics plugins often overlap with this theme.

= Which plugins can still be useful? =

Backup, security, forms, commerce/payment, image optimization, and spam protection can still be useful because they are outside the theme's main responsibility.

= Does it require Google Analytics? =

No. Internal lightweight analytics can be enabled by itself. GA4 can also be connected from the settings screen.

== Changelog ==

= 0.1.3 =
* Added WordPress standard theme supports and styles.
* Moved widget registration to widgets_init.
* Replaced file-based cache with transient-based cache.
* Added paginated post/page links and tag output.

= 0.1.2 =
* Added buyer readiness copy and support details.

= 0.1.0 =
* Initial public starter build.
