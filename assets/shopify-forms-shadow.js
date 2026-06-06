(function () {
  const STYLE_ID = 'theme-shopify-forms-style';
  const script = document.getElementById('shopify-forms-shadow-styles');
  const cssUrl = script?.dataset.stylesheetUrl;

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
  }

  /** @param {Element} host */
  function inject(host) {
    const shadow = host.shadowRoot;
    if (!shadow || shadow.getElementById(STYLE_ID)) return;

    loadCss()
      .then((css) => {
        if (shadow.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css + DATE_EXTRA_CSS;
        shadow.appendChild(style);
        applyDateInputs(shadow);
        applyPlaceholders(shadow);
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
