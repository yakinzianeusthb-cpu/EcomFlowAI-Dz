/**
 * The script of every generated landing page (the page's own data sits in the JSON block before it). One constant,
 * the same in every page, so the app's content security policy can allow exactly this script, by its hash, in the
 * live preview (see vite.config.ts). Written in ES5: buyers open these pages in old phones' browsers and in
 * Facebook's in-app browser.
 *
 * It runs the photo dots, the quantity and the order total, the order form (checks, then the order goes to the
 * seller's WhatsApp and/or web address), the bottom bar (hidden while the first button or the form is on screen)
 * and the gentle reveal of the sections below the fold (none when the visitor asks for reduced motion).
 */
export const LANDING_PAGE_SCRIPT = `
(function () {
  var doc = document;
  var cfg = JSON.parse(doc.getElementById('lp-config').textContent);
  var money = cfg.money;
  var form = doc.getElementById('order-form');
  var error = doc.getElementById('order-error');
  var thanks = doc.getElementById('order-thanks');
  var phoneOk = new RegExp(cfg.phonePattern);
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var watch = 'IntersectionObserver' in window;

  function amount(n) { return money.prefix + String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, money.sep) + money.suffix; }
  // the WhatsApp link drops no-break spaces: plain digits there
  function plain(n) { return (money.prefix + n + money.suffix).replace(/[\\u00a0\\u202f]/g, ' '); }
  function quantity() { return Math.max(1, Math.min(20, parseInt(form.elements.quantity.value, 10) || 1)); }
  function totals() {
    if (money.unit === null) return null;
    var sub = money.unit * quantity();
    return { sub: sub, total: sub + (money.feeMode === 'fixed' ? money.fee : 0) };
  }
  function put(id, text) { var el = doc.getElementById(id); if (el) el.textContent = text; }
  function refresh() {
    var t = totals();
    put('sum-qty', String(quantity()));
    if (!t) return;
    put('sum-sub', amount(t.sub));
    put('sum-total', amount(t.total));
  }

  form.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = form.elements.quantity;
      q.value = Math.max(1, Math.min(20, (parseInt(q.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
      refresh();
    });
  });
  form.elements.quantity.addEventListener('input', refresh);

  var required = ['name', 'phone', 'wilaya', 'address'];
  function fail(message, field) {
    error.textContent = message;
    error.hidden = false;
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var order = { product: cfg.product, price: cfg.price, name: f.name.value.trim(), phone: f.phone.value.replace(/[\\s.-]/g, ''), wilaya: f.wilaya.value, address: f.address.value.trim(), quantity: quantity(), date: new Date().toISOString() };
    var t = totals();
    if (t) order.total = t.total;
    if (cfg.deliveryText) order.delivery = cfg.deliveryText;
    error.hidden = true;
    required.forEach(function (n) { f[n].removeAttribute('aria-invalid'); });
    for (var i = 0; i < required.length; i++) {
      if (!order[required[i]]) { fail(cfg.messages.missing, f[required[i]]); return; }
    }
    if (!phoneOk.test(order.phone)) { fail(cfg.messages.badPhone, f.phone); return; }
    if (cfg.webhook) {
      fetch(cfg.webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(order) }).catch(function () {});
    }
    if (cfg.whatsapp) {
      var l = cfg.labels;
      var text = l.newOrder + ': ' + order.product + '\\n' + l.name + ': ' + order.name + '\\n' + l.phone + ': ' + order.phone + '\\n' + l.wilaya + ': ' + order.wilaya + '\\n' + l.address + ': ' + order.address + '\\n' + l.quantity + ': ' + order.quantity + (order.price ? '\\n' + l.price + ': ' + cfg.priceText : '') + (cfg.deliveryText ? '\\n' + l.delivery + ': ' + cfg.deliveryText : '') + (t ? '\\n' + l.total + ': ' + plain(t.total) + (money.feeMode === 'by-wilaya' ? money.plusDelivery : '') : '');
      window.open('https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text), '_blank');
    }
    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  });

  var slides = doc.getElementById('slides');
  var dots = doc.querySelectorAll('[data-slide]');
  if (slides && dots.length) {
    var mark = function (index) {
      dots.forEach(function (d, j) { d.setAttribute('aria-current', j === index ? 'true' : 'false'); });
    };
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        var index = parseInt(d.getAttribute('data-slide'), 10);
        var slide = slides.children[index];
        if (!slide) return;
        slide.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        mark(index);
      });
    });
    var pending = false;
    slides.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        mark(Math.round(Math.abs(slides.scrollLeft) / slides.clientWidth));
      });
    }, { passive: true });
  }

  var bar = doc.getElementById('sticky');
  if (bar && watch) {
    var seen = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      bar.classList.toggle('away', !!(seen['hero-cta'] || seen.order));
    });
    ['hero-cta', 'order'].forEach(function (id) { var el = doc.getElementById(id); if (el) observer.observe(el); });
  } else if (bar) {
    bar.classList.remove('away');
  }

  if (watch && !still) {
    var fold = window.innerHeight || 800;
    var later = [];
    doc.querySelectorAll('.rv').forEach(function (el) {
      if (el.getBoundingClientRect().top > fold) { el.classList.add('pre'); later.push(el); }
    });
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('pre'); reveal.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    later.forEach(function (el) { reveal.observe(el); });
  }

  refresh();
})();
`;
