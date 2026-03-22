# Cinco — Future Enhancements

## Build iOS app (SwiftUI)

A native iOS app pulling from the same Cloudflare Worker, matching the web app's visual style.

**Card layout:**
- Use `ScrollView(.horizontal)` with `TabView` (page style) for swipe-between-cards behaviour
- `LinearGradient` for the purple background
- Playfair Display must be bundled as a custom font; Inter/SF Pro is available as the system font

**Data:**
- Fetch from the same Cloudflare Worker `?date=` endpoint using `URLSession`
- No changes needed to the worker
- HTML payloads (`drinkHtmlPayload` etc.) can be rendered via:
  - `AttributedString` (iOS 15+) — more native, but `<hr>` and custom styling won't carry over cleanly
  - `WKWebView` — full HTML fidelity with less effort

**Things to plan for:**
- **App Store review** — allow 1–7 days; content must comply with Apple guidelines
- **Date handling** — use `Calendar.current` not hardcoded UTC offsets
- **Dynamic Type** — font sizes must be relative to respect user accessibility preferences
- **Safe areas** — account for notch/Dynamic Island and home indicator insets
- **Accessibility** — VoiceOver labels on navigation arrows, sufficient contrast
- **Deep linking** — if sharing specific dates is needed, define a URL scheme early (e.g. `cinco://date/2026-06-05`)

---


## Add international font support

Load a subset of **Google Fonts Noto Sans** to handle non-Latin characters gracefully without requiring HTML payloads to define their own fonts.

**Implementation:**
1. Add a second `<link>` in `index.html` loading Noto Sans with the required subsets, e.g.:
   ```
   https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&family=Noto+Sans+Arabic&family=Noto+Sans+JP&family=Noto+Sans+SC&family=Noto+Sans+KR&display=swap
   ```
2. Append the Noto fonts to the `font-family` in `.card-body` in `styles.css`, after Inter:
   ```css
   font-family: 'Inter', 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans JP', 'Noto Sans SC', 'Noto Sans KR', 'PingFang SC', 'Hiragino Sans', 'Microsoft YaHei', 'Arabic UI Text', sans-serif;
   ```
3. Use `font-display: swap` to avoid blocking render on large CJK font files.

**Coverage:**
- Cyrillic — already covered by Inter
- CJK (Chinese/Japanese/Korean) — Noto Sans SC/JP/KR + system fallbacks
- Arabic — Noto Sans Arabic + "Arabic UI Text"
- Hebrew — consider adding Noto Sans Hebrew
- Devanagari — consider adding Noto Sans Devanagari

**Caveats:**
- CJK Noto font files are large; expect a brief flash-of-unstyled-text on first load for CJK content
- Full Arabic/Hebrew content is right-to-left — if RTL languages appear frequently, the card layout should also support `direction: rtl`, which is a more significant change
