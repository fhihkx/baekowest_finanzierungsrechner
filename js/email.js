import { formatCurrency } from "./calculator.js";


const EMAILJS_CONFIG = Object.freeze({
  publicKey: "8TINjTh9gJ09Ett0t",
  serviceId: "service_nn8cgva",
  templateId: "template_ib9hcc9",
});

const EMAILJS_RATE_LIMIT_MS = 15_000;
const EMAILJS_RATE_LIMIT_ID = "baekowest-finanzierungsrechner";

let initialized = false;

export function initEmailService() {
  if (initialized) return true;

  assertEmailJsConfig();

  if (!window.emailjs || typeof window.emailjs.init !== "function") {
    throw new Error(
      "Das EmailJS-SDK wurde nicht geladen. Prüfen Sie den Script-Tag und die Content-Security-Policy."
    );
  }

  window.emailjs.init({
    publicKey: EMAILJS_CONFIG.publicKey,
    blockHeadless: true,
    limitRate: {
      id: EMAILJS_RATE_LIMIT_ID,
      throttle: EMAILJS_RATE_LIMIT_MS,
    },
  });

  initialized = true;
  return true;
}

export async function sendOfferEmail({ customer, calculation }) {
  if (!customer) {
    throw new Error("Für den E-Mail-Versand fehlen die Kundendaten.");
  }

  if (!calculation?.valid) {
    throw new Error("Für den E-Mail-Versand fehlt eine gültige Berechnung.");
  }

  initEmailService();

  const templateParams = buildTemplateParams(customer, calculation);

  try {
    return await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      { publicKey: EMAILJS_CONFIG.publicKey }
    );
  } catch (error) {
    const status = error?.status ?? "unbekannt";
    const message =
      error?.text ??
      error?.message ??
      "EmailJS hat keine genaue Fehlermeldung geliefert.";

    console.error(`[EmailJS] Versand fehlgeschlagen (${status}): ${message}`);

    const wrappedError = new Error(`EmailJS-Fehler ${status}: ${message}`);
    wrappedError.cause = error;
    wrappedError.status = status;
    throw wrappedError;
  }
}

function buildTemplateParams(customer, calculation) {
  const fullName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  const address = [
    customer.street,
    [customer.postalCode, customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const factor = Number.isFinite(Number(calculation.factor))
    ? `${String(calculation.factor).replace(".", ",")} %`
    : "-";

  const timestamp = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return {
    // Empfänger-/Absenderbezug
    to_name: "BÄKO WEST eG",
    from_name: fullName || customer.company || "Interessent",
    reply_to: customer.email || "",

    // Kundendaten – ohne doppelte Alias-Felder
    name_vollstaendig: fullName || "-",
    firma: customer.company || "-",
    adresse: address || "-",
    email: customer.email || "-",
    telefon: customer.phone || "-",

    // Kalkulation
    finanzierungsart: customer.financingType || "-",
    anschaffungspreis: `${formatCurrency(calculation.price)} €`,
    laufzeit: `${calculation.duration} Monate`,
    restwert: `${formatCurrency(calculation.residualValue)} €`,
    leasingfaktor: factor,
    monatliche_rate: `${formatCurrency(calculation.rate)} €`,

    // Metadaten
    timestamp,
    page_url: window.location.href,
  };
}

function assertEmailJsConfig() {
  assertConfigValue("Public Key", EMAILJS_CONFIG.publicKey, ["DEIN_PUBLIC_KEY"]);
  assertConfigValue("Service ID", EMAILJS_CONFIG.serviceId, ["DEINE_SERVICE_ID"]);
  assertConfigValue("Template ID", EMAILJS_CONFIG.templateId, ["DEINE_TEMPLATE_ID"]);
}

function assertConfigValue(label, value, placeholders = []) {
  const normalized = typeof value === "string" ? value.trim() : "";
  const invalid =
    !normalized ||
    normalized === "xxx" ||
    placeholders.includes(normalized) ||
    normalized.includes("HIER_") ||
    normalized.includes("DEIN_");

  if (invalid) {
    throw new Error(`${label} fehlt oder ist noch ein Platzhalter.`);
  }
}
