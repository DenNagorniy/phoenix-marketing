# W0–W7 Remediation Record

Дата: 2026-08-14
Статус: READY FOR REVIEW · LOCAL ONLY · NOT PUSHED · NOT DEPLOYED

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

- Линия больше не является одиночной чертой над сеткой: она проходит по двум рядам и соединяет вертикальные переходы между карточками.
- На мобильном декоративный маршрут скрывается, содержание карточек остаётся доступным.

### W5 — единый источник и три ветви

- В сетке сценариев появился общий горизонтальный источник сигнала.
- Каждая карточка получает короткое ответвление от общей линии.
- Состояние ветки включается существующим реальным CTA через `:focus-within`, hover и tap.
- Карточки сценариев больше не являются искусственными tab-stop.

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

## Проверки

- JavaScript syntax check: passed.
- Wow boundary check: passed.
- Git whitespace check: passed.
- Local viewport smoke-test: 1440×900, 1024×768, 390×844 — без horizontal overflow, hero в пределах viewport.
- Demo open smoke-test: modal opens, demo state reaches `complete`, all seven sections are visible.
- Evidence: `docs/qa/evidence/`.

## Осталось до публикации

1. Отдельно воспроизвести reduced-motion и no-JS в браузере.
2. Просмотреть evidence и пройти keyboard review на desktop.
3. Повторить acceptance smoke-test на GitHub Pages после отдельного разрешения на push/deploy.
