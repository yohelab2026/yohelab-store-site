(function (wp) {
  if (!wp || !wp.plugins || !wp.editPost || !wp.element || !wp.components || !wp.data) {
    return;
  }

  const el = wp.element.createElement;
  const PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
  const TextareaControl = wp.components.TextareaControl;
  const CheckboxControl = wp.components.CheckboxControl;
  const SelectControl = wp.components.SelectControl;
  const Notice = wp.components.Notice;
  const useSelect = wp.data.useSelect;
  const useDispatch = wp.data.useDispatch;
  const registerPlugin = wp.plugins.registerPlugin;

  const articleTypes = [
    ["basic", "基本記事"],
    ["compare", "比較記事"],
    ["review", "レビュー記事"],
    ["ranking", "ランキング記事"],
    ["faq", "FAQ記事"],
    ["product", "商品紹介"],
  ];

  const typeHints = {
    basic: "結論、理由、注意点、FAQの順で書く。",
    compare: "先におすすめを出し、比較表と選び方を書く。",
    review: "使った感想、良い点、注意点、向いている人を書く。",
    ranking: "順位の理由と、選び方の基準を先に書く。",
    faq: "質問ごとに短く答え、最後に注意点をまとめる。",
    product: "誰向けの商品か、特徴、購入前の注意点を書く。",
  };

  const fields = [
    ["intent", "この記事で答えること"],
    ["conclusion", "先に出す答え"],
    ["evidence", "理由・比較・参考リンク"],
    ["caution", "注意点・補足"],
  ];

  const checks = [
    ["conclusion", "最初に答えがある"],
    ["evidence", "理由・比較がある"],
    ["caution", "注意点がある"],
    ["faq", "FAQがある"],
    ["summary", "最後にまとめがある"],
    ["updated", "情報が古くない"],
  ];

  const placeholders = {
    intent: "例：どれを選べばいいか",
    conclusion: "例：初心者は軽くて設定が少ないものがいい",
    evidence: "例：表示速度、設定項目、プラグイン数を比較",
    caution: "例：順位や売上は保証できない",
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
        "記事タイプを選んで、答え・理由・注意点だけ先に決めます。"
      ),
      el(SelectControl, {
        label: "記事タイプ",
        value: meta[metaKey("type")] || "basic",
        options: articleTypes.map(function (item) {
          return { value: item[0], label: item[1] };
        }),
        onChange: function (value) {
          updateMeta(metaKey("type"), value);
        },
      }),
      el(
        "p",
        {
          style: {
            marginTop: "-6px",
            padding: "8px 10px",
            background: "#f6f7f7",
            borderRadius: "8px",
            color: "#50575e",
          },
        },
        typeHints[meta[metaKey("type")] || "basic"]
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
