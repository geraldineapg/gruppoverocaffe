const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

/* Paneles de cotización — muestra/oculta sub-campos según checkbox marcado */
document.querySelectorAll('.quote-check input[data-toggles]').forEach(cb => {
  const target = document.getElementById(cb.dataset.toggles);
  const sync = () => { if (target) target.style.display = cb.checked ? 'block' : 'none'; };
  cb.addEventListener('change', sync);
  sync();
});

/* Paneles de cotización — arma un mensaje con lo que el usuario llenó/marcó y lo manda por WhatsApp y correo a la vez */
const WEB3FORMS_ACCESS_KEY = '49cd053b-78fb-47ec-bcf5-bdfdd3549211';

function buildQuoteMessage(form){
  const title = form.dataset.title || 'Solicitud de cotización';
  const lines = [];
  form.querySelectorAll('[name]').forEach(el => {
    const wrap = el.closest('.quote-field, .quote-check');
    const labelEl = wrap ? wrap.querySelector('.quote-field-label, .quote-check-label') : null;
    const label = labelEl ? labelEl.textContent.trim() : el.name;
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked) lines.push(`• ${label}`);
    } else if (el.value && el.value.trim()) {
      lines.push(`${label}: ${el.value.trim()}`);
    }
  });
  return { title, lines, message: lines.length ? `${title}\n\n${lines.join('\n')}` : '' };
}
window.buildQuoteMessage = buildQuoteMessage;

document.querySelectorAll('.quote-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const phone = form.dataset.wa;
    const { title, lines, message } = buildQuoteMessage(form);
    if (!lines.length) return;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: title,
      message: message,
    };
    if (form.dataset.cc) payload.cc = form.dataset.cc;

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    form.dispatchEvent(new CustomEvent('quote:sent'));
  });
});

/* Galerías con banco de fotos — muestra un número fijo de fotos, elegidas al azar de un grupo más grande, en cada carga */
document.querySelectorAll('[data-rotate-pool]').forEach(grid => {
  let pool;
  try { pool = JSON.parse(grid.dataset.rotatePool); } catch (e) { return; }
  const slots = grid.querySelectorAll('.photo-rotate');
  if (!pool.length || !slots.length) return;

  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  slots.forEach((fig, i) => {
    const pick = shuffled[i % shuffled.length];
    const img = fig.querySelector('img');
    const caption = fig.querySelector('figcaption');
    if (img) { img.src = pick.src; img.alt = pick.alt; }
    if (caption) caption.textContent = pick.caption;
  });
});

