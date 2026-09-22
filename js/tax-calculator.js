/* =========================================================
   MAMBODLA — INDIVIDUAL TAX CALCULATOR 2026 / 27
   Verified data → clear estimate → transparent breakdown
========================================================= */

(() => {
  const form = document.querySelector("[data-tax-calculator-form]");

  if (!form) {
    return;
  }

  const incomeInput = form.querySelector('[data-tax-input="income"]');
  const ageInput = form.querySelector('[data-tax-input="age"]');
  const medicalPeopleInput = form.querySelector(
    '[data-tax-input="medical-people"]',
  );
  const medicalMonthsInput = form.querySelector(
    '[data-tax-input="medical-months"]',
  );
  const medicalMonthsField = form.querySelector(
    '[data-tax-field="medical-months"]',
  );

  const calculateButton = form.querySelector("[data-tax-calculate]");
  const calculateLabel = form.querySelector("[data-tax-calculate-label]");
  const resetButton = form.querySelector("[data-tax-reset]");
  const formStatus = form.querySelector("[data-tax-form-status]");

  const emptyResults = document.querySelector("[data-tax-results-empty]");
  const results = document.querySelector("[data-tax-results]");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const dataURL = form.dataset.taxDataUrl;

  let taxData = null;

  const currencyWhole = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const currencyCents = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const numberWhole = new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  /* =====================================================
     HELPERS — DOM
  ====================================================== */

  const getField = (fieldName) =>
    form.querySelector(`[data-tax-field="${fieldName}"]`);

  const getError = (fieldName) =>
    form.querySelector(`[data-tax-error="${fieldName}"]`);

  const getResult = (name) => document.querySelector(`[data-result="${name}"]`);

  const getResultRow = (name) =>
    document.querySelector(`[data-result-row="${name}"]`);

  const setText = (element, value) => {
    if (element) {
      element.textContent = value;
    }
  };

  const setFormStatus = (message = "", state = "") => {
    if (!formStatus) {
      return;
    }

    formStatus.textContent = message;
    formStatus.dataset.state = state;
  };

  const clearFieldError = (fieldName) => {
    const field = getField(fieldName);
    const error = getError(fieldName);
    const control = field?.querySelector("input, select");

    field?.classList.remove("is-invalid");
    control?.removeAttribute("aria-invalid");

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  };

  const setFieldError = (fieldName, message) => {
    const field = getField(fieldName);
    const error = getError(fieldName);
    const control = field?.querySelector("input, select");

    field?.classList.add("is-invalid");
    control?.setAttribute("aria-invalid", "true");

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }

    return false;
  };

  /* =====================================================
     HELPERS — NUMBER FORMATTING
  ====================================================== */

  const formatWholeCurrency = (value) => currencyWhole.format(value);

  const formatCurrencyWithCents = (value) => currencyCents.format(value);

  const formatPercent = (value, decimals = 0) =>
    `${Number(value).toFixed(decimals)}%`;

  const parseCurrencyInput = (value) => {
    if (typeof value !== "string") {
      return Number.NaN;
    }

    const compact = value.trim().replace(/[Rr]/g, "").replace(/[\s,]/g, "");

    if (!compact || !/^\d+(?:\.\d{1,2})?$/.test(compact)) {
      return Number.NaN;
    }

    return Number(compact);
  };

  const formatIncomeField = () => {
    if (!incomeInput) {
      return;
    }

    const value = parseCurrencyInput(incomeInput.value);

    if (!Number.isFinite(value)) {
      return;
    }

    const hasCents = !Number.isInteger(value);

    incomeInput.value = new Intl.NumberFormat("en-ZA", {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /* =====================================================
     VERIFIED DATA — VALIDATION + LOAD
  ====================================================== */

  const hasRequiredTaxData = (data) => {
    return Boolean(
      data &&
      Array.isArray(data.individuals?.brackets) &&
      data.individuals.brackets.length &&
      data.individuals?.rebates &&
      data.individuals?.thresholds &&
      data.individuals?.medical_credit_monthly,
    );
  };

  const setCalculatorReady = () => {
    if (calculateButton) {
      calculateButton.disabled = false;
    }

    setText(calculateLabel, "Calculate tax");
    setFormStatus("");
  };

  const setCalculatorUnavailable = () => {
    if (calculateButton) {
      calculateButton.disabled = true;
    }

    setText(calculateLabel, "Calculator unavailable");

    setFormStatus(
      "The verified tax dataset could not be loaded. Please refresh the page or try again later.",
      "error",
    );
  };

  const loadTaxData = async () => {
    if (!dataURL) {
      setCalculatorUnavailable();
      return;
    }

    try {
      const response = await fetch(dataURL, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Tax data request failed with ${response.status}.`);
      }

      const data = await response.json();

      if (!hasRequiredTaxData(data)) {
        throw new Error("Tax data is missing required individual-tax values.");
      }

      taxData = data;
      setCalculatorReady();
    } catch (error) {
      console.error("Mambodla tax calculator data load failed:", error);
      setCalculatorUnavailable();
    }
  };

  /* =====================================================
     MEDICAL SCHEME INPUT STATE
  ====================================================== */

  const syncMedicalMonthsState = () => {
    if (!medicalPeopleInput || !medicalMonthsInput || !medicalMonthsField) {
      return;
    }

    const people = Number(medicalPeopleInput.value);
    const hasCoveredPeople = Number.isInteger(people) && people > 0;

    medicalMonthsInput.disabled = !hasCoveredPeople;
    medicalMonthsField.classList.toggle("is-disabled", !hasCoveredPeople);

    if (!hasCoveredPeople) {
      medicalMonthsInput.value = "12";
    }
  };

  /* =====================================================
     INPUT VALIDATION
  ====================================================== */

  const validateIncome = () => {
    clearFieldError("income");

    if (!incomeInput?.value.trim()) {
      return setFieldError("income", "Please enter annual taxable income.");
    }

    const income = parseCurrencyInput(incomeInput.value);

    if (!Number.isFinite(income) || income < 0) {
      return setFieldError(
        "income",
        "Please enter a valid taxable income amount of R0 or more.",
      );
    }

    return true;
  };

  const validateMedicalPeople = () => {
    clearFieldError("medical-people");

    if (!medicalPeopleInput) {
      return true;
    }

    const rawValue = medicalPeopleInput.value.trim();

    if (!rawValue) {
      return setFieldError(
        "medical-people",
        "Enter 0 if no one is covered by a medical scheme.",
      );
    }

    const people = Number(rawValue);

    if (!Number.isSafeInteger(people) || people < 0) {
      return setFieldError(
        "medical-people",
        "Enter a whole number of 0 or more.",
      );
    }

    return true;
  };

  const validateForm = () => {
    const incomeValid = validateIncome();
    const medicalPeopleValid = validateMedicalPeople();

    const firstInvalid = !incomeValid
      ? incomeInput
      : !medicalPeopleValid
        ? medicalPeopleInput
        : null;

    return {
      valid: incomeValid && medicalPeopleValid,
      firstInvalid,
    };
  };

  /* =====================================================
     TAX ENGINE
  ====================================================== */

  const getTaxBracket = (income) => {
    const brackets = taxData.individuals.brackets;

    return (
      brackets.find((bracket) => {
        const [, upper] = bracket;

        return upper === null || income <= upper;
      }) || brackets[brackets.length - 1]
    );
  };

  const calculateTaxBeforeRebates = (income) => {
    const bracket = getTaxBracket(income);
    const [, , rate, baseTax, excessThreshold] = bracket;

    return Math.max(0, baseTax + (income - excessThreshold) * rate);
  };

  const getRebates = (ageBand) => {
    const rebates = taxData.individuals.rebates;

    const primary = rebates.primary;
    const secondary =
      ageBand === "65_to_74" || ageBand === "75_plus"
        ? rebates.secondary_65_plus
        : 0;
    const tertiary = ageBand === "75_plus" ? rebates.tertiary_75_plus : 0;

    return {
      primary,
      secondary,
      tertiary,
      total: primary + secondary + tertiary,
    };
  };

  const getThreshold = (ageBand) => {
    const thresholds = taxData.individuals.thresholds;

    return thresholds[ageBand] ?? thresholds.under_65;
  };

  const calculateMedicalCredit = (people, months) => {
    if (!people || !months) {
      return 0;
    }

    const medical = taxData.individuals.medical_credit_monthly;

    let monthlyCredit = medical.first_person;

    if (people >= 2) {
      monthlyCredit += medical.second_person;
    }

    if (people > 2) {
      monthlyCredit += (people - 2) * medical.additional_dependant;
    }

    return monthlyCredit * months;
  };

  const calculateEstimate = ({
    income,
    ageBand,
    medicalPeople,
    medicalMonths,
  }) => {
    const bracket = getTaxBracket(income);
    const marginalRate = bracket[2];

    const taxBeforeRebates = calculateTaxBeforeRebates(income);
    const rebates = getRebates(ageBand);
    const taxAfterRebates = Math.max(0, taxBeforeRebates - rebates.total);

    const medicalCredit = calculateMedicalCredit(
      medicalPeople,
      medicalPeople > 0 ? medicalMonths : 0,
    );

    const annualTax = Math.max(0, taxAfterRebates - medicalCredit);
    const monthlyTax = annualTax / 12;
    const effectiveRate = income > 0 ? (annualTax / income) * 100 : 0;

    return {
      income,
      ageBand,
      taxBeforeRebates,
      rebates,
      taxAfterRebates,
      medicalCredit,
      annualTax,
      monthlyTax,
      effectiveRate,
      marginalRate: marginalRate * 100,
      threshold: getThreshold(ageBand),
    };
  };

  /* =====================================================
     RESULT RENDERING
  ====================================================== */

  const showResults = () => {
    if (!results || !emptyResults) {
      return;
    }

    emptyResults.hidden = true;
    results.hidden = false;
    results.classList.remove("is-visible");

    if (reduceMotion.matches) {
      results.classList.add("is-visible");
      return;
    }

    requestAnimationFrame(() => {
      results.classList.add("is-visible");
    });
  };

  const showEmptyResults = () => {
    if (!results || !emptyResults) {
      return;
    }

    results.classList.remove("is-visible");
    results.hidden = true;
    emptyResults.hidden = false;
  };

  const renderEstimate = (estimate) => {
    setText(getResult("annual-tax"), formatWholeCurrency(estimate.annualTax));
    setText(
      getResult("monthly-tax"),
      formatCurrencyWithCents(estimate.monthlyTax),
    );

    setText(
      getResult("effective-rate"),
      formatPercent(estimate.effectiveRate, 2),
    );
    setText(
      getResult("marginal-rate"),
      formatPercent(estimate.marginalRate, 0),
    );
    setText(getResult("threshold"), formatWholeCurrency(estimate.threshold));

    setText(
      getResult("tax-before-rebates"),
      formatWholeCurrency(estimate.taxBeforeRebates),
    );
    setText(
      getResult("primary-rebate"),
      formatWholeCurrency(estimate.rebates.primary),
    );
    setText(
      getResult("secondary-rebate"),
      formatWholeCurrency(estimate.rebates.secondary),
    );
    setText(
      getResult("tertiary-rebate"),
      formatWholeCurrency(estimate.rebates.tertiary),
    );
    setText(
      getResult("tax-after-rebates"),
      formatWholeCurrency(estimate.taxAfterRebates),
    );
    setText(
      getResult("medical-credit"),
      formatWholeCurrency(estimate.medicalCredit),
    );
    setText(
      getResult("annual-tax-breakdown"),
      formatWholeCurrency(estimate.annualTax),
    );

    const secondaryRow = getResultRow("secondary-rebate");
    const tertiaryRow = getResultRow("tertiary-rebate");

    if (secondaryRow) {
      secondaryRow.hidden = estimate.rebates.secondary === 0;
    }

    if (tertiaryRow) {
      tertiaryRow.hidden = estimate.rebates.tertiary === 0;
    }

    showResults();
  };

  /* =====================================================
     FORM EVENTS
  ====================================================== */

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!taxData) {
      setCalculatorUnavailable();
      return;
    }

    const validation = validateForm();

    if (!validation.valid) {
      validation.firstInvalid?.focus({
        preventScroll: true,
      });

      validation.firstInvalid
        ?.closest(".tax-calculator-field")
        ?.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "center",
        });

      return;
    }

    const income = parseCurrencyInput(incomeInput.value);
    const ageBand = ageInput?.value || "under_65";
    const medicalPeople = Number(medicalPeopleInput?.value || 0);
    const medicalMonths =
      medicalPeople > 0 ? Number(medicalMonthsInput?.value || 12) : 0;

    const estimate = calculateEstimate({
      income,
      ageBand,
      medicalPeople,
      medicalMonths,
    });

    formatIncomeField();
    setFormStatus("");
    renderEstimate(estimate);
  });

  resetButton?.addEventListener("click", () => {
    form.reset();

    clearFieldError("income");
    clearFieldError("medical-people");

    setFormStatus("");
    syncMedicalMonthsState();
    showEmptyResults();

    incomeInput?.focus({
      preventScroll: true,
    });
  });

  incomeInput?.addEventListener("input", () => {
    if (getField("income")?.classList.contains("is-invalid")) {
      validateIncome();
    }
  });

  incomeInput?.addEventListener("blur", () => {
    if (incomeInput.value.trim()) {
      validateIncome();
      formatIncomeField();
    }
  });

  medicalPeopleInput?.addEventListener("input", () => {
    syncMedicalMonthsState();

    if (getField("medical-people")?.classList.contains("is-invalid")) {
      validateMedicalPeople();
    }
  });

  medicalPeopleInput?.addEventListener("blur", () => {
    validateMedicalPeople();
  });

  /* =====================================================
     INITIAL STATE
  ====================================================== */

  syncMedicalMonthsState();
  showEmptyResults();
  loadTaxData();
})();
