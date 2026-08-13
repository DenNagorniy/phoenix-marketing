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

const routeCopy = {
  message: ["Сообщение совпадает с первым экраном","Человек понимает, что будет дальше, ещё до того, как оставит контакт.","MSG_MATCH / READY"],
  landing: ["Страница продолжает рекламный разговор","Первый экран отвечает на исходный запрос и убирает лишний когнитивный шум.","CONTEXT / PRESERVED"],
  diagnostic: ["Вопросы превращаются в полезный сигнал","Диагностика даёт бизнесу контекст, а не просто ещё одно поле в форме.","SIGNAL / CAPTURED"],
  lead: ["Заявка приходит вместе с причиной","Менеджер видит источник, мотив и следующий шаг до начала разговора.","LEAD / QUALIFIED"],
  manager: ["Следующий разговор начинается не с нуля","Контекст передан дальше — команда может заниматься решением, а не повторным допросом.","HANDOFF / READY"]
};
document.querySelectorAll('.route-node').forEach((node) => {
  node.addEventListener('click', () => {
    document.querySelectorAll('.route-node').forEach((item) => item.classList.remove('is-active'));
    node.classList.add('is-active');
    const copy = routeCopy[node.dataset.route];
    if (!copy) return;
    document.querySelector('[data-readout-title]').textContent = copy[0];
    document.querySelector('[data-readout-copy]').textContent = copy[1];
    document.querySelector('[data-readout-code]').textContent = copy[2];
  });
});
