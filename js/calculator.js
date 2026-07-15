import { ALLOWED_DURATIONS, ALLOWED_RESIDUALS, FINANCING_FACTORS, INPUT_LIMITS, PRICE_BANDS } from "./config.js";

export function normalizeDecimalInput(value) {
  return String(value ?? "")
    .replace(/\./g, "")
    .replace(/[^\d,]/g, "")
    .replace(/,{2,}/g, ",");
}

export function formatPriceInputValue(value) {
  const normalized = normalizeDecimalInput(value);
  const [integerRaw = "", ...decimalParts] = normalized.split(",");
  const integerPart = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalPart = decimalParts.join("").slice(0, 2);
  return decimalParts.length > 0 ? `${integerPart},${decimalPart}` : integerPart;
}

export function parseGermanNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value ?? "").trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0,00";
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
}

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function isAllowedDuration(duration) {
  return ALLOWED_DURATIONS.includes(String(duration));
}

export function isAllowedResidual(residual) {
  return ALLOWED_RESIDUALS.includes(String(residual));
}

export function getPriceBand(price) {
  const parsed = typeof price === "number" ? price : parseGermanNumber(price);
  if (!Number.isFinite(parsed) || parsed < INPUT_LIMITS.priceMin || parsed > INPUT_LIMITS.priceMax) return null;
  if (parsed <= 25000) return PRICE_BANDS.SMALL;
  if (parsed <= 100000) return PRICE_BANDS.MEDIUM;
  return PRICE_BANDS.LARGE;
}

export function getFinancingFactor(price, residual, duration) {
  const band = getPriceBand(price);
  const residualKey = String(residual ?? "");
  const durationKey = String(duration ?? "");
  if (!band || !isAllowedResidual(residualKey) || !isAllowedDuration(durationKey)) return null;
  return FINANCING_FACTORS[band]?.[residualKey]?.[durationKey] ?? null;
}

export function isCombinationAvailable(price, residual, duration) {
  return getFinancingFactor(price, residual, duration) !== null;
}

export function getAvailableDurationsForPrice(price) {
  const band = getPriceBand(price);
  if (!band) return ALLOWED_DURATIONS;
  return ALLOWED_DURATIONS.filter((duration) =>
    ALLOWED_RESIDUALS.some((residual) => isCombinationAvailable(price, residual, duration))
  );
}

export function getAvailableResiduals(price, duration) {
  const durationKey = String(duration ?? "");
  if (!getPriceBand(price) || !isAllowedDuration(durationKey)) return ALLOWED_RESIDUALS;
  return ALLOWED_RESIDUALS.filter((residual) => isCombinationAvailable(price, residual, durationKey));
}

export function getSafeDurationForPrice(price, currentDuration) {
  const allowed = getAvailableDurationsForPrice(price);
  return allowed.includes(String(currentDuration)) ? String(currentDuration) : "";
}

export function getSafeResidual(price, duration, currentResidual) {
  const allowed = getAvailableResiduals(price, duration);
  return allowed.includes(String(currentResidual)) ? String(currentResidual) : "";
}

export function validatePrice(price) {
  const parsed = parseGermanNumber(price);
  if (parsed === null) return { valid: false, value: null, reason: "invalid_number" };
  if (parsed < INPUT_LIMITS.priceMin) return { valid: false, value: parsed, reason: "below_minimum" };
  if (parsed > INPUT_LIMITS.priceMax) return { valid: false, value: parsed, reason: "above_maximum" };
  return { valid: true, value: parsed, reason: null };
}

export function calculateRate({ price, duration, residual }) {
  const priceValidation = validatePrice(price);
  const durationKey = String(duration ?? "");
  const residualKey = String(residual ?? "");
  const priceBand = priceValidation.valid ? getPriceBand(priceValidation.value) : null;
  const factor = priceValidation.valid ? getFinancingFactor(priceValidation.value, residualKey, durationKey) : null;
  const base = {
    price: priceValidation.value,
    priceBand,
    duration: durationKey,
    residual: residualKey,
    factor,
    rate: null,
    residualValue: null,
  };
  if (!priceValidation.valid) return { valid: false, reason: priceValidation.reason, ...base };
  if (!isAllowedDuration(durationKey)) return { valid: false, reason: "invalid_duration", ...base };
  if (!isAllowedResidual(residualKey)) return { valid: false, reason: "invalid_residual", ...base };
  if (factor === null) return { valid: false, reason: "unavailable_combination", ...base };
  const rate = roundMoney(priceValidation.value * (factor / 100));
  const residualValue = roundMoney(priceValidation.value * (Number(residualKey) / 100));
  return { valid: true, reason: null, ...base, rate, residualValue };
}
