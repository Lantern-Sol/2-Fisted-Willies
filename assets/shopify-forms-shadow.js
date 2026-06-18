(function () {
  const STYLE_ID = 'theme-shopify-forms-style';
  const NEWSLETTER_STYLE_ID = 'theme-shopify-forms-newsletter-style';
  const script = document.getElementById('shopify-forms-shadow-styles');
  const cssUrl = script?.dataset.stylesheetUrl;

  // Selector marking embeds that should get the newsletter look (transparent
  // underline input + light-blue button). Only the embed inside the LS
  // Newsletter Signup SMS tab matches, so other forms (contact, event) are
  // untouched.
  const NEWSLETTER_HOST_SELECTOR = '.newsletter-signup__panel--sms';

  // Override layered on top of the base shadow styles, injected ONLY into the
  // newsletter embed's shadow root. Because each shadow root is isolated, these
  // plain element selectors can't leak to other forms — so we avoid the hashed
  // class names (which change on app updates) and target stable attributes.
  const NEWSLETTER_CSS = `
    /* Lift the 620px form cap from the base styles so the form fills the panel. */
    [class*="_container_"],
    [class*="_inline_"],
    [class*="_formContainer_"],
    [data-sizing="form-wrapper"] {
      max-width: none !important;
      width: 100% !important;
    }
    /* Collapse the dead space below the form. The embed host is ~71px taller
       than the form because the form container is a grid sized for an image
       cell (hidden) plus a content cell. Force rows to size to content and drop
       any min-height so the host shrinks to the form. (No padding involved.) */
    [class*="_formContainer_"] {
      min-height: 0 !important;
      grid-template-rows: auto !important;
      align-content: start !important;
      row-gap: 0 !important;
    }
    /* Drop the bottom padding on the grid content cell (the dead band below the
       form row). */
    [class*="_gridItemContent_"],
    [class*="_gridItem_"] {
      padding-block-end: 0 !important;
      padding-bottom: 0 !important;
    }
    input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]) {
      width: 100% !important;
      box-sizing: border-box !important;
      border: 0 !important;
      border-bottom: 1px solid rgb(255 255 255 / 0.2) !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: #eae8f0 !important;
      padding: 16px 24px !important;
    }
    /* Let the input stretch to its container's full width. */
    [class*="_formFieldContainer_"] > * {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    /* Remove the phone field label. */
    label[class*="_formInputFieldLabel_"] {
      display: none !important;
    }
    input::placeholder {
      color: #eae8f0 !important;
      opacity: 1;
    }
    /* Specificity tuned to tie/beat the base shadow stylesheet (which uses
       !important): the base focus rule is input.<class>:focus-visible (0,2,1)
       and the base button is div button.<class> (0,1,2). Matching those and
       appending later lets the override win. [class*="_..._"] also survives
       the app rehashing its generated class names. */
    input[class*="_formInputField_"]:focus-visible {
      outline: none !important;
      box-shadow: none !important;
      border-bottom-color: #b8c8f2 !important;
    }
    /* Mirror the email tab's .newsletter-signup__submit button. (--font-body--family
       inherits through the shadow boundary, so the font matches.) max-width / margin
       / width / border-radius also override the base shadow stylesheet. */
    div button[class*="_formSubmitButton_"],
    button[type="submit"] {
      flex: 0 0 auto !important;
      background-color: #b8c8f2 !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 16px !important;
      font-family: var(--font-body--family) !important;
      font-weight: 500 !important;
      font-size: 16px !important;
      line-height: 24px !important;
      letter-spacing: 2.4px !important;
      text-transform: uppercase !important;
      color: #004fdf !important;
      white-space: nowrap !important;
      cursor: pointer !important;
      max-width: none !important;
      margin: 0 !important;
      width: auto !important;
    }
    /* One row: the phone widget fills the width and the submit button sits
       beside it. The number input is nested two levels deep
       (form > _formPhoneInputContainer_ > _formFieldContainer_ > input), so the
       grow has to be applied at every level or the widget collapses to the
       country flag's width. */
    form[class*="_formFieldset_"] {
      flex-wrap: nowrap !important;
      align-items: flex-end !important;
      gap: 0 !important;
    }
    /* Neutralize the base calc(100% - 2px) on every form child. */
    form[class*="_formFieldset_"] > * {
      width: auto !important;
    }
    /* Phone widget (the actual form child) fills the row. Scoped under the form
       so it out-specifies the app's own flex rule on this container (which was
       pinning it to ~187px). Force display:flex so the number container can
       grow instead of shrinking to the flag's width. */
    form[class*="_formFieldset_"] > [class*="_formPhoneInputContainer_"] {
      display: flex !important;
      flex: 1 1 auto !important;
      width: auto !important;
      min-width: 0 !important;
      align-items: flex-end !important;
      /* Kill the gap/left padding that separated the (now hidden) country
         selector from the number input, so the field starts at the edge. */
      column-gap: 0 !important;
      gap: 0 !important;
      padding-inline-start: 0 !important;
      padding-left: 0 !important;
      /* Space from the submit button via margin instead of the form's row gap. */
      margin-inline-end: 16px !important;
      margin-right: 16px !important;
    }
    /* Number-input container takes all remaining space in the phone widget. */
    form[class*="_formFieldset_"] [class*="_formFieldContainer_"] {
      flex: 1 1 auto !important;
      width: 100% !important;
      min-width: 0 !important;
      padding-inline-start: 0 !important;
      padding-left: 0 !important;
    }
    /* Submit button hugs its label, never grows. */
    button[class*="_formSubmitButton_"] {
      flex: 0 0 auto !important;
    }
    /* Hide the country / flag selector. The number input still defaults to the
       US (+1), which the proxy submits, so numbers stay valid for SMS. This is
       a stable, non-hashed class. */
    .phone-country-selector {
      display: none !important;
    }
  `;

  if (!cssUrl) {
    console.warn('[shopify-forms-shadow] Missing data-stylesheet-url on #shopify-forms-shadow-styles');
    return;
  }

  /** @type {Promise<string> | null} */
  let cssPromise = null;

  function loadCss() {
    if (!cssPromise) {
      cssPromise = fetch(cssUrl).then((res) => {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      });
    }
    return cssPromise;
  }

  const DATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M16 3.184V3C16 2.20435 15.6839 1.44129 15.1213 0.87868C14.5587 0.316071 13.7956 0 13 0C12.2044 0 11.4413 0.316071 10.8787 0.87868C10.3161 1.44129 10 2.20435 10 3H8C8 2.20435 7.68393 1.44129 7.12132 0.87868C6.55871 0.316071 5.79565 0 5 0C4.20435 0 3.44129 0.316071 2.87868 0.87868C2.31607 1.44129 2 2.20435 2 3V3.184C1.41709 3.39008 0.912091 3.77123 0.554088 4.2753C0.196084 4.77937 0.00256297 5.38174 0 6V15C0 16.654 1.346 18 3 18H15C16.654 18 18 16.654 18 15V6C17.9974 5.38174 17.8039 4.77937 17.4459 4.2753C17.0879 3.77123 16.5829 3.39008 16 3.184ZM12 3C12 2.73478 12.1054 2.48043 12.2929 2.29289C12.4804 2.10536 12.7348 2 13 2C13.2652 2 13.5196 2.10536 13.7071 2.29289C13.8946 2.48043 14 2.73478 14 3V5C14 5.26522 13.8946 5.51957 13.7071 5.70711C13.5196 5.89464 13.2652 6 13 6C12.7348 6 12.4804 5.89464 12.2929 5.70711C12.1054 5.51957 12 5.26522 12 5V3ZM4 3C4 2.73478 4.10536 2.48043 4.29289 2.29289C4.48043 2.10536 4.73478 2 5 2C5.26522 2 5.51957 2.10536 5.70711 2.29289C5.89464 2.48043 6 2.73478 6 3V5C6 5.26522 5.89464 5.51957 5.70711 5.70711C5.51957 5.89464 5.26522 6 5 6C4.73478 6 4.48043 5.89464 4.29289 5.70711C4.10536 5.51957 4 5.26522 4 5V3ZM16 15C16 15.551 15.552 16 15 16H3C2.448 16 2 15.551 2 15V9H16V15Z" fill="#7E9DE4"/></svg>`;

  const DATE_EXTRA_CSS = `
    ._formFieldContainer_1mxsl_5:has(input[id*="date"]) {
      position: relative;
    }
    ._formFieldContainer_1mxsl_5:has(input[id*="date"]) input[id*="date"]::-webkit-calendar-picker-indicator {
      opacity: 0;
      cursor: pointer;
      position: absolute;
      right: 0;
      width: 44px;
      height: 100%;
    }
    ._formFieldContainer_1mxsl_5 .date-icon-overlay {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      display: flex;
      align-items: center;
      margin-top: 12px;
    }
    textarea::placeholder {
      color: #9CA0B8;
    }
  `;

  /** @param {ShadowRoot} shadow */
  function applyDateInputs(shadow) {
    shadow.querySelectorAll('input[id*="date"]').forEach((input) => {
      if (input.type !== 'date') input.type = 'date';
      const container = input.closest('._formFieldContainer_1mxsl_5');
      if (container && !container.querySelector('.date-icon-overlay')) {
        const overlay = document.createElement('span');
        overlay.className = 'date-icon-overlay';
        overlay.innerHTML = DATE_SVG;
        container.appendChild(overlay);
      }
    });
  }

  /** @param {ShadowRoot} shadow */
  function applyPlaceholders(shadow) {
    const textarea = shadow.querySelector('textarea[name="custom#additional_details"]');
    if (textarea && !textarea.placeholder) {
      textarea.placeholder = 'Tell us about entertainment needs, special requests, or any other details...';
    }

    // Contact form message field: give the lone message textarea the screenshot
    // placeholder. Skips the event form's additional_details (handled above) and
    // only fills empties, so it never clobbers a placeholder the app already set.
    shadow.querySelectorAll('textarea').forEach((ta) => {
      if (ta.name === 'custom#additional_details') return;
      if (!ta.placeholder) ta.placeholder = "What's on your mind?";
    });
  }

  /**
   * Layer the newsletter override on top of the base styles, but only for the
   * embed inside the newsletter SMS tab. Appended after the base <style> so it
   * wins, and isolated to this shadow root so it can't touch other forms.
   * @param {Element} host
   * @param {ShadowRoot} shadow
   */
  function applyNewsletterStyle(host, shadow) {
    if (!host.closest(NEWSLETTER_HOST_SELECTOR)) return;
    if (shadow.getElementById(NEWSLETTER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = NEWSLETTER_STYLE_ID;
    style.textContent = NEWSLETTER_CSS;
    shadow.appendChild(style);
  }

  /** @param {Element} host */
  function inject(host) {
    const shadow = host.shadowRoot;
    if (!shadow) return;

    // Style is injected once, but field tweaks (placeholders, date inputs) must
    // re-run on every scan: the Forms app renders fields asynchronously, so the
    // message textarea may not exist yet at first injection. These are idempotent.
    if (shadow.getElementById(STYLE_ID)) {
      applyDateInputs(shadow);
      applyPlaceholders(shadow);
      applyNewsletterStyle(host, shadow);
      return;
    }

    loadCss()
      .then((css) => {
        if (!shadow.getElementById(STYLE_ID)) {
          const style = document.createElement('style');
          style.id = STYLE_ID;
          style.textContent = css + DATE_EXTRA_CSS;
          shadow.appendChild(style);
        }
        applyDateInputs(shadow);
        applyPlaceholders(shadow);
        applyNewsletterStyle(host, shadow);
      })
      .catch((err) => {
        console.warn('[shopify-forms-shadow] Could not load styles:', err);
      });
  }

  function scan() {
    document.querySelectorAll('shopify-forms-embed').forEach(inject);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  customElements.whenDefined('shopify-forms-embed').then(scan);
})();
