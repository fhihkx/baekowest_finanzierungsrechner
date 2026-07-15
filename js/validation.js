import { ALLOWED_FINANCING_TYPES, ALLOWED_SALUTATIONS, INPUT_LIMITS } from "./config.js";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MULTIPLE_SPACES = /\s{2,}/g;

const FIELD_RULES = Object.freeze({
  financingType: { required: true, allowedValues: ALLOWED_FINANCING_TYPES },
  salutation: { required: true, allowedValues: ALLOWED_SALUTATIONS },
  firstName: { required: true, maxLength: INPUT_LIMITS.nameMaxLength, pattern: /^[\p{L}][\p{L}\p{M}\s.'’-]{0,49}$/u },
  lastName: { required: true, maxLength: INPUT_LIMITS.nameMaxLength, pattern: /^[\p{L}][\p{L}\p{M}\s.'’-]{0,49}$/u },
  company: { required: true, maxLength: INPUT_LIMITS.companyMaxLength, pattern: /^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s.,&()+'’\-\/]{0,99}$/u },
  street: { required: true, maxLength: INPUT_LIMITS.streetMaxLength, pattern: /^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s.,'’\-\/]{0,149}$/u },
  postalCode: { required: true, maxLength: INPUT_LIMITS.postalCodeMaxLength, pattern: /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/ },
  city: { required: true, maxLength: INPUT_LIMITS.cityMaxLength, pattern: /^[\p{L}][\p{L}\p{M}\s.'’\-]{0,99}$/u },
  email: { required: true, maxLength: INPUT_LIMITS.emailMaxLength, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ },
  phone: { required: false, maxLength: INPUT_LIMITS.phoneMaxLength, pattern: /^[+()0-9\s\/-]{5,40}$/ },
});

export function normalizeText(value) {
  return String(value ?? "").replace(CONTROL_CHARS, "").replace(MULTIPLE_SPACES, " ").trim();
}

export function cleanText(value, maxLength = 250) {
  return normalizeText(value).slice(0, maxLength);
}

export function validateField(fieldName, rawValue) {
  const rule = FIELD_RULES[fieldName];
  if (!rule) return { valid: false, value: "", reason: "unknown_field" };
  const normalized = normalizeText(rawValue);
  if (rule.required && normalized.length === 0) return { valid: false, value: normalized, reason: "required" };
  if (!rule.required && normalized.length === 0) return { valid: true, value: "", reason: null };
  if (rule.allowedValues && !rule.allowedValues.includes(normalized)) return { valid: false, value: normalized, reason: "invalid_option" };
  if (rule.maxLength && normalized.length > rule.maxLength) return { valid: false, value: normalized, reason: "too_long" };
  if (rule.pattern && !rule.pattern.test(normalized)) return { valid: false, value: normalized, reason: "invalid_format" };
  return { valid: true, value: normalized, reason: null };
}

export function validateContactForm(rawValues) {
  const result = { valid: true, values: {}, errors: {} };
  for (const fieldName of Object.keys(FIELD_RULES)) {
    const field = validateField(fieldName, rawValues?.[fieldName]);
    result.values[fieldName] = field.value;
    if (!field.valid) {
      result.valid = false;
      result.errors[fieldName] = field.reason;
    }
  }
  return result;
}

export function makeSafeFilenamePart(value, fallback = "Kunde") {
  const cleaned = cleanText(value, 80)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}
