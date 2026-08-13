const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
const visual = document.querySelector('[data-tilt]');
if (visual && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  visual.addEventListener('pointermove', (event) => {
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    visual.style.setProperty('--ry', `${x * 2.8}deg`);
    visual.style.setProperty('--rx', `${y * -2.8}deg`);
  });
  visual.addEventListener('pointerleave', () => {
    visual.style.setProperty('--ry', '0deg');
    visual.style.setProperty('--rx', '0deg');
  });
}
