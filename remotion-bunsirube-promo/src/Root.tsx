import "./index.css";
import { Composition } from "remotion";
import { BunsirubePromo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BunsirubeVertical"
        component={BunsirubePromo}
        durationInFrames={720}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ variant: "vertical" }}
      />
      <Composition
        id="BunsirubeHorizontal"
        component={BunsirubePromo}
        durationInFrames={720}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ variant: "horizontal" }}
      />
    </>
  );
};
