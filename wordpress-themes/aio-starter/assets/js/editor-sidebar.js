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
    ["reader", "この記事を読む人"],
    ["intent", "この記事で答えること"],
    ["conclusion", "先に言いたい結論"],
    ["evidence", "理由・比較・参考リンク"],
    ["caution", "注意点"],
    ["cta", "最後にしてほしいこと"],
  ];

  const checks = [
    ["conclusion", "最初に答えを書いた"],
    ["evidence", "理由や比較を書いた"],
    ["caution", "注意点を書いた"],
    ["faq", "よくある質問を入れた"],
    ["summary", "最後にまとめを書いた"],
    ["updated", "情報が古くないか見た"],
  ];

  const placeholders = {
    reader: "例：副業でブログを始めたい人",
    intent: "例：どのテーマを選べばいいか",
    conclusion: "例：最初は軽くて設定が少ないテーマで十分",
    evidence: "例：表示速度、設定項目、プラグイン数を比較",
    caution: "例：検索順位や売上は保証できない",
    cta: "例：無料版を試す、ZIPをダウンロードする",
  };

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
        "むずかしく考えず、この記事の答えを先に決めるためのメモです。"
      ),
      fields.map(function (item) {
        return el(TextareaControl, {
          key: item[0],
          label: item[1],
          placeholder: placeholders[item[0]],
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
