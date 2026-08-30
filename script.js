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

/* Paneles de cotización — arma un mensaje de WhatsApp con lo que el usuario llenó/marcó */
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
  });
});
