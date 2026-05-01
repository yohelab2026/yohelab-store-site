import { researchWriterAppSvg } from "../generated/research-writer-app-svg.js";

export async function onRequest() {
  return new Response(researchWriterAppSvg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
