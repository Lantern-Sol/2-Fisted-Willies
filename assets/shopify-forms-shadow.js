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

  const DATE_EXTRA_CSS = `
    ._formFieldContainer_1mxsl_5:has(input[id*="date"]) input[id*="date"] {
      color-scheme: dark;
    }
    ._formFieldContainer_1mxsl_5:has(input[id*="date"]) input[id*="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      cursor: pointer;
    }
  `;

  /** @param {ShadowRoot} shadow */
  function applyDateInputs(shadow) {
    shadow.querySelectorAll('input[id*="date"]').forEach((input) => {
      if (input.type !== 'date') input.type = 'date';
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
