import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

type Variant = "vertical" | "horizontal";

type Shot = {
  label: string;
  title: string;
  body: string;
  image: string;
};

const shots: Shot[] = [
  {
    label: "01 / SETUP",
    title: "入れたら、すぐ書き始める",
    body: "WordPressに文標を入れて、記事型を選ぶだけ。",
    image: "bunsirube/install.png",
  },
  {
    label: "02 / WRITE",
    title: "比較・レビュー・FAQの型",
    body: "短い答え、根拠、出典、CTAまで迷わず置ける。",
    image: "bunsirube/writing.png",
  },
  {
    label: "03 / CHECK",
    title: "押された導線を見る",
    body: "CTA、比較表、広告リンクのクリックを小さく確認。",
    image: "bunsirube/route-check.png",
  },
];

const features = [
  "7種類の記事型",
  "FAQ + JSON-LD",
  "比較表カード",
  "CTAボックス",
  "自動ブログカード",
  "公開前チェック",
];

const navy = "#071833";
const ink = "#0d1b34";
const green = "#079579";
const paper = "#f7fbff";

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

const fadeOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

const entrance = (frame: number, delay: number) =>
  spring({
    frame: frame - delay,
    fps: 30,
    config: {
      damping: 20,
      stiffness: 90,
      mass: 0.9,
    },
  });

const sceneOpacity = (frame: number, start: number, end: number) =>
  Math.min(fade(frame, start, start + 18), fadeOut(frame, end - 18, end));

const pillStyle = (variant: Variant): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: variant === "vertical" ? 10 : 14,
  borderRadius: 999,
  padding: variant === "vertical" ? "12px 18px" : "14px 22px",
  background: "rgba(255,255,255,0.86)",
  border: "2px solid rgba(7,149,121,0.16)",
  boxShadow: "0 18px 45px rgba(7, 24, 51, 0.08)",
  color: green,
  fontSize: variant === "vertical" ? 30 : 28,
  fontWeight: 800,
});

const screenStyle = (variant: Variant, lift: number): React.CSSProperties => ({
  borderRadius: variant === "vertical" ? 44 : 38,
  border: "2px solid rgba(13, 80, 110, 0.14)",
  boxShadow: "0 34px 80px rgba(7, 24, 51, 0.18)",
  overflow: "hidden",
  transform: `translateY(${lift}px) rotate(-1deg)`,
  background: "white",
});

const FeatureCard: React.FC<{
  children: React.ReactNode;
  index: number;
  variant: Variant;
}> = ({ children, index, variant }) => {
  const frame = useCurrentFrame();
  const s = entrance(frame, 260 + index * 5);
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
        padding: variant === "vertical" ? "20px 24px" : "20px 28px",
        borderRadius: 26,
        color: navy,
        background: "rgba(255,255,255,0.9)",
        border: "2px solid rgba(45,134,243,0.12)",
        fontSize: variant === "vertical" ? 30 : 28,
        fontWeight: 800,
        boxShadow: "0 20px 45px rgba(7,24,51,0.07)",
      }}
    >
      <span style={{ color: green, marginRight: 10 }}>✓</span>
      {children}
    </div>
  );
};

