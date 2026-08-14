(() => {
  const METRIKA_ID = 111611280;
  const reachGoal = (goal) => {
    if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal);
  };

  reachGoal('site_open');

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

  const storyVisual = document.querySelector('[data-story-visual]');
  const storySteps = [...document.querySelectorAll('[data-story-step]')];
  const railItems = [...document.querySelectorAll('.hero-rail-item')];
  if (storyVisual && storySteps.length) {
    const activateStoryStep = (step) => {
      const index = step.dataset.storyStep || '0';
      storySteps.forEach((item) => item.classList.toggle('is-active', item === step));
      railItems.forEach((item, itemIndex) => item.classList.toggle('is-active', String(itemIndex) === index));
      storyVisual.dataset.activeStep = index;
    };
    if (reduced || !('IntersectionObserver' in window)) activateStoryStep(storySteps[0]);
    else {
      const storyObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) activateStoryStep(entry.target);
      }), { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      storySteps.forEach((step) => storyObserver.observe(step));
    }
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
  let submissionInProgress = false;
  let lastFocused = null;
  const TELEGRAM_BOT_USERNAME = 'PhoenixMarketing_bot';
  const LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyAEdQU95ewD-Te34eN8x7eMC-yJnCMSHmp9pJngLRKLoIs6Yc5gkfnB-gw-gckD6I4/exec';
  const BONUS_LINKS = { checklist: 'https://drive.google.com/uc?export=download&id=1ouPVVw3_y4uIU5SYxqjYwWfhRokH288j', leadPath: 'https://drive.google.com/uc?export=download&id=1GIG6bQl7XhAOb4J6m1xIVcLClrrIv6d_' };
  document.querySelectorAll('[data-expert-avatar-img]').forEach((image) => { image.src = quizModal.dataset.expertAvatar; });

  const questions = [
    { key: 'situation', text: 'На каком этапе сейчас ваш бизнес?', expert: 'Если связки ещё нет, это нормально. Важно сначала определить порядок сборки, а уже потом вести на неё трафик.', options: ['Есть продукт, но системы привлечения ещё нет.', 'Готовимся запускать рекламу.', 'Реклама уже работает, но связка не собрана.', 'Есть заявки, но обработка ведётся вручную.', 'Пока проверяем готовность к системному привлечению.'] },
    { key: 'assets', text: 'Что уже подготовлено для привлечения клиентов?', expert: 'Отдельный сайт или реклама ещё не образуют систему. Мы проверяем, какие элементы уже можно связать между собой.', options: ['Понятный продукт и целевая аудитория', 'Сформулированный оффер', 'Рекламные креативы', 'Сайт или посадочная страница', 'CRM, таблица или Telegram для обработки', 'Пока почти ничего из этого'] },
    { key: 'clarity', text: 'Что сейчас сложнее всего подготовить?', expert: 'Этот ответ помогает определить первый рабочий контур, а не навязать вам весь объём работ сразу.', options: ['Понять, кому и что продавать', 'Сформулировать сильное обещание', 'Связать рекламу и сайт', 'Превратить интерес в тёплую заявку', 'Передать менеджеру контекст клиента', 'Определить правильный порядок запуска'] },
    { key: 'first_step', text: 'Что было бы самым полезным первым шагом?', expert: 'Хорошая связка начинается с ясного первого шага. Результат подскажет, что собирать раньше всего.', options: ['Получить карту всей связки', 'Подготовить запуск рекламы', 'Собрать сайт и диагностический маршрут', 'Настроить обработку лидов', 'Получить готовый пилот', 'Понять состав и порядок работ'] }
  ];

  const demoFallback = {
    'phoenix-client-acquisition-system': { title: 'Phoenix Marketing — система привлечения клиентов', status: 'Демонстрация метода · локально протестировано · не коммерческий кейс', strategy: 'Базовая система: факт-чек, стратегия, посадочная страница, диагностический маршрут, lead context и архитектура обработки.', creatives: 'Креативы и сценарии показывают, как рекламное обещание продолжается на странице и в вопросах маршрута.', ops: 'Данные лида, менеджерский Telegram-flow, CRM/аналитика и таблица описаны как локально протестированная baseline-система.', price: 'Ориентировочный состав: диагностика, стратегия, сайт, маршрут, обработка и аналитика. Финальная оценка зависит от задачи.', siteUrl: null },
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
    reachGoal('quiz_open');
    openModal(quizModal, button);
  }));
  document.querySelectorAll('.demo-final-cta').forEach((button) => button.addEventListener('click', () => {
    closeModal(demoModal);
    resetQuiz();
    reachGoal('quiz_open');
    openModal(quizModal, button);
  }));
  document.querySelector('[data-start-quiz]').addEventListener('click', startQuiz);
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => {
    closeModal(button.closest('.modal'));
  }));
  const deepLink = new URLSearchParams(window.location.search).get('quiz') === '1' || window.location.hash === '#quiz';
  if (deepLink) {
    resetQuiz();
    reachGoal('quiz_open');
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
    submissionInProgress = false;
    quizResult.hidden = true;
    quizResult.classList.remove('delivery-result');
    document.querySelector('[data-quiz-start]').hidden = false;
    document.querySelector('[data-quiz-flow]').hidden = true;
    document.querySelector('[data-quiz-flow-title]').textContent = 'Проверьте готовность системы';
    updateDiscount();
  }

  function startQuiz() {
    reachGoal('quiz_start');
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
        else {
          reachGoal('quiz_complete');
          showContactStep();
        }
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
    quizResult.innerHTML = `<span class="result-kicker">ПЛАН ГОТОВ</span><h3>Куда отправить результаты?</h3><p>Оставьте только нужный контакт. Мы не звоним — отправляем материалы выбранным способом.</p><form class="lead-form delivery-form" data-lead-form><label>Имя<input name="name" autocomplete="name" required></label><div class="form-row"><label>Ниша / чем занимается бизнес<input name="niche" autocomplete="organization" placeholder="Например: мебель на заказ" required></label><label>Роль<input name="role" autocomplete="organization-title" placeholder="Владелец, маркетолог, руководитель продаж" required></label></div><fieldset><legend>Канал доставки</legend><label class="delivery-choice"><input type="radio" name="delivery" value="telegram" checked><span>Telegram</span></label><label class="delivery-choice"><input type="radio" name="delivery" value="email"><span>Почта</span></label></fieldset><div class="contact-channel" data-channel="telegram"><label>Username в Telegram<input name="telegram_username" autocomplete="username" aria-required="true" placeholder="@username"></label><label>Телефон<input name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-required="true" placeholder="+7 900 000-00-00"></label><p class="form-note">Заполните хотя бы одно поле. Мы не звоним. Результат выдаст бот после нажатия «Старт» или мы напишем вручную.</p></div><div class="contact-channel" data-channel="email" hidden><label>Почта для отправки<input name="email" type="email" autocomplete="email" inputmode="email"></label></div><label class="consent"><input type="checkbox" name="consent" required><span>Согласен на обработку данных для отправки результата.</span></label><button class="button primary" type="submit">Получить результат в выбранном канале <span aria-hidden="true">↗</span></button><p class="form-status" data-lead-status role="status"></p></form>`;
    const form = quizResult.querySelector('[data-lead-form]');
    const delivery = form.querySelectorAll('input[name="delivery"]');
    const telegramUsername = form.querySelector('input[name="telegram_username"]');
    const phone = form.querySelector('input[name="phone"]');
    const email = form.querySelector('input[name="email"]');
    const telegramPanel = form.querySelector('[data-channel="telegram"]');
    const emailPanel = form.querySelector('[data-channel="email"]');
    const syncContactRequirement = () => {
      const channel = form.querySelector('input[name="delivery"]:checked').value;
      const hasUsername = Boolean(telegramUsername.value.trim());
      const hasPhone = Boolean(phone.value.trim());
      const missingTelegramContact = channel === 'telegram' && !hasUsername && !hasPhone;
      telegramUsername.required = channel === 'telegram' && !hasPhone;
      phone.required = channel === 'telegram' && !hasUsername;
      telegramUsername.setCustomValidity(missingTelegramContact ? 'Укажите username в Telegram или номер телефона.' : '');
      phone.setCustomValidity(missingTelegramContact ? 'Укажите username в Telegram или номер телефона.' : '');
    };
    const syncContactChannel = () => {
      const channel = form.querySelector('input[name="delivery"]:checked').value;
      telegramPanel.hidden = channel !== 'telegram';
      emailPanel.hidden = channel !== 'email';
      email.required = channel === 'email';
      syncContactRequirement();
    };
    delivery.forEach((radio) => radio.addEventListener('change', syncContactChannel));
    [telegramUsername, phone].forEach((input) => input.addEventListener('input', syncContactRequirement));
    syncContactChannel();
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submissionInProgress) return;
      syncContactRequirement();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const selectedChannel = form.querySelector('input[name="delivery"]:checked').value;
      if (selectedChannel === 'telegram' && !telegramUsername.value.trim() && !phone.value.trim()) {
        form.querySelector('[data-lead-status]').textContent = 'Укажите username в Telegram или номер телефона.';
        telegramUsername.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      reachGoal('lead_form_submit');
      const token = `phoenix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const lead = { lead_id: token, created_at: new Date().toISOString(), source: getSourceData(), quiz_answers: quizAnswers, name: data.name, niche: data.niche, role: data.role, delivery: data.delivery, telegram_username: data.telegram_username || null, phone: data.phone || null, email: data.email || null, consent: true, discount: { earned_percent: discountPercent, max_percent: 10, token }, bonuses: ['Чек-лист готовности связки к запуску', 'Шаблон пути лида от рекламы до менеджера'], status: 'pending_delivery' };
      submissionInProgress = true;
      const submitButton = form.querySelector('button[type="submit"]');
      const status = form.querySelector('[data-lead-status]');
      submitButton.disabled = true;
      submitButton.setAttribute('aria-disabled', 'true');
      status.textContent = 'Сохраняем заявку…';
      if (LEAD_ENDPOINT) {
        showThankYou(lead);
        fetch(LEAD_ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify(lead) })
          .then(() => { lead.backend_status = 'sent'; })
          .catch((error) => {
            lead.backend_status = 'pending_sync';
            lead.backend_error = error.message;
            saveLeadLocally(lead);
          });
      } else {
        lead.backend_status = 'local_only';
        saveLeadLocally(lead);
        showThankYou(lead);
      }
    });
  }

  function saveLeadLocally(lead) {
    const queue = JSON.parse(localStorage.getItem('phoenix_lead_queue') || '[]');
    if (!queue.some((item) => item.lead_id === lead.lead_id)) queue.push(lead);
    localStorage.setItem('phoenix_lead_queue', JSON.stringify(queue));
  }

  function showThankYou(lead, deliveryError = false) {
    const channel = lead.delivery === 'telegram' ? 'Telegram' : 'email';
    const botLink = lead.delivery === 'telegram' && TELEGRAM_BOT_USERNAME ? `<a class="button primary" href="https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(lead.lead_id)}" data-ym-goal="result_telegram_open">Открыть Telegram и получить результат ↗</a><p class="form-note">Если Telegram Web открыл бота без кода, отправьте ему команду: <code>/start ${escapeHtml(lead.lead_id)}</code></p>` : '';
    const bonusLinks = `<div class="bonus-downloads"><strong>Скачать бонусы:</strong><a href="${BONUS_LINKS.checklist}" data-ym-goal="bonus_download">01 · Чек-лист готовности к запуску</a><a href="${BONUS_LINKS.leadPath}" data-ym-goal="bonus_download">02 · Шаблон пути лида</a></div>`;
    const pending = deliveryError ? '<p class="form-status">Не удалось связаться с системой. Попробуйте отправить форму ещё раз.</p>' : '';
    quizResult.innerHTML = `<div class="lead-confirmation"><span class="result-kicker">СПАСИБО</span><strong>Результаты подготовлены.</strong><p>Отправим их в ${channel}. Мы не будем звонить.</p><div class="thankyou-bonuses"><strong>После отправки вы получите:</strong><span>01 · Чек-лист готовности связки</span><span>02 · Шаблон пути лида от рекламы до менеджера</span><span>Накопленная скидка: ${lead.discount.earned_percent}%</span></div>${bonusLinks}${botLink}${pending}<button class="button secondary" type="button" data-result-close>Вернуться к странице</button></div>`;
    quizResult.hidden = false;
    quizResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    quizResult.querySelector('.lead-confirmation')?.focus?.();
    quizResult.querySelector('[data-result-close]').addEventListener('click', () => closeModal(quizModal));
  }

  document.addEventListener('click', (event) => {
    const marked = event.target.closest?.('[data-ym-goal]');
    if (marked) reachGoal(marked.dataset.ymGoal);

    const contactLink = event.target.closest?.('#contacts a[href]');
    if (contactLink) reachGoal('contact_link_click');
  });

  function getSourceData() {
    const params = new URLSearchParams(window.location.search);
    return { utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'), utm_campaign: params.get('utm_campaign'), yclid: params.get('yclid'), referrer: document.referrer || null, landing_url: window.location.href };
  }

  document.querySelectorAll('.js-open-demo').forEach((button) => button.addEventListener('click', () => {
    reachGoal('demo_open');
    const id = button.dataset.demoId;
    const demo = demos[id] || demoFallback['mebel-26'];
    document.querySelector('[data-demo-title]').textContent = demo.title;
    document.querySelector('[data-demo-status]').textContent = demo.status;
    document.querySelector('[data-demo-strategy]').textContent = demo.strategy;
    document.querySelector('[data-demo-creatives]').textContent = demo.creatives;
    document.querySelector('[data-demo-ops]').textContent = demo.ops;
    document.querySelector('[data-demo-price]').textContent = demo.price;
    const assets = document.querySelector('[data-demo-assets]');
    assets.innerHTML = (demo.assets || []).filter((asset) => asset.type === 'image').map((asset) => `<figure class="demo-asset-card"><img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.alt || asset.title)}"><figcaption><strong>${escapeHtml(asset.title)}</strong><span>${escapeHtml(asset.adText || '')}</span>${asset.links?.length ? `<small>Быстрые ссылки: ${escapeHtml(asset.links.join(' · '))}</small>` : ''}</figcaption></figure>`).join('');
    document.querySelector('[data-demo-integrations]').innerHTML = (demo.integrations || []).map((item) => `<div class="demo-integration">${escapeHtml(item)}</div>`).join('');
    const bonusHeading = document.querySelector('[data-demo-bonus-heading]');
    bonusHeading.textContent = demo.bonusHeading || 'PDF-бонусы';
    document.querySelector('[data-demo-bonuses]').innerHTML = (demo.bonuses || []).length
      ? (demo.bonuses || []).map((bonus) => `<a class="demo-bonus-link" href="${escapeHtml(bonus.url)}" target="_blank" rel="noreferrer">${escapeHtml(bonus.title)} ↗</a>`).join('')
      : `<p class="demo-empty">Для этого демонстрационного проекта PDF-бонусы не заявлены. Здесь показаны только доступные материалы.</p>`;
    const frame = document.querySelector('[data-demo-frame]');
    const quizFrame = document.querySelector('[data-demo-quiz-frame]');
    const loading = document.querySelector('[data-frame-loading]');
    frame.removeAttribute('src');
    quizFrame.removeAttribute('src');
    loading.classList.remove('is-loaded');
    if (demo.siteUrl) {
      frame.src = demo.siteUrl;
      frame.onload = () => loading.classList.add('is-loaded');
      loading.textContent = 'Загрузка сайта…';
    } else {
      loading.textContent = 'Сайт пока не подключён';
    }
    const quizLoading = document.querySelector('[data-quiz-loading]');
    const quizSection = quizFrame.closest('section');
    quizSection.hidden = !demo.quizUrl;
    if (demo.quizUrl) {
      quizFrame.src = demo.quizUrl;
      quizFrame.onload = () => quizLoading.classList.add('is-loaded');
      quizLoading.textContent = 'Загрузка квиза…';
    } else {
      quizLoading.textContent = 'Отдельный квиз пока не опубликован';
    }
    openModal(demoModal, button);
  }));

  fetch('https://dennagorniy.github.io/phoenix-marketing-demos/shared/demo-manifest.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : null)
    .then((manifest) => { if (manifest?.demos) demos = { ...demoFallback, ...Object.fromEntries(manifest.demos.map((demo) => [demo.id, demo])) }; })
    .catch(() => {});
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }
})();
