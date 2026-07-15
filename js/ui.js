import { DEMO_MESSAGES } from "./config.js";
import { formatCurrency, getAvailableDurationsForPrice, getAvailableResiduals } from "./calculator.js";

export function switchTab(tabId) {
  const targetView = document.getElementById(`view-${tabId}`);
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (!targetView || !targetTab) return;

  document.querySelectorAll(".tab-btn").forEach((tab) => {
    const active = tab === targetTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  document.querySelectorAll(".view-content").forEach((view) => {
    const active = view === targetView;
    view.classList.toggle("active-view", active);
    view.classList.toggle("hidden-view", !active);
    view.hidden = !active;
    view.setAttribute("aria-hidden", String(!active));
    if (active) view.removeAttribute("inert");
    else view.setAttribute("inert", "");
  });
}

export function initTabKeyboardNavigation() {
  const tabs = Array.from(document.querySelectorAll(".tab-btn"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      tabs[nextIndex].focus();
      switchTab(tabs[nextIndex].dataset.tab);
    });
  });
}

export function goToStep(step) {
  const step1 = document.getElementById("calc-step-1");
  const step2 = document.getElementById("calc-step-2");
  if (!step1 || !step2) return;
  const showStep2 = Number(step) === 2;
  step1.classList.toggle("active-step", !showStep2);
  step1.classList.toggle("hidden-step", showStep2);
  step2.classList.toggle("active-step", showStep2);
  step2.classList.toggle("hidden-step", !showStep2);
  if (showStep2) {
    window.scrollTo({ top: Math.max(document.getElementById("content-container").offsetTop - 100, 0), behavior: "smooth" });
  }
}

export function renderCalculationResult(calculation) {
  const result = document.getElementById("result-display");
  const next = document.getElementById("btn-next");
  const errorBox = document.getElementById("error-msg");
  const errorText = document.getElementById("error-text");
  if (!result || !next) return;

  if (!calculation.valid) {
    result.textContent = calculation.reason === "unavailable_combination" ? "—" : "0,00";
    next.disabled = true;
    if (calculation.reason === "unavailable_combination" && errorBox && errorText) {
      errorText.textContent = `Diese Kombination (${calculation.duration} Monate / ${calculation.residual}%) ist aktuell nicht verfügbar.`;
      errorBox.classList.remove("hidden");
    } else if (errorBox) {
      errorBox.classList.add("hidden");
    }
    return;
  }

  if (errorBox) errorBox.classList.add("hidden");
  result.classList.remove("animate-number-pop");
  void result.offsetWidth;
  result.classList.add("animate-number-pop");
  result.textContent = formatCurrency(calculation.rate);
  next.disabled = false;
}

export function renderSummary(calculation) {
  setText("summary-price", `${formatCurrency(calculation.price)} €`);
  setText("summary-duration", calculation.duration);
  setText("summary-residual-euro", `${formatCurrency(calculation.residualValue)} €`);
  setText("summary-leasing-factor", `${String(calculation.factor).replace(".", ",")} %`);
  setText("summary-rate", formatCurrency(calculation.rate));
}

export function updateDurationOptions(price, currentDuration = "") {
  const select = document.getElementById("duration");
  if (!select) return "";
  const allowed = getAvailableDurationsForPrice(price);
  Array.from(select.options).forEach((option) => {
    if (!option.value) return;
    const active = allowed.includes(option.value);
    option.disabled = !active;
    option.hidden = !active;
    option.style.display = active ? "" : "none";
  });
  const safeValue = allowed.includes(String(currentDuration)) ? String(currentDuration) : "";
  select.value = safeValue;
  return safeValue;
}

export function updateResidualOptions(price, duration, currentResidual = "") {
  const select = document.getElementById("residual");
  if (!select) return "";
  const allowed = getAvailableResiduals(price, duration);
  Array.from(select.options).forEach((option) => {
    if (!option.value) return;
    const active = allowed.includes(option.value);
    option.disabled = !active;
    option.hidden = !active;
    option.style.display = active ? "" : "none";
  });
  const safeValue = allowed.includes(String(currentResidual)) ? String(currentResidual) : "";
  select.value = safeValue;
  return safeValue;
}

export function markFormErrors(errors = {}) {
  clearFormErrors();
  const ids = {
    financingType: "form-finanzierungsart",
    salutation: "form-anrede",
    firstName: "form-vorname",
    lastName: "form-nachname",
    company: "form-firma",
    street: "form-strasse",
    postalCode: "form-plz",
    city: "form-ort",
    email: "form-email",
    phone: "form-telefon",
  };
  Object.keys(errors).forEach((key) => {
    const el = document.getElementById(ids[key]);
    if (!el) return;
    el.classList.add("input-error");
    el.setAttribute("aria-invalid", "true");
  });
  document.querySelector(".input-error")?.focus();
}

export function clearFormErrors() {
  document.querySelectorAll(".input-error").forEach((el) => {
    el.classList.remove("input-error");
    el.removeAttribute("aria-invalid");
  });
}

export function setSubmitLoading(isLoading) {
  const btn = document.getElementById("submit-btn");
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
    btn.innerHTML = '<span>Angebot wird erstellt...</span><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
  } else {
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
    btn.innerHTML = btn.dataset.originalHtml || '<span>Angebot erstellen</span><i class="fa-solid fa-file-pdf" aria-hidden="true"></i>';
    delete btn.dataset.originalHtml;
  }
}

export function showDemoContactAlert() {
  alert(DEMO_MESSAGES.contactButton);
}

export function showPdfError() {
  alert(DEMO_MESSAGES.pdfGenerationError);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? "");
}
