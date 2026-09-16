/* =========================================
   Better Math Education - progress tracker
   Adds a "Done" toggle to every question on any
   page of the site and remembers it in the
   visitor's browser (localStorage), so regulars
   can track which questions they've completed.

   Works across all four page layouts on the site
   (P1, P2, and both Olympiad pages) without needing
   the underlying question markup to be identical -
   it just looks for whichever question containers
   exist on the current page.

   No accounts, no server: progress is stored only
   in this browser, on this device. Clearing browser
   data / site data will reset it.
========================================= */

(function () {
  const STORAGE_KEY = 'bettermath-progress-v1';

  // Each entry: which elements count as "one question", and where to
  // find that question's own label/number inside it.
  const QUESTION_CONFIGS = [
    { container: '.q-item', label: '.q-item-label' },           // P1 (index.html)
    { container: '.qplain', label: '.qplain-title' },           // P2
    { container: '.problem', label: 'h3' },                     // Olympiad Grade 10-12
    { container: 'details.question', label: ':scope > summary' } // Olympiad Tertiary
  ];

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // localStorage unavailable (private browsing etc.) - fail silently,
      // the Done buttons still work for the current page view.
    }
  }

  function cleanText(str) {
    return (str || '').replace(/\s+/g, ' ').trim();
  }

  function closestText(el, selector) {
    const found = el.closest(selector);
    if (!found) return '';
    const summary = found.querySelector(':scope > summary');
    if (summary) return cleanText(summary.textContent);
    return cleanText(found.id || '');
  }

  function buildKey(pageId, container, labelEl, usedKeys) {
    const topicText = closestText(container, 'details.topic');
    const yearText = closestText(container, 'details.yr, details.year');
    const labelText = cleanText(labelEl ? labelEl.textContent : '');
    let base = [pageId, topicText, yearText, labelText].join(' :: ');

    // Safety net in the rare case two questions land on an identical key
    // (keeps each checkbox independent instead of merging their state).
    let key = base;
    let n = 1;
    while (usedKeys.has(key)) {
      n += 1;
      key = base + ' #' + n;
    }
    usedKeys.add(key);
    return key;
  }

  function injectStyles() {
    if (document.getElementById('bm-progress-style')) return;
    const style = document.createElement('style');
    style.id = 'bm-progress-style';
    style.textContent = `
      .bm-done-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-left: 10px;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid #bbb;
        background: #f7f7f7;
        font-size: 0.78em;
        font-weight: 600;
        color: #555;
        cursor: pointer;
        vertical-align: middle;
        user-select: none;
        white-space: nowrap;
      }
      .bm-done-toggle input { cursor: pointer; margin: 0; }
      .bm-done-toggle.bm-checked {
        background: #e3f6e6;
        border-color: #4caf7d;
        color: #217a46;
      }
      .bm-done-strike {
        text-decoration: line-through;
        text-decoration-thickness: 2px;
        opacity: 0.65;
      }
      #bm-progress-widget {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        font-size: 0.85em;
        color: #333;
        max-width: 220px;
        overflow: hidden;
      }
      #bm-progress-widget .bm-pw-head {
        padding: 8px 12px;
        background: #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-weight: 700;
      }
      #bm-progress-widget .bm-pw-body {
        padding: 10px 12px;
      }
      #bm-progress-widget .bm-pw-bar-track {
        background: #e5e5e5;
        border-radius: 6px;
        height: 8px;
        overflow: hidden;
        margin: 6px 0 10px;
      }
      #bm-progress-widget .bm-pw-bar-fill {
        height: 100%;
        background: #4caf7d;
        width: 0%;
        transition: width 0.2s ease;
      }
      #bm-progress-widget button {
        font-size: 0.85em;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #bbb;
        background: #fafafa;
        cursor: pointer;
      }
      #bm-progress-widget button:hover { background: #eee; }
      #bm-progress-widget.bm-collapsed .bm-pw-body { display: none; }
    `;
    document.head.appendChild(style);
  }

  function buildWidget(pageKeys, store) {
    if (document.getElementById('bm-progress-widget')) return null;

    const widget = document.createElement('div');
    widget.id = 'bm-progress-widget';
    widget.innerHTML = `
      <div class="bm-pw-head">
        <span>Your progress ▾</span>
      </div>
      <div class="bm-pw-body">
        <div class="bm-pw-count">0 / 0 done</div>
        <div class="bm-pw-bar-track"><div class="bm-pw-bar-fill"></div></div>
        <button class="bm-pw-reset" type="button">Reset this page</button>
      </div>
    `;
    document.body.appendChild(widget);

    const head = widget.querySelector('.bm-pw-head');
    head.addEventListener('click', () => widget.classList.toggle('bm-collapsed'));

    widget.querySelector('.bm-pw-reset').addEventListener('click', () => {
      if (!confirm('Reset your Done progress for this page? This cannot be undone.')) return;
      const current = loadStore();
      pageKeys.forEach((key) => delete current[key]);
      saveStore(current);
      document.querySelectorAll('.bm-done-toggle input[type="checkbox"]').forEach((cb) => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
      });
    });

    return widget;
  }

  function updateWidget(widget, pageKeys, store) {
    if (!widget) return;
    const total = pageKeys.length;
    const done = pageKeys.filter((k) => store[k]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    widget.querySelector('.bm-pw-count').textContent = `${done} / ${total} done`;
    widget.querySelector('.bm-pw-bar-fill').style.width = pct + '%';
  }

  function init() {
    injectStyles();
    const store = loadStore();
    const pageId = location.pathname.split('/').pop() || 'home';
    const usedKeys = new Set();
    const pageKeys = [];
    let widget = null;

    QUESTION_CONFIGS.forEach((cfg) => {
      document.querySelectorAll(cfg.container).forEach((container) => {
        try {
        const labelEl = container.querySelector(cfg.label);
        if (!labelEl) return;

        const key = buildKey(pageId, container, labelEl, usedKeys);
        pageKeys.push(key);

        const toggle = document.createElement('label');
        toggle.className = 'bm-done-toggle';
        toggle.innerHTML = '<input type="checkbox"> Done';
        const checkbox = toggle.querySelector('input');
        checkbox.checked = !!store[key];
        if (checkbox.checked) {
          toggle.classList.add('bm-checked');
          labelEl.classList.add('bm-done-strike');
        }

        checkbox.addEventListener('click', (e) => e.stopPropagation());
        checkbox.addEventListener('change', () => {
          const current = loadStore();
          if (checkbox.checked) {
            current[key] = true;
            toggle.classList.add('bm-checked');
            labelEl.classList.add('bm-done-strike');
          } else {
            delete current[key];
            toggle.classList.remove('bm-checked');
            labelEl.classList.remove('bm-done-strike');
          }
          saveStore(current);
          updateWidget(widget, pageKeys, current);
        });

        labelEl.insertAdjacentElement('afterend', toggle);
        } catch (err) {
          // Don't let one unexpected markup shape stop the rest of the page.
        }
      });
    });

    if (pageKeys.length) {
      widget = buildWidget(pageKeys, store);
      updateWidget(widget, pageKeys, store);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
