---
name: autocare-design-system
description: Define and enforce the Autocare mobile visual language based on the garage screenshot direction (premium dark cards, high-contrast recommendation blocks, structured hierarchy). Use when creating or refactoring React Native screens/components, restyling existing UI with Native Wind, reviewing visual consistency, or when the user asks for design system alignment.
---

# Autocare Design System

## Purpose

Use this skill to keep all mobile UI consistent with the target garage experience:
- premium, dark-surfaces-first visual style
- clear information hierarchy with one primary focal card
- action-forward UX with obvious primary/secondary choices
- predictable spacing, radius, typography, and interaction states

## Source Direction (What the screenshot implies)

Treat the provided visual direction as these UX principles, not only colors:

1. **One dominant moment per screen**
   - Hero/vehicle area is the visual anchor.
   - Everything else supports that anchor (status, recommendation, timeline).

2. **Action clarity over decoration**
   - Recommendation block is intentionally loud (high contrast).
   - CTA pair (`Approve` / `Later`) is immediate and low-friction.

3. **Compressed but legible information density**
   - Status and timestamp are shown in compact cards.
   - Dense layout still reads quickly because hierarchy is explicit.

4. **Spatial depth and grouping**
   - Rounded cards + subtle elevation separate sections.
   - Related content is grouped in containers, not loose text.

5. **Context first, drill-down later**
   - Top area gives account/workshop + selected vehicle context.
   - User can understand state in <3 seconds without scrolling.

## Design Tokens (Conceptual)

Use project tokens/classes; do not hardcode hex values in components.

- **Color roles**
  - `surface.base`: app background (dark-neutral)
  - `surface.card`: elevated cards
  - `surface.overlay`: lighter translucent bars/chips
  - `text.primary`: high-emphasis text
  - `text.secondary`: supportive text
  - `accent.primary`: active highlights/icons
  - `accent.attention`: recommendation panel
  - `feedback.success|warning|error`: semantic state indicators

- **Spacing scale**
  - Use 4/8pt rhythm.
  - Section gaps should be visually larger than intra-card gaps.

- **Radius**
  - Small controls: small radius
  - Standard cards: medium radius
  - Hero/major blocks: large radius
  - Keep radius system consistent across tabs.

- **Typography**
  - Title/section label/body/caption hierarchy must be obvious.
  - Use weight and size to communicate priority; avoid random one-off sizes.

## Required UI Patterns

When building screen-level UI, enforce:

1. **Screen shell**
   - Safe-area aware container.
   - Consistent page padding and vertical rhythm.

2. **Header context row**
   - Show current workspace/vehicle context.
   - Secondary controls (weather/alerts/settings) are visually subordinate.

3. **Primary hero card**
   - Dominant visual area (image or key state summary).
   - Include short, high-signal status label.

4. **Status micro-cards**
   - Pair concise metrics (service state, last update, etc.).
   - Keep symmetry and equal visual weight.

5. **Recommendation/action panel**
   - Strong contrast to signal urgency/importance.
   - Explicit primary/secondary actions side-by-side when possible.

6. **Recent updates/timeline**
   - Chronological feed with calm styling.
   - Avoid competing with recommendation panel.

## Interaction + Accessibility Rules

- Tap targets: minimum mobile hit area.
- Icons must not be the only carrier of meaning.
- Color contrast must remain readable in bright conditions.
- Loading/empty/error states must preserve layout stability.
- Focus/pressed/disabled states must be visible and consistent.
- Animations should be subtle and functional (state change, not decoration).

## Implementation Rules for This Repo

- React Native functional components as arrow functions.
- Single quotes for strings.
- Prefer shared UI primitives before new ad-hoc wrappers.
- Prefer `className` token utilities; use `style` only for dynamic values.
- No hardcoded user-facing copy; wire text to i18n keys.
- No hardcoded color literals when token equivalents exist.

## Enforcement Workflow

For any UI task:

1. **Analyze**
   - Identify which pattern group applies (hero/status/recommendation/timeline/form/list).
   - Decide the primary focal point for the screen.

2. **Map**
   - Map each visual part to existing tokens and shared components.
   - If missing, add/reuse tokens centrally instead of inline values.

3. **Build**
   - Implement with consistent spacing/radius/type rhythm.
   - Keep action hierarchy explicit (one primary action per zone).

4. **Review**
   - Run the checklist below before finishing.

## Design Consistency Checklist (Must pass)

- [ ] Screen has one clear primary focal area.
- [ ] Visual hierarchy is clear in grayscale (without relying on color only).
- [ ] Spacing follows a repeatable scale, not one-off numbers.
- [ ] Card radius/elevation are consistent with nearby surfaces.
- [ ] Primary action is visually and semantically unambiguous.
- [ ] Empty/loading/error states are visually coherent with the same system.
- [ ] No hardcoded copy or ad-hoc color literals.

## Additional Reference

- Detailed rationale and anti-pattern examples: [garage-visual-system.md](references/garage-visual-system.md)
