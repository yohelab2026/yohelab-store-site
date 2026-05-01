import { themeUpdateJson } from "../../generated/theme-update.js";

export async function onRequest() {
  return new Response(themeUpdateJson, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
