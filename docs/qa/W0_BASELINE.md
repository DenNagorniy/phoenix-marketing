# W0 Baseline — Phoenix Marketing

Дата проверки: 2026-08-14
Среда: локальный static server, corrective pass после verdict W0–W7.

## Зафиксированное состояние

- Hero занимает один viewport во всех проверенных размерах.
- Primary CTA виден в первом viewport.
- Демо-кнопки присутствуют.
- В консоли браузера ошибок нет.
- Фоновая картинка hero загружается.
- Scroll-jacking и управление позицией страницы отсутствуют.
- Quiz/demo modal и существующий runtime не изменялись в рамках W0.
- Визуальные evidence сохранены в `docs/qa/evidence/`.

## Viewport evidence

| Viewport | Hero | CTA | Console | Horizontal overflow |
|---|---:|---|---:|---|
| 1440×900 | 1440×900 | виден | 0 ошибок | нет |
| 1024×768 | 1024×768 | виден | 0 ошибок | нет |
| 768×1024 | 768×1024 | виден | 0 ошибок | нет |
| 390×844 | 390×844 | виден | 0 ошибок | нет |
| 320×844 | 305×844 с scrollbar gutter | виден | 0 ошибок | нет относительно viewport |

## Corrective evidence — verdict W0–W7

| Evidence | Что подтверждает |
|---|---|
| `evidence/w0-1440x900.png` | Hero в один viewport, CTA виден, изображение не увеличено до пиксельного crop |
| `evidence/w0-1024x768.png` | Tablet layout без горизонтального overflow |
| `evidence/w0-390x844.png` | Mobile layout без горизонтального overflow; декоративный hero-сигнал отключён CSS fallback |

Дополнительные runtime-проверки:

- после открытия демонстрации `data-wow-state="complete"`, все семь секций демо видимы (`opacity: 1`, `transform: none`);
- `.demo-stack` не наблюдается через общий IntersectionObserver: его активация происходит при открытии модального окна;
- без `.wow-ready` базовый стиль демо оставляет секции видимыми (`opacity: 1`, `transform: none`);
- после удаления карточного `tabindex` в дереве страницы нет искусственных tab-stop у механизма и сценариев;
- `node --check wow-system.js`, `git diff --check` и `scripts/check-wow-boundaries.ps1` проходят.

## Baseline correction

До начала wow-эффектов исправлена только одна найденная регрессия адаптива: на ширине 320 px `.hero` с `100vw` учитывал scrollbar gutter и создавал горизонтальное расширение документа. Для мобильного режима ширина hero возвращена в размер контентной области без изменения визуальной композиции.

## Gate W0

**Baseline обновлён для corrective pass.** W0–W7 считаются готовыми к повторному review только после просмотра этого evidence и отдельной проверки reduced-motion/no-JS.
