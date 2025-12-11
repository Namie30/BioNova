/* BioNova interactions (vanilla JS) */

(function () {
  'use strict';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* =======================
   * Mobile nav
   * ======================= */
  function initNav() {
    const toggle = qs('#navToggle');
    const nav = qs('#siteNav');
    if (!toggle || !nav) return;

    const close = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };

    const open = () => {
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    };

    toggle.addEventListener('click', () => {
      const isOpen = document.body.classList.contains('nav-open');
      if (isOpen) close();
      else open();
    });

    // Close when clicking a nav link (mobile)
    qsa('a[href^="#"]', nav).forEach((a) => {
      a.addEventListener('click', () => close());
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Close if resizing to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 700) close();
    });
  }

  /* =======================
   * Active nav on scroll
   * ======================= */
  function initActiveNav() {
    const nav = qs('#siteNav');
    if (!nav) return;

    const links = qsa('a[href^="#"]', nav);
    const ids = links
      .map((a) => {
        const id = (a.getAttribute('href') || '').slice(1);
        return id ? { id, a } : null;
      })
      .filter(Boolean);

    const sections = ids
      .map(({ id, a }) => {
        const el = qs(`#${CSS.escape(id)}`);
        return el ? { el, a } : null;
      })
      .filter(Boolean);

    if (!sections.length) return;

    const setActive = (activeEl) => {
      links.forEach((a) => a.classList.remove('is-active'));
      const hit = sections.find((s) => s.el === activeEl);
      if (hit) hit.a.classList.add('is-active');
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible) setActive(visible.target);
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5],
        rootMargin: '-25% 0px -60% 0px',
      }
    );

    sections.forEach(({ el }) => io.observe(el));
  }

  /* =======================
   * Reveal on scroll
   * ======================= */
  function initReveal() {
    const els = qsa('.reveal');
    if (!els.length) return;

    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    els.forEach((el) => io.observe(el));
  }

  /* =======================
   * SDG tooltip
   * ======================= */
  function initSdgTooltip() {
    const nodes = qsa('.sdg-node');
    if (!nodes.length) return;

    const tip = document.createElement('div');
    tip.className = 'sdg-tip';
    tip.setAttribute('role', 'status');
    tip.setAttribute('aria-live', 'polite');
    document.body.appendChild(tip);

    const show = (target) => {
      const label = target.getAttribute('data-sdg') || '';
      if (!label) return;

      tip.textContent = label;
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + window.scrollY;

      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.classList.add('is-show');
    };

    const hide = () => tip.classList.remove('is-show');

    nodes.forEach((n) => {
      n.addEventListener('mouseenter', () => show(n));
      n.addEventListener('mouseleave', hide);
      n.addEventListener('focus', () => show(n));
      n.addEventListener('blur', hide);
    });

    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('resize', hide);
  }

  /* =======================
   * KPI counters (animate when section visible)
   * ======================= */
  function initKpis() {
    const app = qs('#app');
    const kpis = qsa('.kpi-value', app || document);
    if (!app || !kpis.length) return;

    const animate = (el, to, duration = 1100) => {
      const start = 0;
      const diff = Math.max(0, to - start);
      let t0 = null;

      const step = (ts) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / duration, 1);
        el.textContent = Math.round(start + diff * p).toString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (entries.some((e) => e.isIntersecting)) {
          done = true;
          kpis.forEach((el) => {
            const to = parseFloat(el.getAttribute('data-count-to') || '0');
            animate(el, to);
          });
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (prefersReducedMotion()) {
      kpis.forEach((el) => (el.textContent = el.getAttribute('data-count-to') || '0'));
      return;
    }

    io.observe(app);
  }

  /* =======================
   * Achievements carousel
   * ======================= */
  function initCarousel() {
    const track = qs('#awardSlides');
    const dotsWrap = qs('#awardDots');
    const prev = qs('.carousel-btn.prev');
    const next = qs('.carousel-btn.next');
    if (!track || !prev || !next || !dotsWrap) return;

    const slides = qsa('.slide', track);
    if (!slides.length) return;

    let index = 0;
    let timer = null;
    let isPaused = false;

    const set = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;

      qsa('.dot', dotsWrap).forEach((d, di) => {
        d.classList.toggle('is-active', di === index);
        d.setAttribute('aria-current', di === index ? 'true' : 'false');
      });
    };

    // dots
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', `Go to slide ${i + 1}`);
      b.addEventListener('click', () => {
        set(i);
        restart();
      });
      dotsWrap.appendChild(b);
    });

    const restart = () => {
      if (prefersReducedMotion()) return;
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (!isPaused) set(index + 1);
      }, 5200);
    };

    prev.addEventListener('click', () => {
      set(index - 1);
      restart();
    });
    next.addEventListener('click', () => {
      set(index + 1);
      restart();
    });

    // keyboard
    const carousel = track.closest('.carousel');
    carousel?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev.click();
      if (e.key === 'ArrowRight') next.click();
    });

    // pause on hover/focus
    const pause = () => (isPaused = true);
    const resume = () => (isPaused = false);
    carousel?.addEventListener('mouseenter', pause);
    carousel?.addEventListener('mouseleave', resume);
    carousel?.addEventListener('focusin', pause);
    carousel?.addEventListener('focusout', resume);

    // swipe
    let startX = 0;
    let dx = 0;
    let down = false;
    track.addEventListener(
      'touchstart',
      (e) => {
        down = true;
        startX = e.touches[0].clientX;
        dx = 0;
      },
      { passive: true }
    );
    track.addEventListener(
      'touchmove',
      (e) => {
        if (!down) return;
        dx = e.touches[0].clientX - startX;
      },
      { passive: true }
    );
    track.addEventListener('touchend', () => {
      if (!down) return;
      down = false;
      if (dx > 60) prev.click();
      else if (dx < -60) next.click();
    });

    // init
    set(0);
    restart();
  }

  /* =======================
   * Team/advisors tabs
   * ======================= */
  function initTabs() {
    const teamTitle = qs('#teamTitle');
    const tabTeam = qs('#tab-team');
    const tabAdv = qs('#tab-advisors');
    const panelTeam = qs('#panel-team');
    const panelAdv = qs('#panel-advisors');
    if (!tabTeam || !tabAdv || !panelTeam || !panelAdv) return;

    const activate = (which) => {
      const isTeam = which === 'team';
      tabTeam.classList.toggle('is-active', isTeam);
      tabAdv.classList.toggle('is-active', !isTeam);
      tabTeam.setAttribute('aria-selected', String(isTeam));
      tabAdv.setAttribute('aria-selected', String(!isTeam));

      if (isTeam) {
        panelAdv.setAttribute('hidden', '');
        panelAdv.classList.remove('show');
        panelTeam.removeAttribute('hidden');
        requestAnimationFrame(() => panelTeam.classList.add('show'));
        if (teamTitle) teamTitle.textContent = 'Team';
      } else {
        panelTeam.setAttribute('hidden', '');
        panelTeam.classList.remove('show');
        panelAdv.removeAttribute('hidden');
        requestAnimationFrame(() => panelAdv.classList.add('show'));
        if (teamTitle) teamTitle.textContent = 'Advisors';
      }
    };

    tabTeam.addEventListener('click', () => activate('team'));
    tabAdv.addEventListener('click', () => activate('advisors'));

    [tabTeam, tabAdv].forEach((btn) => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          (btn === tabTeam ? tabAdv : tabTeam).focus();
          (btn === tabTeam ? tabAdv : tabTeam).click();
        }
      });
    });
  }

  /* =======================
   * Calculator (simple-first)
   * ======================= */
  function initCalculator() {
    const herdEl = qs('#herd');
    const tariffEl = qs('#tariff');
    const currencyEl = qs('#currency');
    if (!herdEl || !tariffEl || !currencyEl) return;

    const animalBtns = qsa('.segmented [data-animal]');
    const modelBtns = qsa('.segmented [data-model]');
    const herdOut = qs('#herdOut');

    const biogasOut = qs('#biogasOut');
    const kwhOut = qs('#kwhOut');
    const saveOut = qs('#saveOut');
    const saveCur = qs('#saveCur');
    const recoModel = qs('#recoModel');
    const recoHint = qs('#recoHint');
    const capexOut = qs('#capexOut');
    const capexCur = qs('#capexCur');
    const paybackOut = qs('#paybackOut');

    const advBox = qs('#advancedBox');
    const advForm = qs('#advForm');
    const toggleAdv = qs('#toggleAdvancedLink');

    const animalDefaults = {
      cow: { manure: 25, yield: 0.04 },
      buffalo: { manure: 30, yield: 0.045 },
      pig: { manure: 6, yield: 0.05 },
      mixed: { manure: 20, yield: 0.038 },
    };

    const digesters = [
      { name: '15-ton', price: 7900, herdMax: 120 },
      { name: '30-ton', price: 12500, herdMax: 250 },
      { name: '50-ton', price: 17500, herdMax: 9999 },
    ];

    const fmt = (currency, n, digits = 0) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          maximumFractionDigits: digits,
        }).format(n);
      } catch {
        // fallback
        return `${n.toFixed(digits)} ${currency}`;
      }
    };

    const state = {
      animal: 'cow',
      model: 'buy',
      herd: parseInt(herdEl.value || '0', 10),
      currency: currencyEl.value || 'USD',
      tariff: parseFloat(tariffEl.value || '0'),
      manure: animalDefaults.cow.manure,
      yield: animalDefaults.cow.yield,
      kwhPerM3: 2.0,
      fertPerKg: 0.8,
    };

    const recommend = (herd) => digesters.find((d) => herd <= d.herdMax) || digesters[digesters.length - 1];

    const syncAria = (buttons, activeBtn) => {
      buttons.forEach((b) => {
        const active = b === activeBtn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
    };

    const recalc = () => {
      const manureIn = state.herd * state.manure; // kg/day
      const biogas = manureIn * state.yield; // m3/day
      const kwh = biogas * state.kwhPerM3;
      const savingsDay = kwh * state.tariff;

      const d = recommend(state.herd);
      const upfront = state.model === 'partner' ? d.price * 0.5 : d.price;

      const annualSavings = savingsDay * 365;
      const payback = annualSavings > 0 ? upfront / annualSavings : Infinity;

      if (herdOut) herdOut.textContent = String(state.herd);
      if (biogasOut) biogasOut.textContent = biogas.toFixed(1);
      if (kwhOut) kwhOut.textContent = String(Math.round(kwh));

      if (saveOut) saveOut.textContent = savingsDay.toFixed(2);
      if (saveCur) saveCur.textContent = ` ${state.currency}`;

      if (recoModel) recoModel.textContent = `${d.name} digester`;
      if (recoHint) recoHint.textContent = `Good for up to ~${d.herdMax} animals.`;

      if (capexOut) capexOut.textContent = fmt(state.currency, upfront, 0);
      if (capexCur) capexCur.textContent = '';

      if (paybackOut) paybackOut.textContent = isFinite(payback) ? payback.toFixed(1) : '–';
    };

    // Animal buttons
    animalBtns.forEach((btn) => {
      const animal = btn.getAttribute('data-animal');
      btn.addEventListener('click', () => {
        if (!animal || !animalDefaults[animal]) return;
        state.animal = animal;
        state.manure = animalDefaults[animal].manure;
        state.yield = animalDefaults[animal].yield;
        syncAria(animalBtns, btn);

        // mirror into advanced fields
        const m = qs('#manure');
        const y = qs('#yield');
        if (m) m.value = String(state.manure);
        if (y) y.value = String(state.yield);

        recalc();
      });
    });

    // Model buttons
    modelBtns.forEach((btn) => {
      const model = btn.getAttribute('data-model');
      btn.addEventListener('click', () => {
        if (!model) return;
        state.model = model;
        syncAria(modelBtns, btn);
        recalc();
      });
    });

    herdEl.addEventListener('input', () => {
      state.herd = parseInt(herdEl.value || '0', 10);
      recalc();
    });

    tariffEl.addEventListener('input', () => {
      state.tariff = parseFloat(tariffEl.value || '0');
      recalc();
    });

    currencyEl.addEventListener('change', () => {
      state.currency = currencyEl.value;
      recalc();
    });

    advForm?.addEventListener('input', () => {
      const manure = parseFloat((qs('#manure')?.value || '').trim());
      const yieldV = parseFloat((qs('#yield')?.value || '').trim());
      const kwhPerM3 = parseFloat((qs('#kwhPerM3')?.value || '').trim());
      const fertPerKg = parseFloat((qs('#fertilizerPerKg')?.value || '').trim());

      if (!Number.isNaN(manure)) state.manure = manure;
      if (!Number.isNaN(yieldV)) state.yield = yieldV;
      if (!Number.isNaN(kwhPerM3)) state.kwhPerM3 = kwhPerM3;
      if (!Number.isNaN(fertPerKg)) state.fertPerKg = fertPerKg;

      recalc();
    });

    toggleAdv?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!advBox) return;
      advBox.open = !advBox.open;
      advBox.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    });

    // seed advanced fields from defaults
    const m = qs('#manure');
    const y = qs('#yield');
    const k = qs('#kwhPerM3');
    const f = qs('#fertilizerPerKg');
    if (m) m.value = String(state.manure);
    if (y) y.value = String(state.yield);
    if (k) k.value = String(state.kwhPerM3);
    if (f) f.value = String(state.fertPerKg);

    recalc();
  }

  /* =======================
   * Contact form (mailto)
   * ======================= */
  function initContactForm() {
    const form = qs('#contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (qs('#name')?.value || '').trim();
      const email = (qs('#email')?.value || '').trim();
      const message = (qs('#message')?.value || '').trim();

      const to = 'bionovainfo1@gmail.com';
      const subject = encodeURIComponent(`BioNova inquiry — ${name || 'Website visitor'}`);
      const body = encodeURIComponent(
        [
          `Name: ${name}`,
          `Email: ${email}`,
          '',
          message,
          '',
          '— Sent from bionova website',
        ].join('\n')
      );

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initActiveNav();
    initReveal();
    initSdgTooltip();
    initKpis();
    initCarousel();
    initTabs();
    initCalculator();
    initContactForm();
  });
})();
