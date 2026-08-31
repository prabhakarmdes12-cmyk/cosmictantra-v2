# Kashi Sahayak patch integration

Source: user-supplied `01a05790-2c90-73ca-98ea-cac91b23a87d.patch`.
Avatar: user-supplied `download.jpg`, copied unchanged to
`public/images/avatar/kashi_sahayak_apsara.jpg`. The old image is retained.

## Included

- Feminine Hindi self-reference and the new avatar across the floating chat.
- Mood check-in, shared mood options, and capability shortcuts.
- Confirm-before-use birth date/time/place input with city disambiguation.
- Local conversation restoration and reset controls. Restores expire after seven days.
- Speech decoration removal, voice ranking, sentence chunking and stop handling.

## Corrections to the supplied patch

- Time chips with parenthesized Hindi labels parse correctly.
- Nighttime small hours remain AM; invalid 24-hour times are rejected.
- Seconds survive normalization; space-separated hour/minute input works.
- Hindi city/state input and dotted state abbreviations are supported.
- Both chat handlers run the existing safety policy before mood/intake/astrology.
- Partial floating-chat confirmations no longer save default time/place into profiles.
- A matching name alone cannot overwrite a different saved birth record.
- Stale confirmation/sample chips are ignored outside their intake stage.
- Modal pending confirmations survive reload; transient calculation/payment states resume
  at an actionable step rather than a permanent spinner.
- Long unpunctuated speech is actually bounded to 260-character chunks.
- Hindi confirmation grammar uses feminine present-tense phrasing rather than blanket
  replacement of object-agreeing past participles.

## Verification and limits

- `npm run typecheck` passed.
- 190 unit/corpus/contradiction regression tests passed.
- Production build generated 610 static pages; home first-load JS is about 250 KB.
- Three production-browser tests passed: avatar/greeting and crisis routing in the floating
  chat, crisis priority in consultation mood intake, and the time-chip intake flow without
  premature profile saves. Total selected checks: 193 passed.
- Voice availability/gender and audible quality depend on the device; no guarantee that
  every platform offers a female Hindi voice. Speech audio was not subjectively evaluated.
- Chat history and personal details are stored in this browser; use Start Fresh on shared
  devices. Local storage is not an encryption or legal-compliance guarantee.
- No real payment, message, consultation booking, or external delivery was tested.
- The isolated checkout has no database configuration; analytics writes report missing
  `DATABASE_URL`. Browser checks therefore do not qualify database-backed workflows.
- This integration is local until explicitly committed/pushed and deployment verified.
