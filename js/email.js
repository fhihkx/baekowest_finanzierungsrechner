import { formatCurrency } from "./calculator.js";

const EMAILJS_CONFIG = Object.freeze({
  publicKey: "8TINjTh9gJ09Ett0t",
  serviceId: "service_nn8cgva",
  templateId: "template_ib9hcc9",
});

let initialized = false;

export function initEmailService() {
  if (initialized) return true;

  if (!window.emailjs) {
    throw new Error(
      "Das EmailJS-SDK wurde nicht geladen. Prüfe den Script-Tag und die Content-Security-Policy."
    );
  }

  assertConfigValue("Public Key", EMAILJS_CONFIG.publicKey);
  assertConfigValue("Service ID", EMAILJS_CONFIG.serviceId);
  assertConfigValue("Template ID", EMAILJS_CONFIG.templateId);

  window.emailjs.init({
    publicKey: EMAILJS_CONFIG.publicKey,
    blockHeadless: true,
    limitRate: {
      id: "baekowest-finanzierungsrechner",
      throttle: 10000,
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
    const response = await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      {
        publicKey: EMAILJS_CONFIG.publicKey,
      }
    );

    console.info(
      "[EmailJS] Versand erfolgreich:",
      response.status,
      response.text
    );

    return response;
  } catch (error) {
    const status = error?.status ?? "unbekannt";
    const text =
      error?.text ??
      error?.message ??
      "EmailJS hat keine genaue Fehlermeldung geliefert.";

    console.error("[EmailJS] Versand fehlgeschlagen:", {
      status,
      text,
      error,
      templateParams,
    });

    throw new Error(`EmailJS-Fehler ${status}: ${text}`);
  }
}

function buildTemplateParams(customer, calculation) {
  const fullName =
    `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

  const address = [
    customer.street,
    [customer.postalCode, customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const factor = Number.isFinite(Number(calculation.factor))
    ? `${String(calculation.factor).replace(".", ",")} %`
    : "-";

  return {
    name_vollstaendig: fullName,
    firma: customer.company ?? "-",
    adresse: address || "-",
    email: customer.email ?? "-",
    telefon: customer.phone ?? "-",

    finanzierungsart: customer.financingType ?? "-",
    anschaffungspreis: `${formatCurrency(calculation.price)} €`,
    laufzeit: `${calculation.duration} Monate`,
    restwert: `${formatCurrency(calculation.residualValue)} €`,
    leasingfaktor: factor,
    monatliche_rate: `${formatCurrency(calculation.rate)} €`,

    timestamp: new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),

    page_url: window.location.href,
  };
}

function assertConfigValue(label, value) {
  const invalidValues = [
    "",
    "xxx",
    "DEIN_PUBLIC_KEY",
    "DEINE_SERVICE_ID",
    "DEINE_TEMPLATE_ID",
  ];

  if (
    typeof value !== "string" ||
    invalidValues.includes(value.trim()) ||
    value.includes("HIER_") ||
    value.includes("DEIN_")
  ) {
    throw new Error(`${label} fehlt oder ist noch ein Platzhalter.`);
  }
}
