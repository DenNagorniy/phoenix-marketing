# W0–W7 Remediation Record

Дата: 2026-08-14
Статус: LOCAL ACCEPTANCE PASS · NOT PUSHED · NOT DEPLOYED

Документ закрывает замечания из verdict W0–W7. Он не заменяет визуальный review: перед публикацией нужно повторно пройти acceptance smoke-test на опубликованном deployment.

## Что исправлено

### W1/W2 — static и mobile fallback

- Состояние wow владеет один `initWowSystem()`.
- На coarse pointer, reduced motion и отсутствии IntersectionObserver включается статический режим.
- На мобильной ширине декоративный hero-сигнал скрыт, а layout и CTA остаются рабочими.
- Базовый стиль demo-секций — полностью видимый. Анимация применяется только при `.wow-ready` и активированном состоянии.

### W3 — последовательная передача сигнала

- Наблюдение использует более ранний порог и root margin.
- Общее состояние страницы не вмешивается в геометрию hero или modal.

### W4 — маршрут через восемь этапов

- На desktop маршрут образует непрерывную U-трассу через сетку 4×2: первый ряд → правый переход → второй ряд.
- На tablet маршрут перестраивается в змейку через сетку 2×4 и проходит через все четыре ряда.
- Сигнальный маркер повторяет геометрию соответствующего маршрута, а не движется только по первой строке.
- На мобильном декоративный маршрут скрывается, содержание карточек остаётся доступным.

### W5 — единый источник и три ветви

- Общий источник перенесён в верхнюю служебную полосу карточек (`16px`), вне номера, заголовка и основного текста.
- Каждая карточка получает короткое вертикальное ответвление от общей линии до своего входного маркера.
- Состояние ветки включается существующим реальным CTA через `:focus-within`, hover и tap.
- Карточки сценариев больше не являются искусственными tab-stop.
- Удалён контейнерный `keydown`, который мог отменять нативный `Enter/Space` реальной CTA-кнопки.

### W6 — deterministic demo reveal

- `.demo-stack` исключён из общего IntersectionObserver.
- При открытии демонстрации вызывается `activateWowDemo()`, поэтому анимация не зависит от высоты модального содержимого и scroll position.
- No-JS и reduced-motion показывают все секции без скрытого контента.

### W7 — остановка после CTA

- Финальный CTA получил постоянную линию схождения к карточке и короткий сигнал активации.
- Нажатие `.js-open-quiz` или `.demo-final-cta` устанавливает `data-wow-stopped="true"` и останавливает декоративные циклы.

### Accessibility

- Удалены 8 tab-stop у информационных карточек механизма и 3 tab-stop у сценариев.
- Визуальная реакция сценария сохранена на реальной кнопке через `:focus-within`.
- Компактные текстовые ссылки, брендовая ссылка, footer/contact links получили touch target не менее 44 px.
- Skip-link и desktop navigation links также доведены до минимальной высоты 44 px.

## Проверки

- JavaScript syntax check: passed.
- Wow boundary check: passed.
- Git whitespace check: passed.
- Local viewport smoke-test: 1440×900, 1024×768, 390×844 — без horizontal overflow, hero в пределах viewport.
- Demo open smoke-test: modal opens, demo state reaches `complete`, all seven sections are visible.
- Deterministic no-JS sandbox: scripts disabled, `.wow-ready` absent, seven demo sections visible, active animations `0`.
- Deterministic reduced-motion runtime: `matchMedia` reports reduce, `.wow-ready` absent, hero decoration hidden, seven demo sections visible, active animations `0`.
- Responsive runtime harness: 768×1024 uses two columns and a four-row route; 390×844 hides decorative routes, has no horizontal overflow and no sub-44 px interactive targets.
- Evidence: `docs/qa/evidence/`.

## Final corrective closure — 2026-08-15

Повторный аудит после исправлений W4/W5 закрыл два последних визуальных блокера:

- W4 pseudo-element имеет реальную высоту (`50%` desktop, `75%` tablet), поэтому маршрут больше не схлопывается в `0px`.
- W5 rail находится выше контента: линия не пересекает номер (`28px`), заголовок или описание.
- Coarse/static hero selector исправлен: статическое состояние скрывает декоративный слой напрямую.
- Открытие demo после уже совершённого CTA не перезапускает декоративную систему.
- Для повторяемой локальной проверки добавлен `docs/qa/wow-runtime-harness.html`.

## Осталось до публикации

1. После отдельного разрешения выполнить push/deploy.
2. Повторить acceptance smoke-test на опубликованной GitHub Pages версии.
