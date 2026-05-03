import { makeSerial, signPayload } from "../lib/entitlements.js";
import { fetchStripePurchaseStatus } from "../lib/stripe-purchase.js";

export async function onRequestGet(context) {
  return handleLicenseRequest(context, "GET");
}

export async function onRequestPost(context) {
  return handleLicenseRequest(context, "POST");
}

async function handleLicenseRequest(context, method) {
  try {
    const input = method === "POST"
      ? await readBody(context.request)
      : Object.fromEntries(new URL(context.request.url).searchParams);
    const serial = (input.serial || "").trim().toUpperCase();
    const email = (input.email || "").trim().toLowerCase();
    const purchaseId = (input.purchase || "").trim();
    const product = "wordpress-theme";

    if (!serial || !email || !purchaseId) {
      return json({ active: false, reason: "missing_fields" });
    }

    const expected = await makeSerial({ product, email, subscriptionId: purchaseId }, context.env);
    if (serial !== expected) {
      return json({ active: false, reason: "invalid_serial" });
    }

    const status = await fetchStripePurchaseStatus(purchaseId, context.env);
    const active = status.active;
    const downloadToken = active
      ? await signPayload({
          v: 1,
          kind: "theme_download",
          product,
          serial,
          email,
          purchaseId,
          exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        }, context.env.ACCESS_SECRET)
      : "";

    return json({
      active,
      product,
      serial,
      downloadToken,
      customerEmail: email,
      purchaseStatus: status.status,
      currentPeriodEnd: status.currentPeriodEnd,
    });
  } catch (error) {
    return json({ active: false, error: error.message }, 200);
  }
}

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return request.json();
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
