/**
 * /blog/admin/ へのアクセスをミドルウェアで保護する。
 *
 * ① 最初のアクセス時に ?open=TOKEN を要求する（TOKENはCloudflare環境変数 ADMIN_KEY）
 * ② 正しいTOKENなら HttpOnly セッションCookieを発行してページを表示
 * ③ Cookie があれば ?open= なしでも通す
 * ④ どちらもなければ 404 を返す（adminページの存在を隠す）
 *
 * 環境変数 ADMIN_KEY が未設定の場合はページを公開しない（デプロイ後に必ず設定する）。
 */

const COOKIE_NAME = "yh_adm";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8時間

export async function onRequest(context) {
  const adminKey = String(context.env.ADMIN_KEY || "").trim();

  // ADMIN_KEY 未設定なら完全ブロック
  if (!adminKey) {
    return notFound();
  }

  const url = new URL(context.request.url);
  const cookieHeader = context.request.headers.get("Cookie") || "";
  const sessionValid = cookieHeader
    .split(";")
    .some((c) => c.trim() === `${COOKIE_NAME}=1`);

  if (sessionValid) {
    // Cookie 認証済み → そのままページを返す
    return context.next();
  }

  const openParam = url.searchParams.get("open") || "";
  if (openParam === adminKey) {
    // 正しいキーが来た → Cookie を発行してリダイレクト（URLからキーを消す）
    const cleanUrl = new URL(context.request.url);
    cleanUrl.searchParams.delete("open");

    const res = Response.redirect(cleanUrl.toString(), 302);
    const headers = new Headers(res.headers);
    headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=1; Path=/blog/admin; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
    );
    return new Response(null, { status: 302, headers });
  }

  // キーなし・Cookie なし → 404
  return notFound();
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}
