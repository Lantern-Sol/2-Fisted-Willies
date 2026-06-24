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
    const section = list.closest('.ls-events--picked, .ls-events--featured');
    const sortByDate = section?.dataset.sortByDate === 'true';
    if (section?.classList.contains('ls-events--picked') && !sortByDate) return;
    sortEventCards(list, 'asc');
  });

  document.querySelectorAll('.ls-events--upcoming .ls-events__grid').forEach((grid) => {
    sortEventCards(grid, 'asc');
  });

  document.querySelectorAll('.ls-events--past .ls-events__grid').forEach((grid) => {
    sortEventCards(grid, 'desc');
  });

  document.querySelectorAll('.ls-events--picked .ls-events__grid').forEach((grid) => {
    const section = grid.closest('.ls-events--picked');
    if (section?.dataset.sortByDate !== 'true') return;
    sortEventCards(grid, 'asc');
  });
}

const EVENTBRITE_API = 'https://www.eventbriteapi.com/v3';

const TAG_ICONS = {
  featured:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1.5l1.55 3.14 3.47.5-2.51 2.45.59 3.46L8 9.77 4.9 11.15l.59-3.46L3 5.14l3.47-.5L8 1.5z"/></svg>',
  available:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 8l2 2 4-4"/></svg>',
  pre_sale:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M3 5h4l1-2h4v2h1v2h-1v2H8l-1 2H3V5zm2 2v4h2.5l.75-1.5H11V7H5.75L5.5 7.5H5z"/></svg>',
  cover:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6.5h10v7H3v-7z"/><path d="M5.5 6.5V5a2.5 2.5 0 015 0v1.5"/></svg>',
  sold_out:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/></svg>',
  past:
    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2.5 1.5"/></svg>',
};

const TAG_LABELS = {
  featured: 'Featured',
  available: 'Available',
  pre_sale: 'Pre-sale',
  cover: 'Cover',
  sold_out: 'Sold out',
  past: 'Past',
};

/** @param {string} value */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {string} tag */
function renderEventTag(tag) {
  const tagKey = tag.replace(/-/g, '_');
  const label = TAG_LABELS[tagKey] ?? tag;
  const icon = TAG_ICONS[tagKey] ?? '';

  return `<span class="ls-event-tag ls-event-tag--${escapeHtml(tagKey)}">
    <span class="ls-event-tag__icon" aria-hidden="true">${icon}</span>
    <span class="ls-event-tag__label">${escapeHtml(label).toUpperCase()}</span>
  </span>`;
}

/**
 * @param {string} local
 * @param {string} timezone
 */
