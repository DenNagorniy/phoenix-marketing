/* Phoenix Marketing wow layer: one owner, progressive enhancement, static fallback. */
(function () {
  'use strict';

  function initWowSystem() {
    const demoStack = document.querySelector('.demo-stack');
    if (demoStack) {
      demoStack.dataset.wowScene = 'demo';
      demoStack.dataset.wowObserve = 'manual';
    }
    const scenes = Array.from(document.querySelectorAll('[data-wow-scene]'));
    if (!scenes.length) return false;

    const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const coarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
    const canObserve = 'IntersectionObserver' in window;
    const staticMode = reducedMotion || coarsePointer || !canObserve;
    const observedScenes = scenes.filter((scene) => scene.dataset.wowObserve !== 'manual');

    scenes.forEach((scene) => {
      scene.dataset.wowState = staticMode ? 'static' : 'idle';
      scene.dataset.wowPointer = coarsePointer ? 'coarse' : 'fine';
    });

    const stopDecorativeSystem = () => {
      document.documentElement.dataset.wowStopped = 'true';
      scenes.forEach((scene) => { scene.dataset.wowState = 'stopped'; });
    };
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.js-open-quiz, .demo-final-cta')) stopDecorativeSystem();
      if (target?.closest('.js-open-demo')) window.setTimeout(activateDemo, 40);
    }, { passive: true });

    function activateDemo() {
      const stack = document.querySelector('.demo-stack');
      if (!stack) return;
      if (document.documentElement.dataset.wowStopped === 'true') {
        stack.dataset.wowPlayed = 'true';
        stack.dataset.wowState = 'complete';
        return;
      }
      stack.dataset.wowState = 'ready';
      stack.dataset.wowPlayed = 'true';
      window.setTimeout(() => { stack.dataset.wowState = 'complete'; }, 1050);
    }
    window.activateWowDemo = activateDemo;

    if (staticMode) return true;

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
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    observedScenes.forEach((scene) => observer.observe(scene));

    const branches = Array.from(document.querySelectorAll('[data-wow-branch]'));
    const activateBranch = (branch) => {
      branches.forEach((item) => { item.dataset.wowActive = item === branch ? 'true' : 'false'; });
    };
    branches.forEach((branch) => {
      branch.addEventListener('pointerup', () => activateBranch(branch));
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        scenes.forEach((scene) => {
          if (scene.dataset.wowState !== 'stopped') scene.dataset.wowState = 'idle';
        });
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
