import {
  calculateRate,
  formatPriceInputValue,
  getSafeDurationForPrice,
  getSafeResidual,
} from "./calculator.js";
import { validateContactForm } from "./validation.js";
import { generateOfferPdf } from "./pdf.js";
import { initEmailService, sendOfferEmail } from "./email.js";
import {
  enforceEmbeddingPolicy,
  checkSubmissionGuard,
  markSubmissionSuccess,
  formatRetryMessage,
} from "./security.js";
import {
  switchTab,
  initTabKeyboardNavigation,
  goToStep,
  renderCalculationResult,
  renderSummary,
  updateDurationOptions,
  updateResidualOptions,
  markFormErrors,
  clearFormErrors,
  setSubmitLoading,
} from "./ui.js";

const state = {
  calculation: null,
  submitting: false,
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  if (!enforceEmbeddingPolicy()) return;

  // EmailJS-Fehler beim Start verhindern nicht die Nutzung des Rechners.
  try {
    initEmailService();
  } catch (error) {
    console.error("[EmailJS] Initialisierung fehlgeschlagen:", error?.message ?? error);
  }

  bindTabs();
  bindCalculator();
  bindForm();
  updateFinancingSelections();
  initTabKeyboardNavigation();
  switchTab("calculator");
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  });
}

function bindCalculator() {
  const priceInput = document.getElementById("price");
  const durationInput = document.getElementById("duration");
  const residualInput = document.getElementById("residual");
  const calculateButton = document.getElementById("calculate-btn");
  const nextButton = document.getElementById("btn-next");
  const backButton = document.getElementById("back-btn");

  priceInput?.addEventListener("input", (event) => {
    event.target.value = formatPriceInputValue(event.target.value);
    updateFinancingSelections();
    resetCalculation();
  });

  durationInput?.addEventListener("change", () => {
    updateFinancingSelections();
    resetCalculation();
  });

  residualInput?.addEventListener("change", resetCalculation);

  calculateButton?.addEventListener("click", calculateAndRender);

  nextButton?.addEventListener("click", () => {
    if (!state.calculation?.valid) return;
    renderSummary(state.calculation);
    goToStep(2);
  });

  backButton?.addEventListener("click", () => {
    clearSubmissionMessage();
    goToStep(1);
  });
}

function calculateAndRender() {
  const calculation = calculateRate({
    price: getValue("price"),
    duration: getValue("duration"),
    residual: getValue("residual"),
  });

  state.calculation = calculation;
  renderCalculationResult(calculation);
  return calculation;
}

function bindForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      clearFormErrors();
      clearSubmissionMessage();
    });
    field.addEventListener("change", () => {
      clearFormErrors();
      clearSubmissionMessage();
    });
  });

  form.addEventListener("submit", handleFormSubmit);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (state.submitting) return;

  if (!state.calculation?.valid) {
    showSubmissionMessage("Bitte berechnen Sie zuerst eine gültige Rate.", "error");
    return;
  }

  const form = event.currentTarget;

  // Honeypot: bei Bot-Eintrag still abbrechen.
  const honeypot = form.querySelector('[name="website"]')?.value?.trim();
  if (honeypot) return;

  const validation = validateContactForm({
    financingType: getValue("form-finanzierungsart"),
    salutation: getValue("form-anrede"),
    firstName: getValue("form-vorname"),
    lastName: getValue("form-nachname"),
    company: getValue("form-firma"),
    street: getValue("form-strasse"),
    postalCode: getValue("form-plz"),
    city: getValue("form-ort"),
    email: getValue("form-email"),
    phone: getValue("form-telefon"),
  });

  if (!validation.valid) {
    markFormErrors(validation.errors);
    showSubmissionMessage("Bitte prüfen Sie die markierten Pflichtfelder.", "error");
    return;
  }

  const guard = checkSubmissionGuard();
  if (!guard.allowed) {
    showSubmissionMessage(formatRetryMessage(guard), "error");
    return;
  }

  clearSubmissionMessage();
  state.submitting = true;
  setSubmitLoading(true);

  let pdfCreated = false;

  try {
    generateOfferPdf({
      customer: validation.values,
      calculation: state.calculation,
    });
    pdfCreated = true;

    try {
      await sendOfferEmail({
        customer: validation.values,
        calculation: state.calculation,
      });
      console.info("[EmailJS] E-Mail erfolgreich gesendet.");
    } catch (emailError) {
      // Kein Popup. Die PDF-Erstellung bleibt erfolgreich.
      console.error("[EmailJS] Versand fehlgeschlagen:", emailError?.message ?? emailError);
    }

    // Auch bei einem E-Mail-Fehler wurde das PDF bereits erzeugt.
    markSubmissionSuccess();
  } catch (pdfError) {
    console.error("[PDF] Erstellung fehlgeschlagen:", pdfError);
    showSubmissionMessage(
      "Das Angebot konnte nicht erstellt werden. Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.",
      "error"
    );
  } finally {
    state.submitting = false;
    setSubmitLoading(false);

    if (pdfCreated) {
      // Absichtlich kein Erfolgs-Popup und keine Erfolgsbox.
      clearSubmissionMessage();
    }
  }
}

function updateFinancingSelections() {
  const price = getValue("price");
  const currentDuration = getValue("duration");
  const currentResidual = getValue("residual");

  const safeDuration = getSafeDurationForPrice(price, currentDuration);
  updateDurationOptions(price, safeDuration);

  const safeResidual = getSafeResidual(price, safeDuration, currentResidual);
  updateResidualOptions(price, safeDuration, safeResidual);
}

function resetCalculation() {
  state.calculation = null;

  const result = document.getElementById("result-display");
  const next = document.getElementById("btn-next");
  const errorBox = document.getElementById("error-msg");

  if (result) result.textContent = "0,00";
  if (next) next.disabled = true;
  if (errorBox) errorBox.classList.add("hidden");
}

function showSubmissionMessage(message, type = "error") {
  const box = document.getElementById("submit-security-msg");
  if (!box) {
    if (message) console.warn(`[Formular/${type}] ${message}`);
    return;
  }

  box.textContent = message;
  box.classList.toggle("hidden", !message);
  box.dataset.type = type;
}

function clearSubmissionMessage() {
  showSubmissionMessage("");
}

function getValue(id) {
  return document.getElementById(id)?.value?.trim() ?? "";
}
