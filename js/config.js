export const PRICE_BANDS = Object.freeze({
  SMALL: "1-25000",
  MEDIUM: "25000-100000",
  LARGE: "100000+",
});

export const FINANCING_FACTORS = Object.freeze({
  [PRICE_BANDS.SMALL]: Object.freeze({
    0: Object.freeze({ 36: null, 48: 2.59, 60: 2.13, 72: 1.84, 84: null, 96: null }),
    10: Object.freeze({ 36: 3.03, 48: 2.41, 60: 1.98, 72: null, 84: null, 96: null }),
    20: Object.freeze({ 36: 2.77, 48: 2.22, 60: null, 72: null, 84: null, 96: null }),
  }),
  [PRICE_BANDS.MEDIUM]: Object.freeze({
    0: Object.freeze({ 36: null, 48: 2.52, 60: 2.07, 72: 1.76, 84: 1.54, 96: null }),
    10: Object.freeze({ 36: null, 48: 2.33, 60: 1.92, 72: 1.64, 84: 1.45, 96: null }),
    20: Object.freeze({ 36: null, 48: 2.15, 60: 2.07, 72: 1.52, 84: null, 96: null }),
  }),
  [PRICE_BANDS.LARGE]: Object.freeze({
    0: Object.freeze({ 36: null, 48: 2.44, 60: 2.01, 72: 1.73, 84: 1.53, 96: 1.37 }),
    10: Object.freeze({ 36: null, 48: 2.25, 60: 1.86, 72: 1.61, 84: 1.42, 96: 1.28 }),
    20: Object.freeze({ 36: null, 48: 2.06, 60: 1.71, 72: 1.49, 84: null, 96: null }),
  }),
});

export const ALLOWED_DURATIONS = Object.freeze(["36", "48", "60", "72", "84", "96"]);
export const ALLOWED_RESIDUALS = Object.freeze(["0", "10", "20"]);
export const ALLOWED_FINANCING_TYPES = Object.freeze(["Leasing", "Mietkauf"]);
export const ALLOWED_SALUTATIONS = Object.freeze(["Frau", "Herr"]);

export const INPUT_LIMITS = Object.freeze({
  priceMin: 1,
  priceMax: 999999999.99,
  nameMaxLength: 50,
  companyMaxLength: 100,
  streetMaxLength: 150,
  postalCodeMaxLength: 10,
  cityMaxLength: 100,
  emailMaxLength: 120,
  phoneMaxLength: 40,
});

export const DEMO_MESSAGES = Object.freeze({
  contactButton: "In der Live-Version führt dieser Button zur BÄKO WEST Kontaktseite.",
  unavailableCombination: "Diese Kombination ist aktuell nicht verfügbar.",
  pdfGenerationError: "Das PDF konnte nicht erstellt werden. Bitte prüfen Sie Ihre Eingaben.",
  invalidCalculation: "Bitte berechnen Sie zuerst eine gültige Rate.",
});

export const BRAND = Object.freeze({
  primary: "#C4944E",
  secondary: "#0C1D21",
  white: "#FFFFFF",
});

export const PDF_COMPANY = Object.freeze({
  name: "BÄKO WEST eG Bäcker- und Konditorengenossenschaft",
  street: "Linsellesstraße 93",
  postalCity: "47877 Willich",
  managingDirector: "",
  registry: "",
  vatId: "",
  phone: "Fon +49 2154 8102-0",
  email: "info@baekowest.de",
  website: "www.baekowest.de",
  bankNames: Object.freeze(["BÄKO WEST eG Bäcker- und Konditorengenossenschaft"]),
  ibans: Object.freeze([""]),
  bics: Object.freeze([""]),
});

export const PDF_TEXT = Object.freeze({
  subjectPrefix: "Finanzierungsangebot",
  intro: "vielen Dank für Ihr Interesse. Wie folgt erhalten Sie Ihr unverbindliches Finanzierungsangebot:",
  netPriceNotice: "Die genannten Preise verstehen sich netto, zuzüglich der gesetzlichen Mehrwertsteuer.",
  closing: Object.freeze([
    "Dieses Angebot ist unverbindlich und steht unter dem Vorbehalt einer positiven Bonitätsprüfung.",
    "Für Rückfragen steht Ihnen das BÄKO WEST Team gerne zur Verfügung.",
  ]),
  greeting: "Mit freundlichen Grüßen,",
  mietkaufVatNotice: "Hinweis: Die gesetzl. Mehrwertsteuer fällt vorab auf die Summe aller Zahlungen an.",
});

export const SECURITY = Object.freeze({
  clickDebounceMs: 5000,
  submitCooldownMs: 60000,
  submissionWindowMs: 10 * 60 * 1000,
  maxSubmissionsPerWindow: 5,
  minimumFormFillMs: 3000,
  attemptStorageKey: "baekowest_financing_attempts_v2",
  successStorageKey: "baekowest_financing_last_success_v2",
  allowedEmbedOrigins: Object.freeze([
    "https://www.baekowest.de",
    "https://baekowest.de"
  ]),
});
