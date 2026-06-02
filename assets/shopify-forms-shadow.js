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

  /** @param {Element} host */
  function inject(host) {
    const shadow = host.shadowRoot;
    if (!shadow || shadow.getElementById(STYLE_ID)) return;

    loadCss()
      .then((css) => {
        if (shadow.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        shadow.appendChild(style);
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
