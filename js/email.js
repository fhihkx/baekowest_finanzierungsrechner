import { formatCurrency } from "./calculator.js";

const EMAILJS_CONFIG = Object.freeze({
  publicKey: "xxx",
  serviceId: "xxx",
  templateId: "xxx",
});

let initialized = false;

export function initEmailService() {
  if (initialized) return true;
  if (!window.emailjs) {
    console.warn("[EmailJS] SDK wurde nicht geladen.");
    return false;
  }
  if (hasPlaceholder(EMAILJS_CONFIG.publicKey)) {
    console.warn("[EmailJS] Public Key fehlt oder ist noch ein Platzhalter.");
    return false;
  }
  window.emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  initialized = true;
  return true;
}

export async function sendOfferEmail({ customer, calculation }) {
  if (!customer || !calculation?.valid) throw new Error("Ungültige Daten für den E-Mail-Versand.");
  if (hasPlaceholder(EMAILJS_CONFIG.serviceId)) throw new Error("EmailJS Service ID fehlt.");
  if (hasPlaceholder(EMAILJS_CONFIG.templateId)) throw new Error("EmailJS Template ID fehlt.");
  if (!initEmailService()) throw new Error("EmailJS konnte nicht initialisiert werden.");

  const params = buildTemplateParams(customer, calculation);
  return window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, params);
}

function buildTemplateParams(customer, calculation) {
  const price = `${formatCurrency(calculation.price)} €`;
  const rate = `${formatCurrency(calculation.rate)} €`;
  const residualValue = `${formatCurrency(calculation.residualValue)} €`;
  const duration = `${calculation.duration} Monate`;
  const factor = Number.isFinite(Number(calculation.factor)) ? `${String(calculation.factor).replace(".", ",")} %` : "-";
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const address = `${customer.street}, ${customer.postalCode} ${customer.city}`;
  const timestamp = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  return {
    name: fullName,
    from_name: fullName,
    to_name: "BÄKO WEST eG",

    anrede: customer.salutation,
    vorname: customer.firstName,
    nachname: customer.lastName,
    name_vollstaendig: fullName,
    firma: customer.company,
    strasse: customer.street,
    plz: customer.postalCode,
    ort: customer.city,
    adresse: address,

    salutation: customer.salutation,
    first_name: customer.firstName,
    last_name: customer.lastName,
    full_name: fullName,
    company: customer.company,
    street: customer.street,
    postal_code: customer.postalCode,
    city: customer.city,
    address,
    email: customer.email,
    telefon: customer.phone || "-",
    phone: customer.phone || "-",

    finanzierungsart: customer.financingType,
    anschaffungspreis: price,
    preis: price,
    price,
    laufzeit: duration,
    duration,
    restwert: residualValue,
    residual_value: residualValue,
    leasingfaktor: factor,
    leasing_factor: factor,
    monatliche_rate: rate,
    monthly_rate: rate,
    rate,

    price_raw: calculation.price,
    rate_raw: calculation.rate,
    residual_value_raw: calculation.residualValue,
    duration_raw: calculation.duration,
    factor_raw: calculation.factor,
    timestamp,
    page_url: window.location.href,
  };
}

function hasPlaceholder(value) {
  return !value || typeof value !== "string" || value.includes("HIER_") || value.includes("DEIN_");
}
