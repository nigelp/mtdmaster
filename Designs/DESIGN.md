# Design System Strategy: The Elevated Editorial

## 1. Overview & Creative North Star

**Creative North Star: "The Digital Atelier"**
This design system is a rejection of the "generic SaaS" aesthetic. It moves away from the rigid, boxed-in layouts seen in traditional financial tools and moves toward a high-end, editorial experience. It is inspired by the precision of Apple’s human interface guidelines and the breathing room found in luxury print magazines.

The system breaks the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Rather than containing every element in a hard-edged box, we use a sophisticated hierarchy of whites and cool grays to guide the eye. Components should feel like they are resting on layers of fine paper or frosted glass, not pinned to a flat grid.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a spectrum of "Atmospheric Grays" and a singular, high-precision Blue accent.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or layout containment. Visual separation must be achieved exclusively through:
*   **Background Shifts:** Use `surface-container-low` (`#f2f3fa`) against a `surface` (`#f9f9fe`) background.
*   **Negative Space:** Utilize the Spacing Scale (specifically `8` to `12`) to create mental boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a physical environment with layered sheets. Use these tokens to create depth:
1.  **Base Layer:** `surface` (`#f9f9fe`) — The primary canvas.
2.  **Secondary Sectioning:** `surface-container-low` (`#f2f3fa`) — For grouped content like list backgrounds.
3.  **Elevated Components:** `surface-container-lowest` (`#ffffff`) — For high-priority cards or input fields to make them "pop" against the off-white base.

### The "Glass & Gradient" Rule
For floating elements (modals, navigation bars, or sticky headers), utilize **Glassmorphism**. Combine `surface` at 80% opacity with a `backdrop-blur` of 20px. 
*   **Signature Gradients:** For main CTAs, use a subtle linear gradient from `primary` (`#005bc1`) to `primary_dim` (`#004faa`) at a 135-degree angle. This adds "soul" and prevents the button from feeling digitally flat.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance authority with readability.

*   **Display & Headlines (Manrope):** The wider stance and geometric nature of Manrope provide a modern, architectural feel. 
    *   *Usage:* Use `display-lg` for hero numbers (e.g., Net Profit) to create a bold, high-contrast focal point.
*   **Body & Labels (Inter):** A workhorse for clarity. Inter provides the "Apple-esque" functional elegance required for dense data like transaction lists.
    *   *Hierarchy Tip:* Use `label-md` in all caps with a letter-spacing of 0.05rem for "Overhead" category headers to mimic luxury branding.

---

## 4. Elevation & Depth

Standard drop shadows are discarded in favor of **Tonal Layering** and **Ambient Light**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` (#FFFFFF) card sitting on a `surface-container-low` (#F2F3FA) background creates a natural lift without a single pixel of shadow.
*   **Ambient Shadows:** When an element must float (e.g., a mobile bottom sheet), use a "Soft-Focus" shadow:
    *   `Shadow Color`: Use `on-surface` (`#2c333d`) at 4% opacity.
    *   `Blur`: 40px to 60px.
    *   `Offset`: Y: 10px. 
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use `outline-variant` (`#acb2bf`) at **15% opacity**. This creates a "suggestion" of a line rather than a hard barrier.

---

## 5. Components

### Buttons
*   **Primary:** Gradient-filled (Primary to Primary-Dim), `md` (0.75rem) roundedness. No border.
*   **Secondary:** `surface-container-highest` background with `on-primary-container` text.
*   **Tertiary:** Ghost style. No background; text-only using `primary` color.

### Cards & Lists
*   **Cards:** Never use borders. Use `surface-container-lowest` against the darker `surface-dim` background. 
*   **Lists:** Forbid divider lines. Separate list items using `spacing-2` (0.7rem) of vertical white space or alternating `surface` and `surface-container-low` backgrounds.

### Input Fields
*   **Styling:** Background-fill of `surface-container-lowest`. 
*   **Interactions:** On focus, do not use a heavy border; instead, apply a 2px outer "glow" using the `primary` color at 20% opacity.

### Glassmorphic Tabs
*   For navigation (like the "Categories / Learning Rules" toggle), use a container with a `surface-variant` fill and a sliding `surface-container-lowest` "pill" to indicate the active state.

---

## 6. Do's and Don'ts

### Do
*   **DO** use generous padding inside cards (`spacing-6` or `8`) to give data room to breathe.
*   **DO** use `tertiary` (Gold) sparingly for "Success" or "Verified" states to maintain a premium feel.
*   **DO** overlap elements slightly (e.g., an icon breaking the top edge of a card) to create visual interest and move away from a "flat grid" look.

### Don't
*   **DON'T** use pure black (`#000000`) for text. Use `on-surface` (`#2c333d`) to keep the contrast sophisticated, not jarring.
*   **DON'T** use a shadow and a border at the same time. Choose one method of elevation and commit to it.
*   **DON'T** use standard system icons without checking their weight. Use "Light" or "Thin" weight icons to match the high-end typography scale.