function parseEventbriteLocal(local, timezone) {
  if (!local) return null;

  const match = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return new Date(local);

  const [, year, month, day, hour, minute, second = '0'] = match;
  const utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  try {
    const probe = new Date();
    const tzDate = new Date(probe.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(probe.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMs = utcDate.getTime() - tzDate.getTime();
    return new Date(utcMs + offsetMs);
  } catch {
    return new Date(local);
  }
}

/**
 * @param {string} local
 * @param {string} timezone
 * @param {'featured' | 'grid' | 'past'} layout
 */
function formatEventDateLabel(local, timezone, layout) {
  const date = parseEventbriteLocal(local, timezone);
  if (!date || Number.isNaN(date.getTime())) return '';

  const formatted = date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const parts = formatted.replace(',', '').split(' ');
  if (parts.length < 3) return formatted.toUpperCase();

  const [weekday, month, day] = parts;
  return layout === 'featured'
    ? `${weekday} ${month} ${day}`.toUpperCase()
    : `${weekday}, ${month} ${day}`.toUpperCase();
}

/** @param {string} local @param {string} timezone */
function formatEventTimeLabel(local, timezone) {
  const date = parseEventbriteLocal(local, timezone);
  if (!date || Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** @param {Record<string, unknown>} event */
function isEventSoldOut(event) {
  const classes = event.ticket_classes ?? [];
  if (classes.length === 0) return false;

  return classes.every((ticketClass) => {
    if (ticketClass.on_sale_status === 'SOLD_OUT') return true;
    if (
      ticketClass.quantity_total != null &&
      ticketClass.quantity_sold != null &&
      ticketClass.quantity_total > 0 &&
      ticketClass.quantity_sold >= ticketClass.quantity_total
    ) {
      return true;
    }
    return false;
  });
}

/** @param {Record<string, unknown>} event */
function getEventStatusTag(event) {
  if (isEventSoldOut(event)) return 'sold_out';
  if (event.is_free) return 'available';
  return 'cover';
}

/**
 * @param {Record<string, unknown>} event
 * @param {'featured' | 'grid' | 'past'} layout
 */
function mapEventbriteEvent(event, layout) {
  const local = event.start?.local ?? '';
  const timezone = event.start?.timezone ?? 'America/New_York';
  const dateIso = local.split('T')[0] ?? '';
  const timeLabel = formatEventTimeLabel(local, timezone);
  const price = event.ticket_classes?.[0]?.cost?.display ?? '';
  const isSoldOut = isEventSoldOut(event);
  const statusTag = layout === 'past' ? 'past' : getEventStatusTag(event);

  let showInfo = 'SHOW';
  if (timeLabel) showInfo += ` · ${timeLabel}`;
  if (!event.is_free && price) showInfo += ` · ${price}`;

  return {
    id: event.id,
    name: event.name?.text ?? '',
    description: event.description?.text ?? '',
    imageUrl: event.logo?.original?.url ?? event.logo?.url ?? '',
    ticketUrl: event.url ?? '',
    summary: event.summary ?? '',
    dateIso,
    dateLabel: formatEventDateLabel(local, timezone, layout),
    showInfo,
    isSoldOut,
    statusTag,
  };
}

/**
 * @param {ReturnType<typeof mapEventbriteEvent>} event
 * @param {{ filterable?: boolean }} options
 */
function renderGridEventCard(event, options = {}) {
  const { filterable = false } = options;
  const filterAttrs = filterable
    ? ` data-event-card data-category="" data-tags="${escapeHtml(event.statusTag)}"`
    : '';

  const media = event.imageUrl
    ? `<img class="ls-event-card__image" src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" width="800" height="450">`
    : '<div class="ls-event-card__image ls-event-card__image--placeholder" aria-hidden="true"></div>';

  const badge = event.statusTag ? renderEventTag(event.statusTag) : '';

  let cta = '';
  if (event.isSoldOut) {
    cta = '<span class="ls-event-card__cta ls-event-card__cta--sold-out" aria-disabled="true">Sold out</span>';
  } else if (event.ticketUrl) {
    cta = `<a class="ls-event-card__cta" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">
      Get tickets
      <span class="ls-event-card__cta-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  const genre = event.summary
    ? `<p class="ls-event-card__genre">${escapeHtml(event.summary)}</p>`
    : '';

  return `<article class="ls-event-card ls-event-card--grid" data-event-date="${escapeHtml(event.dateIso)}"${filterAttrs}>
    <div class="ls-event-card__media">
      ${media}
      <div class="ls-event-card__badges">${badge}</div>
    </div>
    <div class="ls-event-card__content">
      <div class="ls-event-card__info-row">
        <time class="ls-event-card__date" datetime="${escapeHtml(event.dateIso)}">${escapeHtml(event.dateLabel)}</time>
        <span class="ls-event-card__show">${escapeHtml(event.showInfo)}</span>
        <span class="ls-event-card__age">21+</span>
      </div>
      ${event.name ? `<h3 class="ls-event-card__name">${escapeHtml(event.name)}</h3>` : ''}
      ${genre}
      ${cta}
    </div>
  </article>`;
}

/**
 * @param {ReturnType<typeof mapEventbriteEvent>} event
 * @param {{ filterable?: boolean }} options
 */
function renderFeaturedEventCard(event, options = {}) {
  const { filterable = false } = options;
  const filterAttrs = filterable
    ? ` data-event-card data-category="" data-tags="${escapeHtml(event.statusTag)}"`
    : '';

  const media = event.imageUrl
    ? `<img class="ls-event-card__image" src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" width="600" height="300">`
    : '<div class="ls-event-card__image ls-event-card__image--placeholder" aria-hidden="true"></div>';

  const genre = event.summary
    ? `<p class="ls-event-card__genre">${escapeHtml(event.summary)}</p>`
    : '';

  const actions =
    !event.isSoldOut && event.ticketUrl
      ? `<div class="ls-event-card__actions">
          <a class="ls-event-card__cta" href="${escapeHtml(event.ticketUrl)}" target="_blank" rel="noopener noreferrer">
            Get tickets
            <span class="ls-event-card__cta-arrow" aria-hidden="true">→</span>
          </a>
        </div>`
      : '';

  return `<article class="ls-event-card ls-event-card--featured" data-event-date="${escapeHtml(event.dateIso)}"${filterAttrs}>
    <div class="ls-event-card__media">${media}</div>
    <div class="ls-event-card__body">
      <div class="ls-event-card__meta-top">
        <time class="ls-event-card__date" datetime="${escapeHtml(event.dateIso)}">${escapeHtml(event.dateLabel)}</time>
      </div>
      <div class="ls-event-card__meta-mid">
        ${event.name ? `<h3 class="ls-event-card__name">${escapeHtml(event.name)}</h3>` : ''}
        ${genre}
      </div>
      <p class="ls-event-card__quick">${escapeHtml(event.showInfo)} <span class="ls-event-card__age">21+</span></p>
    </div>
    ${actions}
  </article>`;
}

/** @param {ReturnType<typeof mapEventbriteEvent>} event */
function renderPastEventCard(event) {
  const mapped = { ...event, statusTag: 'past' };
  const media = event.imageUrl
    ? `<img class="ls-event-card__image" src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" width="800" height="450">`
    : '<div class="ls-event-card__image ls-event-card__image--placeholder" aria-hidden="true"></div>';

  const genre = event.summary
    ? `<p class="ls-event-card__genre">${escapeHtml(event.summary)}</p>`
    : '';

  return `<article class="ls-event-card ls-event-card--past" data-event-date="${escapeHtml(event.dateIso)}">
    <div class="ls-event-card__media">
      ${media}
      <div class="ls-event-card__badges">${renderEventTag('past')}</div>
    </div>
    <div class="ls-event-card__content">
      <div class="ls-event-card__info-row">
        <time class="ls-event-card__date" datetime="${escapeHtml(event.dateIso)}">${escapeHtml(mapped.dateLabel)}</time>
        <span class="ls-event-card__show">${escapeHtml(event.showInfo)}</span>
        <span class="ls-event-card__age">21+</span>
      </div>
      ${event.name ? `<h3 class="ls-event-card__name">${escapeHtml(event.name)}</h3>` : ''}
      ${genre}
      <span class="ls-event-card__cta ls-event-card__cta--ended" aria-disabled="true">Event ended</span>
    </div>
  </article>`;
}

/**
 * @param {ReturnType<typeof mapEventbriteEvent>} event
 * @param {'featured' | 'grid' | 'past'} layout
 * @param {{ filterable?: boolean }} options
 */
function renderEventCard(event, layout, options = {}) {
  if (layout === 'featured') return renderFeaturedEventCard(event, options);
  if (layout === 'past') return renderPastEventCard(event);
  return renderGridEventCard(event, options);
}

/** @returns {string} */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {string} orgId
 * @param {string} token
 * @param {string} status
 */
async function fetchEventbriteEvents(orgId, token, status = 'live') {
  const params = new URLSearchParams({
    status,
    expand: 'venue,ticket_classes',
    token,
  });

  const response = await fetch(`${EVENTBRITE_API}/organizations/${orgId}/events/?${params}`);
  if (!response.ok) {
    throw new Error(`Eventbrite API error (${response.status})`);
  }

  const data = await response.json();
  return data.events ?? [];
}

/**
 * @param {Record<string, unknown>[]} events
 * @param {'upcoming' | 'past'} filter
 */
function filterEventsByDate(events, filter) {
  const today = todayIso();

  return events.filter((event) => {
    const dateIso = event.start?.local?.split('T')[0] ?? '';
    if (!dateIso) return false;
    return filter === 'past' ? dateIso < today : dateIso >= today;
  });
}

/**
 * @param {HTMLElement} grid
 * @param {Record<string, unknown>[]} events
 */
function renderEventsIntoGrid(grid, events) {
  const layout = grid.dataset.eventbriteLayout ?? 'grid';
  const filterable = grid.dataset.eventbriteFilterable === 'true';
  const maxEvents = Number(grid.dataset.eventbriteMax ?? 0);
  const sortOrder = grid.dataset.eventbriteSort ?? 'asc';
  const featuredIds = (grid.dataset.eventbriteFeaturedIds ?? '')
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);

  let filtered = [...events];

  if (featuredIds.length > 0) {
    filtered = filtered.filter((event) => featuredIds.includes(String(event.id)));
  }

  if (sortOrder === 'desc') {
    filtered.sort((a, b) => {
      const da = a.start?.local?.split('T')[0] ?? '';
      const db = b.start?.local?.split('T')[0] ?? '';
      return db.localeCompare(da);
    });
  } else {
    filtered.sort((a, b) => {
      const da = a.start?.local?.split('T')[0] ?? '';
      const db = b.start?.local?.split('T')[0] ?? '';
      return da.localeCompare(db);
    });
  }

  if (maxEvents > 0) {
    filtered = filtered.slice(0, maxEvents);
  }

  const html = filtered
    .map((event) => renderEventCard(mapEventbriteEvent(event, layout), layout, { filterable }))
    .join('');

  grid.innerHTML = html;
  sortEventCards(grid, sortOrder === 'desc' ? 'desc' : 'asc');

  return filtered.length;
}

/** @param {HTMLElement} root */
function hideEventbriteSection(root) {
  const shopifySection = root.closest('.shopify-section');
  if (shopifySection) shopifySection.hidden = true;
}

/**
 * @param {HTMLElement} root
 */
async function loadEventbriteGrid(root) {
  const token = root.dataset.eventbriteToken;
  const orgId = root.dataset.eventbriteOrgId;
  const grid = root.querySelector('[data-eventbrite-grid]');

  if (!token || !orgId || !grid) return;

  const dateFilter = grid.dataset.eventbriteDateFilter ?? 'upcoming';
  const apiStatus = grid.dataset.eventbriteStatus ?? (dateFilter === 'past' ? 'ended' : 'live');
  const loadingEl = root.querySelector('[data-eventbrite-loading]');
  const emptyEl = root.querySelector('[data-eventbrite-empty]');
  const errorEl = root.querySelector('[data-eventbrite-error]');

  if (loadingEl) loadingEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;
  if (errorEl) errorEl.hidden = true;

  try {
    const events = await fetchEventbriteEvents(orgId, token, apiStatus);
    const dateFiltered = filterEventsByDate(events, dateFilter === 'past' ? 'past' : 'upcoming');
    const count = renderEventsIntoGrid(grid, dateFiltered);

    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) errorEl.hidden = true;

    const shouldHideSection = root.dataset.eventbriteHideWhenEmpty !== 'false';
    if (count === 0 && shouldHideSection) {
      hideEventbriteSection(root);
    } else if (emptyEl) {
      emptyEl.hidden = count > 0;
    }

    const upcomingComponent = root.closest('ls-events-upcoming');
    if (upcomingComponent instanceof LsEventsUpcoming) {
      upcomingComponent.refreshAfterLoad(count);
    }

    root.dispatchEvent(
      new CustomEvent('ls-events:loaded', {
        bubbles: true,
        detail: { count, grid },
      })
    );
  } catch (error) {
    if (loadingEl) loadingEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent =
        error instanceof Error ? error.message : 'Unable to load events from Eventbrite.';
    }
  }
}

/** @param {ParentNode} [scope] */
function initEventbriteSections(scope = document) {
  scope.querySelectorAll('[data-eventbrite-token]').forEach((root) => {
    if (!(root instanceof HTMLElement)) return;
    if (root.tagName === 'LS-EVENTS-UPCOMING') return;
    loadEventbriteGrid(root);
  });
}

class LsEventsUpcoming extends HTMLElement {
  #category = 'all';
  #tag = 'all';

  connectedCallback() {
    this.#bindFilters('[data-category-filter]', 'category');
    this.#bindFilters('[data-tag-filter]', 'tag');

    if (this.dataset.eventbriteToken) {
      loadEventbriteGrid(this);
    } else {
      const grid = this.querySelector('.ls-events__grid');
      if (grid) sortEventCards(grid, 'asc');
      this.#applyFilters();
    }
  }

  /** @param {number} count */
  refreshAfterLoad(count) {
    const grid = this.querySelector('.ls-events__grid');
    if (grid) sortEventCards(grid, 'asc');
    this.#applyFilters(count);
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

  /** @param {number | undefined} totalCount */
  #applyFilters(totalCount) {
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
      const hasCards = cards.length > 0;
      emptyEl.toggleAttribute('hidden', !hasCards || visible > 0);
    }

    const sectionEmptyEl = this.querySelector('[data-eventbrite-empty]');
    if (sectionEmptyEl && totalCount === 0 && this.dataset.eventbriteHideWhenEmpty === 'false') {
      sectionEmptyEl.hidden = false;
    }
  }
}

if (!customElements.get('ls-events-upcoming')) {
  customElements.define('ls-events-upcoming', LsEventsUpcoming);
}

initEventbriteSections();
sortAllEventSections();
