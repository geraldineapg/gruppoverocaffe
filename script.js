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

document.querySelectorAll('.quote-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const phone = form.dataset.wa;
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
    if (!lines.length) return;
    const message = `${title}\n\n${lines.join('\n')}`;

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
