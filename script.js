(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if (reduced) revealItems.forEach((item) => item.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  }

  const tilt = document.querySelector('[data-tilt]');
  if (tilt && !reduced && window.matchMedia('(pointer: fine)').matches) {
    tilt.addEventListener('pointermove', (event) => {
      const rect = tilt.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      tilt.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${y * -3}deg)`;
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  const quizModal = document.querySelector('#quiz-modal');
  const demoModal = document.querySelector('#demo-modal');
  const quizQuestion = document.querySelector('[data-quiz-question]');
  const quizOptions = document.querySelector('[data-quiz-options]');
  const quizResult = document.querySelector('[data-quiz-result]');
  const quizProgress = document.querySelector('[data-quiz-progress]');
  const quizBar = document.querySelector('[data-quiz-bar]');
  const quizLead = document.querySelector('[data-quiz-lead]');
  let quizStep = 0;
  let quizAnswers = [];
  let lastFocused = null;

  const questions = [
    { text: 'Что сейчас приводит вам клиентов?', options: ['Реклама', 'Рекомендации', 'Поиск и сайт', 'Несколько каналов', 'Почти ничего не измеряем'] },
    { text: 'Где возникает основная сложность?', options: ['Мало обращений', 'Качество обращений нестабильно', 'Сайт не объясняет ценность', 'Менеджер получает мало контекста', 'Не понимаем, что улучшать'] },
    { text: 'Что происходит с человеком после первого интереса?', options: ['Сразу попадает на сайт', 'Попадает в форму или мессенджер', 'Проходит несколько страниц', 'Есть диагностический маршрут', 'Не знаем, что происходит дальше'] },
    { text: 'Какой результат был бы полезнее сейчас?', options: ['Найти слабое место воронки', 'Понять, почему мало заявок', 'Проверить сайт и рекламу', 'Собрать маршрут до менеджера', 'Получить карту следующего эксперимента'] }
  ];

  const demoFallback = {
    'phoenix-client-acquisition-system': { title: 'Phoenix Client Acquisition System', status: 'Демонстрация метода · локально протестировано · не коммерческий кейс', strategy: 'Базовая система: факт-чек, стратегия, посадочная страница, диагностический маршрут, lead context и архитектура обработки.', creatives: 'Креативы и сценарии показывают, как рекламное обещание продолжается на странице и в вопросах маршрута.', ops: 'Данные лида, менеджерский Telegram-flow, CRM/аналитика и таблица описаны как локально протестированная baseline-система.', price: 'Ориентировочный состав: диагностика, стратегия, сайт, маршрут, обработка и аналитика. Финальная оценка зависит от задачи.', siteUrl: null },
    'mebel-26': { title: 'Мебель-26', status: 'Демонстрационный концепт на открытых данных · не коммерческий кейс', strategy: 'Факт-чек, JTBD-сегменты и идея «Сначала проект. Потом производство».', creatives: 'Креативные углы под сегменты ведут человека к проектному диалогу и диагностическому маршруту.', ops: 'Пример связки лида, статуса и следующего шага. Коммерческие результаты не заявляются.', price: 'Ориентировочная оценка состава проекта, а не коммерческое предложение.', siteUrl: null },
    innaguru: { title: 'InnaGuru / «Сам себе мастер»', status: 'Внутренний демонстрационный проект Phoenix · не коммерческий кейс', strategy: 'Внутренний проект с продуктом, посадочной страницей, рекламной логикой и JTBD-маршрутами.', creatives: 'Показываются материалы проекта и логика перехода от боли домашнего маникюра к продукту.', ops: 'Таблицы, Telegram и аналитика показываются только в обезличенном или демонстрационном виде.', price: 'Ориентир состава проекта. Не является публичной ценой для клиента.', siteUrl: null }
  };
  let demos = { ...demoFallback };

  const openModal = (modal, opener) => {
    lastFocused = opener || document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    const close = modal.querySelector('.modal-close');
    close?.focus();
  };
  const closeModal = (modal) => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    lastFocused?.focus?.();
  };
  document.querySelectorAll('.js-open-quiz').forEach((button) => button.addEventListener('click', () => {
    resetQuiz();
    openModal(quizModal, button);
  }));
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => {
    closeModal(button.closest('.modal'));
  }));
  const deepLink = new URLSearchParams(window.location.search).get('quiz') === '1' || window.location.hash === '#quiz';
  if (deepLink) {
    resetQuiz();
    openModal(quizModal, null);
    const cleanUrl = window.location.href.replace(/[?#]quiz(?:=1)?$/, '');
    window.history.replaceState({}, document.title, cleanUrl);
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      [quizModal, demoModal].forEach((modal) => { if (modal && !modal.hidden) closeModal(modal); });
    }
  });

  function resetQuiz() {
    quizStep = 0; quizAnswers = []; quizResult.hidden = true; quizLead.hidden = false; quizLead.textContent = 'Ответьте на четыре коротких вопроса. В конце вы получите ориентир, что стоит проверить первым.'; renderQuestion();
  }
  function renderQuestion() {
    const current = questions[quizStep];
    quizProgress.textContent = `${quizStep + 1} / ${questions.length}`;
    quizBar.style.width = `${((quizStep + 1) / questions.length) * 100}%`;
    quizQuestion.textContent = current.text;
    quizOptions.innerHTML = '';
    current.options.forEach((label) => {
      const option = document.createElement('button');
      option.className = 'quiz-option';
      option.type = 'button';
      option.textContent = label;
      option.setAttribute('aria-pressed', 'false');
      option.addEventListener('click', () => {
        quizAnswers[quizStep] = label;
        if (quizStep < questions.length - 1) { quizStep += 1; renderQuestion(); }
        else showQuizResult();
      });
      quizOptions.appendChild(option);
    });
  }
  function showQuizResult() {
    const text = quizAnswers.join(' ').toLowerCase();
    let segment = 'early_research';
    let title = 'Собрать связку под вашу точку старта';
    let copy = 'Сначала определим аудиторию, боли и обещание, затем соберём маршрут от креатива до разговора менеджера.';
    let next = 'Карта системы';
    if (text.includes('менеджер') || text.includes('контекст')) {
      segment = 'owner_operator';
      title = 'Соединить заявку с контекстом';
      copy = 'В связке важно передать менеджеру не только контакт, но и источник, ответы, потребность и понятный следующий шаг.';
      next = 'Операционный контур';
    } else if (text.includes('мало') || text.includes('заявок')) {
      segment = 'loop_repair';
      title = 'Собрать маршрут от интереса до заявки';
      copy = 'Начнём с рекламного обещания, страницы и диагностического маршрута, чтобы холодный интерес получил понятный следующий шаг.';
      next = 'Пилотная связка';
    } else if (text.includes('сайт') || text.includes('поиск')) {
      segment = 'launch_architect';
      title = 'Собрать систему до запуска трафика';
      copy = 'До закупки трафика свяжем сегменты, боли, креативы, сайт, маршрут и передачу заявки менеджеру.';
      next = 'Карта системы';
    }
    quizProgress.textContent = 'Результат';
    quizBar.style.width = '100%';
    quizQuestion.textContent = '';
    quizOptions.innerHTML = '';
    quizLead.hidden = true;
    quizResult.hidden = false;
    quizResult.innerHTML = `<span class="result-kicker">ВАШ ОРИЕНТИР · ${segment}</span><h3>${title}</h3><p>${copy}</p><div class="result-meta"><strong>Следующий состав: ${next}</strong><span>Приоритет: связать следующий шаг с реальным контекстом клиента.</span></div><button class="button primary" type="button" data-result-contact>Запросить состав проекта <span aria-hidden="true">↗</span></button><p class="result-note">Сначала покажем состав работ. Контакт нужен, чтобы отправить его вам.</p>`;
    quizResult.querySelector('[data-result-contact]').addEventListener('click', () => showLeadForm({ segment, title, next }));
  }

  function showLeadForm(result) {
    quizResult.innerHTML = `<span class="result-kicker">СЛЕДУЮЩИЙ ШАГ</span><h3>Получить состав системы</h3><p>Оставьте контакт — подготовим короткий разбор под ваш результат диагностики.</p><form class="lead-form" data-lead-form><label>Имя<input name="name" autocomplete="name" required></label><label>Телефон или Telegram<input name="contact" autocomplete="tel" required></label><label>Ваша роль<input name="role" autocomplete="organization-title" placeholder="Владелец, маркетолог, руководитель продаж"></label><label class="consent"><input type="checkbox" name="consent" required><span>Согласен на обработку данных для ответа на запрос.</span></label><button class="button primary" type="submit">Получить разбор <span aria-hidden="true">↗</span></button><p class="form-status" data-lead-status role="status"></p></form>`;
    const form = quizResult.querySelector('[data-lead-form]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const lead = { lead_id: `phoenix-${Date.now()}`, created_at: new Date().toISOString(), source: getSourceData(), quiz_answers: quizAnswers, result: { segment: result.segment, title: result.title, next: result.next }, name: data.name, contact: data.contact, role: data.role || null, status: 'new' };
      const queue = JSON.parse(localStorage.getItem('phoenix_lead_queue') || '[]');
      queue.push(lead);
      localStorage.setItem('phoenix_lead_queue', JSON.stringify(queue));
      form.innerHTML = '<div class="lead-confirmation"><strong>Разбор подготовлен в этом браузере.</strong><p>Канал передачи менеджеру ещё не подключён. Запись сохранена как демонстрационный lead object; после подключения endpoint она будет отправляться в CRM, таблицу или бота.</p><button class="button secondary" type="button" data-result-close>Вернуться к странице</button></div>';
      form.querySelector('[data-result-close]').addEventListener('click', () => closeModal(quizModal));
    });
  }

  function getSourceData() {
    const params = new URLSearchParams(window.location.search);
    return { utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign'), yclid: params.get('yclid'), referrer: document.referrer || null, landing_url: window.location.href };
  }

  document.querySelectorAll('.js-open-demo').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.demoId;
    const demo = demos[id] || demoFallback['mebel-26'];
    document.querySelector('[data-demo-title]').textContent = demo.title;
    document.querySelector('[data-demo-status]').textContent = demo.status;
    document.querySelector('[data-demo-strategy]').textContent = demo.strategy;
    document.querySelector('[data-demo-creatives]').textContent = demo.creatives;
    document.querySelector('[data-demo-ops]').textContent = demo.ops;
    document.querySelector('[data-demo-price]').textContent = demo.price;
    const frame = document.querySelector('[data-demo-frame]');
    const loading = document.querySelector('[data-frame-loading]');
    const fallback = document.querySelector('[data-demo-fallback]');
    frame.removeAttribute('src');
    fallback.removeAttribute('href');
    fallback.hidden = true;
    loading.classList.remove('is-loaded');
    if (demo.siteUrl) {
      frame.src = demo.siteUrl;
      fallback.href = demo.fallbackUrl || demo.siteUrl;
      fallback.hidden = false;
      frame.onload = () => loading.classList.add('is-loaded');
      loading.textContent = 'Загрузка демо-сайта…';
    } else {
      loading.textContent = 'Публичное демо ещё не опубликовано';
    }
    openModal(demoModal, button);
  }));

  fetch('https://dennagorniy.github.io/phoenix-marketing-demos/shared/demo-manifest.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : null)
    .then((manifest) => { if (manifest?.demos) demos = { ...demoFallback, ...Object.fromEntries(manifest.demos.map((demo) => [demo.id, demo])) }; })
    .catch(() => {});
})();