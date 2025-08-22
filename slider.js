document.addEventListener('DOMContentLoaded', () => {
  /* ====== Your existing slider logic (unchanged) ====== */
  const slides = document.querySelectorAll('.slide');
  const slidesContainer = document.querySelector('.slides');
  const nextBtn = document.querySelector('.slider-btn.next');
  const prevBtn = document.querySelector('.slider-btn.prev');
  let currentSlide = 0;
  let intervalId;

  function updateSlider() {
    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
  }

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    resetInterval();
  });

  prevBtn?.addEventListener('click', () => {
    prevSlide();
    resetInterval();
  });

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(nextSlide, 5000);
  }

  intervalId = setInterval(nextSlide, 5000);

  /* ====== NEW: Team/Advisors toggle (accessible + animated) ====== */
  const teamTitle = document.getElementById('teamTitle');
  const tabTeam = document.getElementById('tab-team');
  const tabAdvisors = document.getElementById('tab-advisors');
  const panelTeam = document.getElementById('panel-team');
  const panelAdvisors = document.getElementById('panel-advisors');

  function activateTab(target) {
    const isTeam = target === 'team';

    // Toggle active styles on pills
    tabTeam.classList.toggle('is-active', isTeam);
    tabAdvisors.classList.toggle('is-active', !isTeam);

    // ARIA states
    tabTeam.setAttribute('aria-selected', String(isTeam));
    tabAdvisors.setAttribute('aria-selected', String(!isTeam));

    // Panels visibility + soft 3D animation
    if (isTeam) {
      panelAdvisors.setAttribute('hidden', '');
      panelAdvisors.classList.remove('show');
      panelTeam.removeAttribute('hidden');
      requestAnimationFrame(() => panelTeam.classList.add('show'));
      teamTitle.textContent = 'Team';
    } else {
      panelTeam.setAttribute('hidden', '');
      panelTeam.classList.remove('show');
      panelAdvisors.removeAttribute('hidden');
      requestAnimationFrame(() => panelAdvisors.classList.add('show'));
      teamTitle.textContent = 'Advisors';
    }
  }

  tabTeam?.addEventListener('click', () => activateTab('team'));
  tabAdvisors?.addEventListener('click', () => activateTab('advisors'));

  // Keyboard support for tabs
  [tabTeam, tabAdvisors].forEach(btn => {
    btn?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const next = btn === tabTeam ? tabAdvisors : tabTeam;
        next.focus();
        next.click();
      }
    });
  });
});
