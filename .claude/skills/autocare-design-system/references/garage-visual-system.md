# Garage Visual System Reference

## Why the current app screenshot feels unfinished

Observed from the current screen:
- Duplicate `Garage` headings create hierarchy noise.
- Large empty vertical space suggests no intentional content skeleton.
- Interactive emphasis is weak (`Go to login` looks like plain text).
- No visual grouping beyond default separators.
- The tab bar is clear, but the screen body lacks a focal anchor.

## Why the target screenshot feels premium and usable

Observed from the target direction:
- Strong top-to-bottom narrative: context -> status -> recommendation -> latest update.
- Intentional contrast: recommendation panel is immediately discoverable.
- Rounded cards create modular understanding of information chunks.
- Pairing compact status cards reduces scanning cost.
- CTA pair resolves decision anxiety (act now vs defer).

## UX intent to preserve across features

1. **3-second comprehension**
   - User should instantly know: which vehicle, current state, what action is needed.

2. **Progressive disclosure**
   - Overview on top-level cards.
   - Deep details only after a tap/navigation.

3. **State confidence**
   - Use status labels, timestamps, and feedback signals to reduce uncertainty.

4. **Calm density**
   - High information density is acceptable when spacing and typography separate priority.

## Anti-patterns to reject in code review

- Repeated section titles without hierarchy purpose.
- Long text paragraphs where concise labels/cards are expected.
- Primary actions that look visually equivalent to secondary actions.
- Mixed border radius/elevation values in sibling cards.
- Random margin/padding values that break rhythm.
- Purely decorative iconography without semantic value.

## Component-level guidance

- **Top context bar**
  - Keep concise, single-line primary context.
  - Secondary indicator/icon must not outshine context text.

- **Vehicle selector**
  - Make prev/next affordances obvious with hit-safe controls.
  - Selected vehicle must be unmistakable.

- **Hero/state card**
  - If image-heavy, overlay text must maintain readability.
  - Status should use short labels and avoid verbose copy.

- **Recommendation panel**
  - Reserve strongest attention color for recommendations only.
  - Keep copy short and decision-oriented.

- **Action buttons**
  - Primary action: higher contrast and stronger weight.
  - Secondary action: still clearly tappable, but calmer.

## Definition of done for visual consistency

A feature is visually done only if:
- it matches the spacing/radius/typography rhythm of nearby screens,
- action hierarchy is obvious without reading all text,
- loading/empty/error variants preserve the same visual language,
- and the screen still reads clearly when mentally reduced to blocks and labels.
