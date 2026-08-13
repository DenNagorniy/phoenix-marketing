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
    { key: 'situation', text: 'На каком этапе сейчас ваш бизнес?', options: ['Есть продукт, но системы привлечения ещё нет.', 'Готовимся запускать рекламу.', 'Реклама уже работает, но связка не собрана.', 'Есть заявки, но обработка ведётся вручную.', 'Пока проверяем готовность к системному привлечению.'] },
    { key: 'assets', text: 'Что уже подготовлено для привлечения клиентов?', options: ['Понятный продукт и целевая аудитория', 'Сформулированный оффер', 'Рекламные креативы', 'Сайт или посадочная страница', 'CRM, таблица или Telegram для обработки', 'Пока почти ничего из этого'] },
    { key: 'clarity', text: 'Что сейчас сложнее всего подготовить?', options: ['Понять, кому и что продавать', 'Сформулировать сильное обещание', 'Связать рекламу и сайт', 'Превратить интерес в тёплую заявку', 'Передать менеджеру контекст клиента', 'Определить правильный порядок запуска'] },
    { key: 'first_step', text: 'Что было бы самым полезным первым шагом?', options: ['Получить карту всей связки', 'Подготовить запуск рекламы', 'Собрать сайт и диагностический маршрут', 'Настроить обработку лидов', 'Получить готовый пилот', 'Понять состав и порядок работ'] }
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
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('quiz');
    if (cleanUrl.hash === '#quiz') cleanUrl.hash = '';
    window.history.replaceState({}, document.title, cleanUrl.toString());
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
    quizOptions.setAttribute('aria-label', current.text);
    const back = document.querySelector('[data-quiz-back]');
    back.hidden = quizStep === 0;
    back.onclick = () => { quizStep = Math.max(0, quizStep - 1); renderQuestion(); };
    current.options.forEach((label) => {
      const option = document.createElement('button');
      option.className = 'quiz-option';
      option.type = 'button';
      option.textContent = label;
      option.setAttribute('aria-pressed', String(quizAnswers[quizStep] === label));
      if (quizAnswers[quizStep] === label) option.classList.add('is-selected');
      option.addEventListener('click', () => {
        quizAnswers[quizStep] = label;
        if (quizStep < questions.length - 1) { quizStep += 1; renderQuestion(); }
        else showQuizResult();
      });
      quizOptions.appendChild(option);
    });
  }
  function showQuizResult() {
    const answers = quizAnswers.join(' ').toLowerCase();
    const situation = (quizAnswers[0] || '').toLowerCase();
    let segment = 'early_research';
    let title = 'Собрать систему привлечения под вашу точку старта';
    let copy = 'Начнём с исследования бизнеса, сегментов и оффера, затем свяжем креативы, сайт, диагностический маршрут и обработку лида.';
    let product = 'Карта системы';
    if (situation.includes('продукт') || situation.includes('запуск')) {
      segment = 'pre_launch';
      title = 'Сначала собрать систему запуска';
      copy = 'До закупки трафика нужно связать аудиторию, обещание, креативы, сайт, диагностический маршрут и передачу заявки менеджеру.';
      product = 'Карта системы → Пилотная связка';
    } else if (situation.includes('реклама')) {
      segment = 'fragmented_acquisition';
      title = 'Собрать работающую связку вокруг рекламы';
      copy = 'Реклама уже есть, но ей нужен единый маршрут: сообщение, сайт, диагностика, контекст лида и понятная обработка.';
      product = 'Пилотная связка';
    } else if (situation.includes('заявки') || situation.includes('вручную')) {
      segment = 'owner_operator';
      title = 'Передать менеджеру не пустой контакт, а контекст';
      copy = 'Соберём lead object, правила обработки и канал передачи данных, чтобы заявки не терялись между формами, Telegram и таблицами.';
      product = 'Операционный контур';
    } else if (answers.includes('сайт') || answers.includes('обещание')) {
      segment = 'launch_architect';
      title = 'Собрать путь клиента до первого разговора';
      copy = 'Следующий шаг — связать рекламное обещание, сайт и диагностический маршрут в одну понятную систему.';
      product = 'Пилотная связка';
    }
    const checklist = [
      'Сегменты, боли и мотивация аудитории',
      'Оффер и рекламное обещание',
      'Креативы под выбранные сегменты',
      'Сайт и диагностический маршрут',
      'Lead object и передача контекста менеджеру',
      'Таблица, CRM или Telegram для обработки',
      'Цели аналитики и smoke-test до запуска трафика'
    ];
    const steps = ['Исследование и стратегия', 'Креативы и сайт', 'Диагностический маршрут', 'Обработка лида и аналитика'];
    const discount = getDiscountState();
    quizProgress.textContent = 'Ваш план';
    quizBar.style.width = '100%';
    quizQuestion.textContent = '';
    quizOptions.innerHTML = '';
    document.querySelector('[data-quiz-back]').hidden = true;
    quizLead.hidden = true;
    quizResult.hidden = false;
    quizResult.innerHTML = `<span class="result-kicker">ВАШ ПЛАН · ${segment}</span><h3>${title}</h3><p>${copy}</p><div class="solution-block"><strong>Что должно быть собрано</strong><ul>${checklist.map((item) => `<li>${item}</li>`).join('')}</ul><strong>Порядок действий</strong><ol>${steps.map((item) => `<li>${item}</li>`).join('')}</ol></div><div class="bonus-block"><strong>Два бонуса</strong><p>01 · Чек-лист готовности связки к запуску<br>02 · Шаблон пути лида от рекламы до менеджера</p></div><div class="discount-block"><strong>Накоплено ${discount.earned_percent}% скидки</strong><span>Можно накопить до 10% на работы Phoenix Marketing. Условия и срок действия фиксируются в предложении.</span></div><div class="result-meta"><strong>Рекомендуемый состав: ${product}</strong><span>Первый шаг: получить состав системы под ваши ответы.</span></div><button class="button primary" type="button" data-result-contact>Получить состав системы <span aria-hidden="true">↗</span></button><p class="result-note">Сначала покажем план и состав работ. Контакт нужен только для отправки результата.</p>`;
    quizResult.querySelector('[data-result-contact]').addEventListener('click', () => showLeadForm({ segment, title, product, checklist, steps, discount }));
  }

  function getDiscountState() {
    const key = 'phoenix_discount_state';
    const state = JSON.parse(localStorage.getItem(key) || '{"earned_percent":0}');
    const earned = Math.min(10, Math.max(2, Number(state.earned_percent) || 0));
    localStorage.setItem(key, JSON.stringify({ earned_percent: earned, max_percent: 10 }));
    return { earned_percent: earned, max_percent: 10, token: `phoenix-discount-${Date.now()}` };
  }
  function showLeadForm(result) {
    quizResult.innerHTML = `<span class="result-kicker">СЛЕДУЮЩИЙ ШАГ</span><h3>Получить состав системы</h3><p>Оставьте контакт — подготовим короткий разбор под ваш результат диагностики.</p><form class="lead-form" data-lead-form><label>Имя<input name="name" autocomplete="name" required></label><label>Телефон или Telegram<input name="contact" autocomplete="tel" inputmode="tel" required></label><label>Ваша роль<input name="role" autocomplete="organization-title" placeholder="Владелец, маркетолог, руководитель продаж"></label><label class="consent"><input type="checkbox" name="consent" required><span>Согласен на обработку данных для ответа на запрос.</span></label><button class="button primary" type="submit">Получить разбор <span aria-hidden="true">↗</span></button><p class="form-status" data-lead-status role="status"></p></form>`;
    const form = quizResult.querySelector('[data-lead-form]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const lead = { lead_id: `phoenix-${Date.now()}`, created_at: new Date().toISOString(), source: getSourceData(), quiz_answers: quizAnswers, result: { segment: result.segment, title: result.title, recommended_product: result.product, checklist: result.checklist, steps: result.steps }, discount: result.discount, bonuses: ['Чек-лист готовности связки к запуску', 'Шаблон пути лида от рекламы до менеджера'], name: data.name, contact: data.contact, role: data.role || null, status: 'new' };
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