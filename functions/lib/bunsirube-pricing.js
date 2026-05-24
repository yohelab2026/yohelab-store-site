export const BUNSIRUBE_EARLY_PRICE_JPY = 5500;
export const BUNSIRUBE_FORMAL_PRICE_JPY = 8800;
export const BUNSIRUBE_FORMAL_RELEASE_AT = "2026-07-01T00:00:00+09:00";

export function isBunsirubeFormalPriceActive(now = Date.now()) {
  return new Date(now).getTime() >= Date.parse(BUNSIRUBE_FORMAL_RELEASE_AT);
}

export function getBunsirubePriceJpy(now = Date.now()) {
  return isBunsirubeFormalPriceActive(now)
    ? BUNSIRUBE_FORMAL_PRICE_JPY
    : BUNSIRUBE_EARLY_PRICE_JPY;
}
