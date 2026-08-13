# Phoenix Marketing Public Site — Design System

Статус: DESIGN SYSTEM LOCKED FOR V1.

## Direction

Editorial industrial architecture: near-black ink, warm paper, oxidized copper, oversized serif statements and strict systems grid.

## Brand layer

Основной брендовый знак Phoenix Systems используется точечно: в навигации, footer и proof-метках. Игровой логотип не должен превращать маркетинговую витрину в game landing; он работает как знак доверия внутри более зрелого editorial-языка.

## Tokens

- Ink: #0B0B0A
- Paper: #E9E4D8
- Paper dim: #B9B2A5
- Copper: #D58B58
- Copper soft: #9F6342
- Display: Newsreader
- UI: DM Sans
- Labels: DM Mono

## Layout

- 12-column editorial logic through constrained CSS grids.
- Full viewport hero.
- One primary CTA per major section.
- Large typography and generous vertical rhythm.
- No generic SaaS bento-card overload.

## Interaction

- Reveal only key content blocks.
- Hero visual has restrained pointer tilt on fine pointers.
- Reduced motion disables transforms and smooth scroll.
- Every interactive element has visible focus state.
- No emoji icons in the production direction; typographic marks and SVG are preferred.

## Content boundary

- No ROI, CPL, conversion uplift or client-result claims.
- Demo projects are labelled as demonstrations.
- Public page may link to GitHub and public demos; internal lead and CRM data stays local.


## Interactive proof layer

The homepage includes a signal console under the hero. It is intentionally a product demonstration rather than decorative motion:

- five handoff nodes: Message, Landing, Diagnostic, Lead, Manager;
- click-to-read state changes expose what context is preserved at each handoff;
- route is keyboard reachable and remains usable on mobile;
- reduced-motion mode removes transform transitions;
- no commercial outcome is implied by the interaction.

This section is the visual bridge between Phoenix Marketing's editorial brand and its core offer: making the customer path legible.


## Strategy-first hierarchy

The public site must present the offer in this order:

1. Phoenix Marketing assembles the connected acquisition and lead-processing system.
2. The visitor chooses a situation: launch from zero, repair an existing break, or connect operations and data.
3. A diagnostic route is the entry mechanism that identifies the first priority.
4. Demonstrations prove the method; they do not replace the offer.

Primary public CTA: `Получить разбор системы привлечения`.
Repair-segment CTA: `Найти разрыв в существующей воронке`.
Avoid making “quiz” or “funnel break diagnosis” the universal product promise.
