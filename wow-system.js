/* Phoenix Marketing wow layer W1: one owner, progressive enhancement, static fallback. */
(function () {
  'use strict';

  function initWowSystem() {
    const scenes = Array.from(document.querySelectorAll('[data-wow-scene]'));
    if (!scenes.length) return false;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    const canObserve = 'IntersectionObserver' in window;

    scenes.forEach((scene) => {
      scene.dataset.wowState = reducedMotion || !canObserve ? 'static' : 'idle';
      scene.dataset.wowPointer = coarsePointer ? 'coarse' : 'fine';
    });

    if (reducedMotion || !canObserve) return true;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.wowPlayed) {
          entry.target.dataset.wowState = 'ready';
          window.setTimeout(() => {
            entry.target.dataset.wowPlayed = 'true';
            entry.target.dataset.wowState = 'complete';
          }, 1050);
        } else if (!entry.isIntersecting && !entry.target.dataset.wowPlayed) {
          entry.target.dataset.wowState = 'idle';
        }
      });
    }, { threshold: 0.18 });

    scenes.forEach((scene) => observer.observe(scene));

    const branches = Array.from(document.querySelectorAll('[data-wow-branch]'));
    const activateBranch = (branch) => {
      branches.forEach((item) => { item.dataset.wowActive = item === branch ? 'true' : 'false'; });
    };
    branches.forEach((branch) => {
      branch.addEventListener('pointerup', () => activateBranch(branch));
      branch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateBranch(branch);
        }
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        scenes.forEach((scene) => { scene.dataset.wowState = 'idle'; });
      }
    }, { passive: true });

    document.documentElement.classList.add('wow-ready');
    return true;
  }

  window.initWowSystem = initWowSystem;

  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWowSystem, { once: true });
    } else {
      initWowSystem();
    }
  } catch (error) {
    document.documentElement.classList.remove('wow-ready');
    console.warn('Phoenix wow layer disabled; static page remains active.', error);
  }
}());
