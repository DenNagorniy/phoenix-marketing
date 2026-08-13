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
  let discountPercent = 0;
  let lastFocused = null;
  const TELEGRAM_BOT_USERNAME = '';
  document.querySelectorAll('[data-expert-avatar-img]').forEach((image) => { image.src = quizModal.dataset.expertAvatar; });

  const questions = [
    { key: 'situation', text: 'На каком этапе сейчас ваш бизнес?', expert: 'Если связки ещё нет, это нормально. Важно сначала определить порядок сборки, а уже потом вести на неё трафик.', options: ['Есть продукт, но системы привлечения ещё нет.', 'Готовимся запускать рекламу.', 'Реклама уже работает, но связка не собрана.', 'Есть заявки, но обработка ведётся вручную.', 'Пока проверяем готовность к системному привлечению.'] },
    { key: 'assets', text: 'Что уже подготовлено для привлечения клиентов?', expert: 'Отдельный сайт или реклама ещё не образуют систему. Мы проверяем, какие элементы уже можно связать между собой.', options: ['Понятный продукт и целевая аудитория', 'Сформулированный оффер', 'Рекламные креативы', 'Сайт или посадочная страница', 'CRM, таблица или Telegram для обработки', 'Пока почти ничего из этого'] },
    { key: 'clarity', text: 'Что сейчас сложнее всего подготовить?', expert: 'Этот ответ помогает определить первый рабочий контур, а не навязать вам весь объём работ сразу.', options: ['Понять, кому и что продавать', 'Сформулировать сильное обещание', 'Связать рекламу и сайт', 'Превратить интерес в тёплую заявку', 'Передать менеджеру контекст клиента', 'Определить правильный порядок запуска'] },
    { key: 'first_step', text: 'Что было бы самым полезным первым шагом?', expert: 'Хорошая связка начинается с ясного первого шага. Результат подскажет, что собирать раньше всего.', options: ['Получить карту всей связки', 'Подготовить запуск рекламы', 'Собрать сайт и диагностический маршрут', 'Настроить обработку лидов', 'Получить готовый пилот', 'Понять состав и порядок работ'] }
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
  document.querySelector('[data-start-quiz]').addEventListener('click', startQuiz);
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
    quizStep = 0;
    quizAnswers = [];
    discountPercent = 0;
    quizResult.hidden = true;
    quizResult.classList.remove('delivery-result');
    document.querySelector('[data-quiz-start]').hidden = false;
    document.querySelector('[data-quiz-flow]').hidden = true;
    document.querySelector('[data-quiz-flow-title]').textContent = 'Проверьте готовность системы';
    updateDiscount();
  }

  function startQuiz() {
    document.querySelector('[data-quiz-start]').hidden = true;
    document.querySelector('[data-quiz-flow]').hidden = false;
    quizStep = 0;
    renderQuestion();
  }

  function updateDiscount() {
    document.querySelector('[data-quiz-discount]').textContent = `Скидка: ${discountPercent.toString().replace('.', ',')}%`;
    quizBar.style.width = `${Math.min(100, discountPercent * 10)}%`;
  }

  function renderQuestion() {
    const current = questions[quizStep];
    quizProgress.textContent = `${quizStep + 1} / ${questions.length}`;
    quizQuestion.textContent = current.text;
    quizLead.textContent = 'Выберите один вариант — следующий вопрос появится сразу.';
    document.querySelector('[data-quiz-expert]').textContent = `Денис: ${current.expert}`;
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
        discountPercent = Math.min(10, Number(((quizStep + 1) * 2.5).toFixed(1)));
        updateDiscount();
        if (quizStep < questions.length - 1) { quizStep += 1; renderQuestion(); }
        else showContactStep();
      });
      quizOptions.appendChild(option);
    });
  }

  function showContactStep() {
    quizProgress.textContent = 'Контакт';
    document.querySelector('[data-quiz-flow]').hidden = true;
    document.querySelector('[data-quiz-expert]').textContent = '';
    document.querySelector('[data-quiz-expert]').closest('.expert-card').hidden = true;
    quizQuestion.textContent = '';
    quizOptions.innerHTML = '';
    document.querySelector('[data-quiz-back]').hidden = true;
    quizLead.textContent = 'Мы подготовили ваш персональный план. Выберите, куда его отправить.';
    quizResult.hidden = false;
    quizResult.classList.add('delivery-result');
    quizResult.innerHTML = `<span class="result-kicker">ПЛАН ГОТОВ</span><h3>Куда отправить результаты?</h3><p>Оставьте только нужный контакт. Мы не звоним — отправляем материалы выбранным способом.</p><form class="lead-form delivery-form" data-lead-form><label>Имя<input name="name" autocomplete="name" required></label><div class="form-row"><label>Ниша / чем занимается бизнес<input name="niche" autocomplete="organization" placeholder="Например: мебель на заказ" required></label><label>Роль<input name="role" autocomplete="organization-title" placeholder="Владелец, маркетолог, руководитель продаж" required></label></div><fieldset><legend>Канал доставки</legend><label class="delivery-choice"><input type="radio" name="delivery" value="telegram" checked><span>Telegram</span></label><label class="delivery-choice"><input type="radio" name="delivery" value="email"><span>Почта</span></label></fieldset><div class="contact-channel" data-channel="telegram"><label>Telegram — username или телефон<input name="telegram_contact" autocomplete="username" placeholder="@username или +7 900 000-00-00"></label><p class="form-note">Достаточно username или телефона. Мы не звоним. Результат выдаст бот после нажатия «Старт» или мы напишем вручную.</p></div><div class="contact-channel" data-channel="email" hidden><label>Почта для отправки<input name="email" type="email" autocomplete="email" inputmode="email"></label></div><label class="consent"><input type="checkbox" name="consent" required><span>Согласен на обработку данных для отправки результата.</span></label><button class="button primary" type="submit">Получить результат в выбранном канале <span aria-hidden="true">↗</span></button><p class="form-status" data-lead-status role="status"></p></form>`;
    const form = quizResult.querySelector('[data-lead-form]');
    const delivery = form.querySelectorAll('input[name="delivery"]');
    const telegramContact = form.querySelector('input[name="telegram_contact"]');
    const email = form.querySelector('input[name="email"]');
    const telegramPanel = form.querySelector('[data-channel="telegram"]');
    const emailPanel = form.querySelector('[data-channel="email"]');
    const syncContactChannel = () => {
      const channel = form.querySelector('input[name="delivery"]:checked').value;
      telegramPanel.hidden = channel !== 'telegram';
      emailPanel.hidden = channel !== 'email';
      telegramContact.required = channel === 'telegram';
      email.required = channel === 'email';
    };
    delivery.forEach((radio) => radio.addEventListener('change', syncContactChannel));
    syncContactChannel();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const token = `phoenix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const lead = { lead_id: token, created_at: new Date().toISOString(), source: getSourceData(), quiz_answers: quizAnswers, name: data.name, niche: data.niche, role: data.role, delivery: data.delivery, telegram_contact: data.telegram_contact || null, email: data.email || null, consent: true, discount: { earned_percent: discountPercent, max_percent: 10, token }, bonuses: ['Чек-лист готовности связки к запуску', 'Шаблон пути лида от рекламы до менеджера'], status: 'pending_delivery' };
      queue.push(lead);
      localStorage.setItem('phoenix_lead_queue', JSON.stringify(queue));
      showThankYou(lead);
    });
  }

  function showThankYou(lead) {
    const channel = lead.delivery === 'telegram' ? 'Telegram' : 'email';
    const botLink = lead.delivery === 'telegram' && TELEGRAM_BOT_USERNAME ? `<a class="button primary" href="https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(lead.lead_id)}" target="_blank" rel="noreferrer">Открыть Telegram и получить результат ↗</a>` : '';
    const pending = lead.delivery === 'telegram' && !TELEGRAM_BOT_USERNAME ? '<p class="form-status">Telegram-бот ещё не подключён. Заявка сохранена со статусом ожидания доставки.</p>' : lead.delivery === 'email' ? '<p class="form-status">Email endpoint ещё не подключён. Заявка сохранена со статусом ожидания доставки.</p>' : '';
    quizResult.innerHTML = `<div class="lead-confirmation"><span class="result-kicker">СПАСИБО</span><strong>Результаты подготовлены.</strong><p>Отправим их в ${channel}. Мы не будем звонить.</p><div class="thankyou-bonuses"><strong>После отправки вы получите:</strong><span>01 · Чек-лист готовности связки</span><span>02 · Шаблон пути лида</span><span>Накопленная скидка: ${lead.discount.earned_percent}%</span></div>${botLink}${pending}<button class="button secondary" type="button" data-result-close>Вернуться к странице</button></div>`;
    quizResult.querySelector('[data-result-close]').addEventListener('click', () => closeModal(quizModal));
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