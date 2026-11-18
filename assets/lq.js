/* Lausitzer Quartier – gemeinsame Skripte: Tabs, Formular-Vorauswahl, Galerie-Leiste, Lightbox */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Tabs nach WAI-ARIA (Pfeiltasten, Pos1, Ende)
  function selectTab(id, focus) {
    const tab = document.getElementById(id);
    if (!tab) return;
    const list = tab.closest('[role="tablist"]');
    $$('[role="tab"]', list).forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
      if (on && focus) { t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    });
    $$('[data-go]').forEach(b => {
      const target = document.getElementById(b.dataset.go);
      if (target && list.contains(target) && b.tagName === 'BUTTON') b.setAttribute('aria-pressed', b.dataset.go === id);
    });
  }
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectTab(t.id));
      t.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectTab(tabs[n].id, true); }
      });
    });
  });
  // Elemente, die einen Tab öffnen (Buttons scrollen zur Tab-Leiste, Links folgen ihrem Anker)
  $$('[data-go]').forEach(b => b.addEventListener('click', () => {
    const tab = document.getElementById(b.dataset.go);
    if (!tab) return;
    selectTab(b.dataset.go);
    if (b.tagName === 'BUTTON') tab.closest('[role="tablist"]').scrollIntoView({ behavior, block: 'start' });
  }));

  // Interesse im Formular vorwählen (Auswahlliste oder Optionsfelder)
  const sel = $('select#interesse');
  $$('[data-interest]').forEach(a => a.addEventListener('click', () => {
    const v = a.dataset.interest;
    if (sel && [...sel.options].some(o => o.value === v)) sel.value = v;
    const r = $('input[type="radio"][data-key="' + v + '"]');
    if (r) r.checked = true;
  }));

  // Galerie-Leiste
  const rail = $('#rail');
  if (rail) {
    const step = () => rail.clientWidth * .7;
    const prev = $('#railPrev'), next = $('#railNext');
    if (prev) prev.onclick = () => rail.scrollBy({ left: -step(), behavior });
    if (next) next.onclick = () => rail.scrollBy({ left: step(), behavior });
  }

  // Lightbox
  const lb = $('#lb');
  if (!lb) return;
  const lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbX = $('#lbX'), lbPrev = $('#lbPrev'), lbNext = $('#lbNext');
  let last, group = [], idx = 0;
  const render = () => {
    const el = group[idx];
    lbImg.src = el.dataset.lb;
    lbImg.alt = el.dataset.cap || '';
    lbCap.textContent = (el.dataset.cap || '') + (group.length > 1 ? ' · ' + (idx + 1) + ' / ' + group.length : '');
  };
  const open = el => {
    last = el;
    const g = el.dataset.g;
    group = g !== undefined ? $$('[data-g="' + g + '"]') : [el];
    idx = Math.max(0, group.indexOf(el));
    lb.classList.toggle('single', group.length < 2);
    lb.classList.toggle('plan', el.classList.contains('plate'));
    render();
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lbX.focus());
  };
  const close = () => {
    if (!lb.classList.contains('open')) return;
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (last) last.focus();
  };
  const go = d => { if (group.length > 1) { idx = (idx + d + group.length) % group.length; render(); } };
  $$('[data-lb]').forEach(el => {
    el.addEventListener('click', () => open(el));
    if (el.tagName !== 'BUTTON') el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
    });
  });
  lbX.onclick = close;
  lbPrev.onclick = () => go(-1);
  lbNext.onclick = () => go(1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb).filter(b => b.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
})();
