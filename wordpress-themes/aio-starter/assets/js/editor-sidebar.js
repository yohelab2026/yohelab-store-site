(function (wp) {
  if (!wp || !wp.plugins || !wp.editPost || !wp.element || !wp.components || !wp.data) {
    return;
  }

  const el = wp.element.createElement;
  const PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
  const TextareaControl = wp.components.TextareaControl;
  const CheckboxControl = wp.components.CheckboxControl;
  const Notice = wp.components.Notice;
  const useSelect = wp.data.useSelect;
  const useDispatch = wp.data.useDispatch;
  const registerPlugin = wp.plugins.registerPlugin;

  const fields = [
    ["reader", "誰に向けた記事か"],
    ["intent", "検索意図・知りたい答え"],
    ["conclusion", "最初に出す結論"],
    ["evidence", "根拠・比較・参考リンク"],
    ["caution", "注意点・向かない人"],
    ["cta", "最後に促す行動"],
  ];

  const checks = [
    ["conclusion", "上部に結論ボックスがある"],
    ["evidence", "根拠・比較・参考リンクがある"],
    ["caution", "注意点や向かない人を書いた"],
    ["faq", "FAQを入れた"],
    ["summary", "最後に要点まとめがある"],
    ["updated", "更新日と情報の鮮度を確認した"],
  ];

  function metaKey(field) {
    return "_aio_assistant_" + field;
  }

  function checkKey(field) {
    return "_aio_assistant_check_" + field;
  }

  function SidebarPanel() {
    const meta = useSelect(function (select) {
      return select("core/editor").getEditedPostAttribute("meta") || {};
    }, []);
    const editPost = useDispatch("core/editor").editPost;
    const score = checks.filter(function (item) {
      return meta[checkKey(item[0])] === "1";
    }).length;

    function updateMeta(key, value) {
      const next = {};
      next[key] = value;
      editPost({ meta: next });
    }

    return el(
      PluginDocumentSettingPanel,
      {
        name: "aio-starter-content-assistant",
        title: "AIO記事設計",
        className: "aio-starter-content-assistant",
        initialOpen: true,
      },
      el(
        Notice,
        { status: "success", isDismissible: false },
        "AIO準備度 " + score + "/" + checks.length
      ),
      el(
        "p",
        { style: { marginTop: "8px", color: "#646970" } },
        "記事を書く前に、読者・検索意図・結論・根拠を固定します。"
      ),
      fields.map(function (item) {
        return el(TextareaControl, {
          key: item[0],
          label: item[1],
          value: meta[metaKey(item[0])] || "",
          rows: 2,
          onChange: function (value) {
            updateMeta(metaKey(item[0]), value);
          },
        });
      }),
      el(
        "div",
        { style: { display: "grid", gap: "8px", marginTop: "10px" } },
        checks.map(function (item) {
          return el(CheckboxControl, {
            key: item[0],
            label: item[1],
            checked: meta[checkKey(item[0])] === "1",
            onChange: function (checked) {
              updateMeta(checkKey(item[0]), checked ? "1" : "");
            },
          });
        })
      )
    );
  }

  registerPlugin("aio-starter-content-assistant", {
    render: SidebarPanel,
    icon: "welcome-write-blog",
  });
})(window.wp);