const Hero: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const title = entrance(frame, 4);
  const sub = entrance(frame, 20);
  const isV = variant === "vertical";

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, 0, 155),
        padding: isV ? "112px 76px" : "90px 112px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...pillStyle(variant),
          width: "fit-content",
          transform: `translateY(${interpolate(title, [0, 1], [24, 0])}px)`,
          opacity: title,
        }}
      >
        <span>文標（ぶんしるべ）</span>
      </div>
      <h1
        style={{
          margin: isV ? "48px 0 0" : "38px 0 0",
          maxWidth: isV ? 920 : 1180,
          color: navy,
          fontSize: isV ? 82 : 86,
          lineHeight: 1.08,
          letterSpacing: "-0.06em",
          fontWeight: 950,
          opacity: title,
          transform: `translateY(${interpolate(title, [0, 1], [42, 0])}px)`,
        }}
      >
        AI検索時代の記事構造を、
        <br />
        WordPressで迷わず作る。
      </h1>
      <p
        style={{
          margin: isV ? "40px 0 0" : "34px 0 0",
          maxWidth: isV ? 880 : 1050,
          color: "#4e607f",
          fontSize: isV ? 37 : 36,
          lineHeight: 1.7,
          fontWeight: 700,
          opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [36, 0])}px)`,
        }}
      >
        比較記事・レビュー記事・FAQ記事を、
        <br />
        短い答え・根拠・出典・CTAまで整えながら書き始められます。
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: isV ? 18 : 20,
          marginTop: isV ? 46 : 42,
          opacity: fade(frame, 42, 68),
        }}
      >
        {["7記事型", "FAQ", "比較表", "CTA", "導線確認"].map((tag) => (
          <div
            key={tag}
            style={{
              padding: isV ? "16px 22px" : "15px 24px",
              borderRadius: 999,
              background: "rgba(7,149,121,0.1)",
              color: "#006d59",
              fontSize: isV ? 28 : 26,
              fontWeight: 900,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FlowScene: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const isV = variant === "vertical";
  const active = Math.min(2, Math.max(0, Math.floor((frame - 145) / 78)));
  const shot = shots[active];
  const shotProgress = entrance(frame, 150 + active * 78);

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, 130, 410),
        padding: isV ? "92px 64px" : "72px 88px",
        flexDirection: isV ? "column" : "row",
        gap: isV ? 52 : 64,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ flex: isV ? "0 0 auto" : 0.92 }}>
        <div style={{ ...pillStyle(variant), width: "fit-content" }}>
          3ステップで、記事の形まで
        </div>
        <h2
          style={{
            color: navy,
            fontSize: isV ? 66 : 68,
            lineHeight: 1.12,
            letterSpacing: "-0.055em",
            margin: isV ? "34px 0 0" : "30px 0 0",
            fontWeight: 950,
          }}
        >
          {shot.title}
        </h2>
        <p
          style={{
            color: "#536783",
            fontSize: isV ? 34 : 32,
            lineHeight: 1.65,
            fontWeight: 700,
            marginTop: 24,
          }}
        >
          {shot.body}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isV ? "1fr" : "1fr",
            gap: 16,
            marginTop: 38,
          }}
        >
          {shots.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 22px",
                borderRadius: 24,
                background:
                  index === active
                    ? "linear-gradient(135deg, #0aa88a, #2d86f3)"
                    : "rgba(255,255,255,0.86)",
                color: index === active ? "white" : "#52647e",
                fontSize: isV ? 26 : 24,
                fontWeight: 900,
                boxShadow:
                  index === active
                    ? "0 20px 45px rgba(7,149,121,0.22)"
                    : "0 14px 32px rgba(7,24,51,0.07)",
              }}
            >
              <span>{item.label}</span>
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          flex: isV ? "0 0 auto" : 1.08,
          width: isV ? "100%" : undefined,
          ...screenStyle(
            variant,
            interpolate(shotProgress, [0, 1], [38, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          ),
          opacity: interpolate(shotProgress, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Img
          src={staticFile(shot.image)}
          style={{
            display: "block",
            width: "100%",
            height: isV ? 590 : 645,
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const FeatureScene: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const isV = variant === "vertical";

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, 390, 585),
        padding: isV ? "96px 64px" : "76px 92px",
        justifyContent: "center",
      }}
    >
      <div style={{ ...pillStyle(variant), width: "fit-content" }}>
        有名テーマの便利さを、記事型に絞る
      </div>
      <h2
        style={{
          margin: isV ? "42px 0 0" : "34px 0 0",
          color: navy,
          fontSize: isV ? 70 : 70,
          lineHeight: 1.12,
          letterSpacing: "-0.055em",
          fontWeight: 950,
          maxWidth: isV ? 880 : 1260,
        }}
      >
        デザインより先に、
        <br />
        記事の中身と行動導線を整える。
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isV ? "1fr" : "repeat(3, 1fr)",
          gap: isV ? 18 : 22,
          marginTop: isV ? 48 : 46,
          maxWidth: isV ? 900 : 1560,
        }}
      >
        {features.map((feature, index) => (
          <FeatureCard key={feature} index={index} variant={variant}>
            {feature}
          </FeatureCard>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Closing: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const isV = variant === "vertical";
  const show = entrance(frame, 584);

  return (
    <AbsoluteFill
      style={{
        opacity: sceneOpacity(frame, 560, 720),
        padding: isV ? "94px 70px" : "82px 112px",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: isV ? 880 : 1360,
          borderRadius: isV ? 58 : 52,
          background: "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(238,249,255,0.92))",
          border: "2px solid rgba(45,134,243,0.16)",
          boxShadow: "0 34px 90px rgba(7,24,51,0.14)",
          padding: isV ? "72px 58px" : "68px 86px",
          transform: `translateY(${interpolate(show, [0, 1], [44, 0])}px)`,
          opacity: show,
        }}
      >
        <div style={{ ...pillStyle(variant), margin: "0 auto" }}>
          文標
        </div>
        <h2
          style={{
            color: navy,
            fontSize: isV ? 72 : 78,
            lineHeight: 1.1,
            letterSpacing: "-0.06em",
            fontWeight: 950,
            margin: isV ? "38px 0 0" : "34px 0 0",
          }}
        >
          AI検索時代の記事構造を、
          <br />
          小さく、わかりやすく。
        </h2>
        <p
          style={{
            color: "#51647f",
            fontSize: isV ? 34 : 34,
            lineHeight: 1.65,
            fontWeight: 800,
            margin: "32px auto 0",
            maxWidth: isV ? 760 : 1080,
          }}
        >
          比較記事・レビュー記事・FAQ記事を迷わず書き始めるための
          軽量WordPressテーマ。
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: isV ? "column" : "row",
            gap: 20,
            justifyContent: "center",
            marginTop: 44,
          }}
        >
          <div
            style={{
              borderRadius: 26,
              padding: isV ? "24px 28px" : "24px 34px",
              background: "linear-gradient(135deg, #0a9d82, #2d86f3)",
              color: "white",
              fontSize: isV ? 34 : 32,
              fontWeight: 950,
              boxShadow: "0 24px 50px rgba(45,134,243,0.24)",
            }}
          >
            yohelab.com/lp/bunsirube/
          </div>
          <div
            style={{
              borderRadius: 26,
              padding: isV ? "24px 28px" : "24px 34px",
              background: "white",
              color: ink,
              border: "2px solid rgba(7,24,51,0.12)",
              fontSize: isV ? 34 : 32,
              fontWeight: 950,
            }}
          >
            ¥5,500（税込）
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 28,
          color: "#6d7d96",
          fontSize: isV ? 22 : 22,
          fontWeight: 700,
        }}
      >
        Google AI Overviews等への表示を保証するものではありません。
      </div>
    </AbsoluteFill>
  );
};

export const BunsirubePromo: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isV = variant === "vertical";
  const drift = Math.sin(frame / 36);

  return (
    <AbsoluteFill
      style={{
        fontFamily:
          '"Yu Gothic", "YuGothic", "Hiragino Sans", "Noto Sans JP", sans-serif',
        background: paper,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 12% 18%, rgba(7,149,121,0.18), transparent 32%), radial-gradient(circle at 88% 8%, rgba(45,134,243,0.18), transparent 30%), linear-gradient(180deg, #f7fbff 0%, #eef8ff 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: isV ? 540 : 720,
          height: isV ? 540 : 720,
          borderRadius: "50%",
          background: "rgba(7,149,121,0.1)",
          filter: "blur(4px)",
          left: width * 0.64 + drift * 30,
          top: height * 0.12 + drift * 18,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: isV ? 420 : 520,
          height: isV ? 420 : 520,
          borderRadius: "50%",
          background: "rgba(45,134,243,0.1)",
          left: -120 + drift * 24,
          bottom: -120 + drift * 16,
        }}
      />
      <Hero variant={variant} />
      <FlowScene variant={variant} />
      <FeatureScene variant={variant} />
      <Closing variant={variant} />
    </AbsoluteFill>
  );
};
