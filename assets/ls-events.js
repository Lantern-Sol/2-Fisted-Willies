/**
 * Sort event cards in a grid/list by data-event-date (YYYY-MM-DD).
 * @param {HTMLElement} container
 * @param {'asc' | 'desc'} order
 */
function sortEventCards(container, order = 'asc') {
  const cards = [...container.querySelectorAll(':scope > .ls-event-card')];
  if (cards.length < 2) return;

  cards.sort((a, b) => {
    const da = a.dataset.eventDate ?? '';
    const db = b.dataset.eventDate ?? '';
    return order === 'desc' ? db.localeCompare(da) : da.localeCompare(db);
  });

  cards.forEach((card) => container.appendChild(card));
}

/** Sort all event sections on the page. */
function sortAllEventSections() {
  document.querySelectorAll('.ls-events__featured-list').forEach((list) => {
    sortEventCards(list, 'asc');
  });

  document.querySelectorAll('.ls-events--upcoming .ls-events__grid').forEach((grid) => {
    sortEventCards(grid, 'asc');
  });

  document.querySelectorAll('.ls-events--past .ls-events__grid').forEach((grid) => {
    sortEventCards(grid, 'desc');
  });
}

class LsEventsUpcoming extends HTMLElement {
  #category = 'all';
  #tag = 'all';

  connectedCallback() {
    const grid = this.querySelector('.ls-events__grid');
    if (grid) sortEventCards(grid, 'asc');

    this.#bindFilters('[data-category-filter]', 'category');
    this.#bindFilters('[data-tag-filter]', 'tag');
    this.#applyFilters();
  }

  #bindFilters(selector, type) {
    this.querySelectorAll(selector).forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.categoryFilter ?? button.dataset.tagFilter ?? 'all';
        if (type === 'category') this.#category = value;
        else this.#tag = value;

        this.querySelectorAll(selector).forEach((btn) => {
          btn.classList.toggle('is-active', btn === button);
          btn.setAttribute('aria-pressed', btn === button ? 'true' : 'false');
        });

        this.#applyFilters();
      });
    });
  }

  #applyFilters() {
    const cards = this.querySelectorAll('[data-event-card]');
    let visible = 0;

    cards.forEach((card) => {
      const cardCategory = card.dataset.category ?? '';
      const cardTags = (card.dataset.tags ?? '').split(',').filter(Boolean);

      const categoryMatch = this.#category === 'all' || cardCategory === this.#category;
      const tagMatch = this.#tag === 'all' || cardTags.includes(this.#tag);
      const show = categoryMatch && tagMatch;

      card.toggleAttribute('hidden', !show);
      if (show) visible += 1;
    });

    const countEl = this.querySelector('[data-upcoming-count]');
    if (countEl) {
      countEl.textContent = `${visible} UPCOMING`;
    }

    const emptyEl = this.querySelector('[data-upcoming-empty]');
    if (emptyEl) {
      emptyEl.toggleAttribute('hidden', visible > 0);
    }
  }
}

if (!customElements.get('ls-events-upcoming')) {
  customElements.define('ls-events-upcoming', LsEventsUpcoming);
}

sortAllEventSections();