/* Cotizador por pasos — mejora progresiva sobre los .quote-form que tienen servicios (.quote-check) */
document.querySelectorAll('.quote-form').forEach(form => {
  const grid = form.querySelector(':scope > .quote-fields-grid');
  const reqTitle = form.querySelector(':scope > .quote-req-title');
  const submit = form.querySelector(':scope > .quote-submit');
  const checks = [...form.querySelectorAll(':scope > .quote-check')];
  if (!grid || !reqTitle || !submit || !checks.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labels = ['Tu empresa', 'Servicios', 'Detalles', 'Enviar'];
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

  const services = checks.map(c => {
    const next = c.nextElementSibling;
    const sub = next && next.classList.contains('quote-subfields') ? next : null;
    return { check: c, input: c.querySelector('input'), text: c.querySelector('.quote-check-label').textContent.trim(), sub };
  });

  form.classList.add('is-wizard');
  const progress = el('ol', 'qw-progress');
  const steps = [0, 1, 2, 3].map(() => el('div', 'qw-step'));
  const tiles = el('div', 'qw-tiles');
  const details = el('div', 'qw-details');
  const noDetail = el('p', 'qw-nodetail', 'Para los servicios que elegiste no necesitamos más detalles. Continúa para revisar tu solicitud.');
  const summary = el('div', 'qw-summary');
  const error = el('p', 'qw-error'); error.setAttribute('role', 'alert');
  const nav = el('div', 'qw-nav');
  const back = el('button', 'qw-back', 'Atrás'); back.type = 'button';
  const next = el('button', 'qw-next', 'Continuar'); next.type = 'button';

  labels.forEach((t, i) => {
    const li = el('li'); const b = el('button', '', `<span class="qw-num">${i + 1}</span><span class="qw-lbl">${t}</span>`);
    b.type = 'button'; b.addEventListener('click', () => { if (i <= maxStep) go(i); }); li.appendChild(b); progress.appendChild(li);
  });

  const h = (txt) => el('h3', 'qw-title', txt);
  steps[0].append(h('Cuéntanos sobre tu empresa'), grid);
  steps[1].append(h('¿Qué necesitas?'), el('p', 'qw-hint', 'Elige uno o varios servicios.'), tiles);
  services.forEach(s => {
    tiles.appendChild(s.check);
    if (s.sub) {
      const sec = el('section', 'qw-detail'); sec.append(el('h4', '', s.text), s.sub); details.appendChild(sec); s.sec = sec;
    }
  });
  reqTitle.remove();
  steps[2].append(h('Detalles de tu pedido'), details, noDetail);
  steps[3].append(h('Revisa y envía'), summary);

  const last = el('div', 'qw-last'); last.appendChild(submit);
  nav.append(back, next, last);
  form.prepend(progress);
  form.append(...steps, error, nav);

  const mallaChips = ['12', '13', '14', '15', '16', '17', '18+', 'Caracolito'];
  form.querySelectorAll('.quote-input[name^="malla"]').forEach(inp => {
    const row = el('div', 'qw-chips');
    mallaChips.forEach(m => { const c = el('button', 'qw-chip', m); c.type = 'button'; c.addEventListener('click', () => { inp.value = inp.value === m ? '' : m; row.querySelectorAll('.qw-chip').forEach(x => x.classList.toggle('on', x.textContent === inp.value)); }); row.appendChild(c); });
    inp.addEventListener('input', () => row.querySelectorAll('.qw-chip').forEach(x => x.classList.toggle('on', x.textContent === inp.value)));
    inp.after(row);
  });

  let cur = 0, maxStep = 0;
  function activeServices() { return services.filter(s => s.input.checked); }
  function syncDetails() {
    let any = false;
    services.forEach(s => { if (s.sec) { const on = s.input.checked; s.sec.style.display = on ? '' : 'none'; if (on) any = true; } });
    noDetail.style.display = any ? 'none' : '';
  }
  function renderSummary() {
    const contact = [...grid.querySelectorAll('.quote-field')].map(f => {
      const inp = f.querySelector('input,select,textarea'); const lab = f.querySelector('.quote-field-label').textContent.trim();
      return inp && inp.value.trim() ? `<dt>${lab}</dt><dd>${inp.value.trim().replace(/</g, '&lt;')}</dd>` : '';
    }).join('');
    let html = `<div class="qw-sum-block"><div class="qw-sum-head"><span>Tu empresa</span><button type="button" data-edit="0">Editar</button></div><dl>${contact}</dl></div>`;
    const svcs = activeServices();
    html += `<div class="qw-sum-block"><div class="qw-sum-head"><span>Servicios</span><button type="button" data-edit="1">Editar</button></div><ul>${svcs.map(s => `<li>${s.text}</li>`).join('')}</ul></div>`;
    const det = svcs.filter(s => s.sub).map(s => {
      const rows = [...s.sub.querySelectorAll('.quote-field')].map(f => {
        const inp = f.querySelector('input,select,textarea'); const lab = f.querySelector('.quote-field-label').textContent.trim();
        return inp && inp.value.trim() ? `<dt>${lab}</dt><dd>${inp.value.trim().replace(/</g, '&lt;')}</dd>` : '';
      }).join('');
      const radios = [...s.sub.querySelectorAll('input[type=radio]:checked')].map(r => `<dt>Tipo</dt><dd>${r.value}</dd>`).join('');
      return rows || radios ? `<div class="qw-sum-sub"><strong>${s.text}</strong><dl>${radios}${rows}</dl></div>` : '';
    }).join('');
    if (det) html += `<div class="qw-sum-block"><div class="qw-sum-head"><span>Detalles</span><button type="button" data-edit="2">Editar</button></div>${det}</div>`;
    summary.innerHTML = html;
    summary.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => go(+b.dataset.edit)));
  }
  function go(i) {
    cur = i; maxStep = Math.max(maxStep, i); error.textContent = '';
    if (i === 2) syncDetails();
    if (i === 3) renderSummary();
    steps.forEach((s, k) => { s.classList.toggle('on', k === i); });
    progress.querySelectorAll('li').forEach((li, k) => { li.classList.toggle('cur', k === i); li.classList.toggle('done', k < i); li.querySelector('button').disabled = k > maxStep; });
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    next.style.display = i === 3 ? 'none' : '';
    last.style.display = i === 3 ? '' : 'none';
    const first = steps[i].querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea');
    if (i === 0 || i === 2) { if (first) setTimeout(() => first.focus({ preventScroll: true }), 50); }
    const top = form.getBoundingClientRect().top + scrollY - 110;
    if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
  function advance() {
    if (cur === 0) {
      const bad = [...steps[0].querySelectorAll('input,select,textarea')].find(x => !x.checkValidity());
      if (bad) { bad.reportValidity(); return; }
    }
    if (cur === 1 && !activeServices().length) { error.textContent = 'Elige al menos un servicio para continuar.'; return; }
    go(cur + 1);
  }
  next.addEventListener('click', advance);
  back.addEventListener('click', () => go(Math.max(0, cur - 1)));
  form.addEventListener('submit', e => { if (cur < 3) { e.preventDefault(); e.stopImmediatePropagation(); advance(); } }, true);
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'submit' && cur < 3) { e.preventDefault(); advance(); } });

  const done = el('div', 'qw-success');
  done.innerHTML = '<div class="qw-check" aria-hidden="true">✓</div><h3>¡Solicitud enviada!</h3><p>Abrimos WhatsApp con el detalle de tu cotización y te enviamos una copia por correo. Te responderemos con todos los detalles.</p><div class="qw-success-actions"><button type="button" class="qw-reopen">Abrir WhatsApp de nuevo</button><button type="button" class="qw-again">Hacer otra cotización</button></div>';
  form.appendChild(done);
  form.addEventListener('quote:sent', () => {
    form.classList.add('qw-done'); done.focus && done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true });
    const top = form.getBoundingClientRect().top + scrollY - 110; scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  });
  done.querySelector('.qw-reopen').addEventListener('click', () => { const m = buildQuoteMessage(form).message; if (m) window.open(`https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(m)}`, '_blank'); });
  done.querySelector('.qw-again').addEventListener('click', () => { form.reset(); form.querySelectorAll('.quote-check input[data-toggles]').forEach(cb => cb.dispatchEvent(new Event('change'))); form.querySelectorAll('.qw-chip.on').forEach(c => c.classList.remove('on')); form.classList.remove('qw-done'); maxStep = 0; go(0); });

  go(0);
});
