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
    const observedScenes = scenes.filter((scene) => scene.dataset.wowObserve !== 'manual' && scene.dataset.wowScene !== 'footer');
    const footerScene = scenes.find((scene) => scene.dataset.wowScene === 'footer');

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
      window.setTimeout(() => { stack.dataset.wowState = 'active'; }, 1100);
    }
    window.activateWowDemo = activateDemo;

    if (staticMode) return true;

    /* One physical signal speed; scene durations follow their real route length. */
    const signalSpeed = 350;
    const setDuration = (scene, property, distance, travelShare = 1) => {
      if (!scene || distance <= 0) return 0;
      const seconds = distance / signalSpeed / travelShare;
      scene.style.setProperty(property, `${seconds.toFixed(3)}s`);
      return seconds;
    };
    const syncMotionDurations = () => {
      const hero = document.querySelector('[data-wow-scene="hero"]');
      const heroRoute = hero?.querySelector('.wow-hero-route');
      const heroDuration = setDuration(hero, '--wow-hero-duration', (heroRoute?.clientWidth ?? 0) - 9, 0.7);
      if (hero && heroDuration) {
        hero.style.setProperty('--wow-hero-node-b-delay', `${(heroDuration * 0.2).toFixed(3)}s`);
        hero.style.setProperty('--wow-hero-node-c-delay', `${(heroDuration * 0.45).toFixed(3)}s`);
      }

      const process = document.querySelector('[data-wow-scene="process"]');
      setDuration(process, '--wow-process-duration', (process?.clientWidth ?? 0) - 9, 0.98);

      const mechanism = document.querySelector('[data-wow-scene="mechanism"]');
      const mechanismGrid = mechanism?.querySelector('.mechanism-grid');
      if (mechanismGrid) {
        const tabletRoute = window.matchMedia('(max-width: 900px) and (min-width: 561px)').matches;
        const distance = tabletRoute
          ? (mechanismGrid.clientWidth * 4) + (mechanismGrid.clientHeight * 0.75)
          : ((mechanismGrid.clientWidth + 6) * 2) + (mechanismGrid.clientHeight * 0.5);
        setDuration(mechanism, '--wow-mechanism-duration', distance);
      }

      const scenarios = document.querySelector('[data-wow-scene="scenarios"]');
      const scenarioGrid = scenarios?.querySelector('.scenario-grid');
      setDuration(scenarios, '--wow-scenarios-duration', (scenarioGrid?.clientWidth ?? 0) - 9, 0.98);

      const footer = document.querySelector('[data-wow-scene="footer"]');
      setDuration(footer, '--wow-footer-duration', (footer?.clientWidth ?? 0) - 9, 0.82);
    };
    syncMotionDurations();
    if ('ResizeObserver' in window) {
      const motionResizeObserver = new ResizeObserver(syncMotionDurations);
      ['.wow-hero-route', '[data-wow-scene="process"]', '.mechanism-grid', '.scenario-grid', '[data-wow-scene="footer"]']
        .forEach((selector) => {
          const element = document.querySelector(selector);
          if (element) motionResizeObserver.observe(element);
        });
    } else {
      window.addEventListener('resize', syncMotionDurations, { passive: true });
    }

    const sceneTimers = new WeakMap();
    const sceneDelays = {
      hero: 0,
      process: 220,
      mechanism: 260,
      diagnostic: 520,
      scenarios: 520,
      offers: 460,
      fit: 460,
      proof: 520,
      cta: 520,
      footer: 260
    };

    const scheduleScene = (scene) => {
      if (scene.dataset.wowPlayed || sceneTimers.has(scene)) return;
      const delay = sceneDelays[scene.dataset.wowScene] ?? 360;
      const readyTimer = window.setTimeout(() => {
        sceneTimers.delete(scene);
        if (scene.dataset.wowInView !== 'true' || scene.dataset.wowPlayed) return;
        scene.dataset.wowState = 'ready';
        window.setTimeout(() => {
          scene.dataset.wowPlayed = 'true';
          scene.dataset.wowState = 'active';
        }, 1200);
      }, delay);
      sceneTimers.set(scene, readyTimer);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visiblePixels = entry.intersectionRect.height;
        const substantialEntry = entry.intersectionRatio >= 0.28 || visiblePixels >= 280;
        entry.target.dataset.wowInView = entry.isIntersecting && substantialEntry ? 'true' : 'false';
        if (entry.isIntersecting && substantialEntry) {
          scheduleScene(entry.target);
        } else if (!entry.target.dataset.wowPlayed) {
          const pendingTimer = sceneTimers.get(entry.target);
          if (pendingTimer) window.clearTimeout(pendingTimer);
          sceneTimers.delete(entry.target);
          entry.target.dataset.wowState = 'idle';
        }
      });
    }, { threshold: [0.18, 0.28, 0.42], rootMargin: '0px 0px -16% 0px' });

    observedScenes.forEach((scene) => observer.observe(scene));

    if (footerScene) {
      const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          footerScene.dataset.wowInView = entry.isIntersecting ? 'true' : 'false';
          if (entry.isIntersecting) scheduleScene(footerScene);
        });
      }, { threshold: 0.2 });
      footerObserver.observe(footerScene);
    }

    const branches = Array.from(document.querySelectorAll('[data-wow-branch]'));
    const activateBranch = (branch) => {
      branches.forEach((item) => { item.dataset.wowActive = item === branch ? 'true' : 'false'; });
    };
    branches.forEach((branch) => {
      branch.addEventListener('pointerup', () => activateBranch(branch));
      branch.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('button, a')) return;
        branch.querySelector('.js-open-quiz')?.click();
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        scenes.forEach((scene) => {
          if (scene.dataset.wowState !== 'stopped' && !scene.dataset.wowPlayed) scene.dataset.wowState = 'idle';
        });
      } else {
        scenes.forEach((scene) => {
          if (scene.dataset.wowPlayed && scene.dataset.wowState !== 'stopped') scene.dataset.wowState = 'active';
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
