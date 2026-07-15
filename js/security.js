import { SECURITY } from "./config.js";

const pageOpenedAt = Date.now();
let lastMemoryAttempt = 0;

function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked in privacy mode; memory protection still applies.
  }
}

export function checkEmbeddingPolicy() {
  if (window.self === window.top) return { allowed: true, reason: null };
  if (!document.referrer) return { allowed: true, reason: "missing_referrer" };
  try {
    const origin = new URL(document.referrer).origin;
    return SECURITY.allowedEmbedOrigins.includes(origin)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: "unauthorized_parent" };
  } catch {
    return { allowed: false, reason: "invalid_referrer" };
  }
}

export function enforceEmbeddingPolicy() {
  const result = checkEmbeddingPolicy();
  if (result.allowed) return true;
  document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:24px;color:#222"><h1 style="font-size:20px">Einbettung nicht erlaubt</h1><p>Dieses interne Tool darf nur über die freigegebene BÄKO WEST Website geladen werden.</p></main>';
  return false;
}

export function checkSubmissionGuard() {
  const now = Date.now();

  if (now - pageOpenedAt < SECURITY.minimumFormFillMs) {
    return { allowed: false, reason: "too_fast", retryAfterMs: SECURITY.minimumFormFillMs - (now - pageOpenedAt) };
  }

  if (now - lastMemoryAttempt < SECURITY.clickDebounceMs) {
    return { allowed: false, reason: "debounce", retryAfterMs: SECURITY.clickDebounceMs - (now - lastMemoryAttempt) };
  }

  const lastSuccess = Number(safeRead(SECURITY.successStorageKey, 0));
  if (lastSuccess && now - lastSuccess < SECURITY.submitCooldownMs) {
    return { allowed: false, reason: "cooldown", retryAfterMs: SECURITY.submitCooldownMs - (now - lastSuccess) };
  }

  const attempts = safeRead(SECURITY.attemptStorageKey, [])
    .map(Number)
    .filter((value) => Number.isFinite(value) && now - value < SECURITY.submissionWindowMs);

  if (attempts.length >= SECURITY.maxSubmissionsPerWindow) {
    const retryAfterMs = Math.max(1000, SECURITY.submissionWindowMs - (now - attempts[0]));
    return { allowed: false, reason: "window_limit", retryAfterMs };
  }

  lastMemoryAttempt = now;
  attempts.push(now);
  safeWrite(SECURITY.attemptStorageKey, attempts);
  return { allowed: true, reason: null, retryAfterMs: 0 };
}

export function markSubmissionSuccess() {
  safeWrite(SECURITY.successStorageKey, Date.now());
}

export function formatRetryMessage(result) {
  const seconds = Math.max(1, Math.ceil((result?.retryAfterMs || 1000) / 1000));
  switch (result?.reason) {
    case "too_fast": return `Bitte prüfen Sie Ihre Angaben und warten Sie noch ${seconds} Sekunden.`;
    case "debounce": return `Bitte warten Sie ${seconds} Sekunden, bevor Sie erneut klicken.`;
    case "cooldown": return `Ein Angebot wurde gerade erstellt. Bitte warten Sie noch ${seconds} Sekunden.`;
    case "window_limit": return `Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es in etwa ${Math.ceil(seconds / 60)} Minuten erneut.`;
    default: return "Die Anfrage konnte aus Sicherheitsgründen noch nicht verarbeitet werden.";
  }
}
