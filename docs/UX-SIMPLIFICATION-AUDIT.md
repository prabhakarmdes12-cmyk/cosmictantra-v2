# CosmicTantra UI/UX Simplification Audit

Date: 30 August 2026  
Scope: Primary public journeys and customer-facing tools, reviewed in the rendered application on desktop and a 390 × 844 mobile viewport.

## Executive conclusion

CosmicTantra has strong domain depth, but the interface presents too much of that depth at once. The home page currently behaves as a product catalogue, live dashboard, consultation funnel, methodology page, sample gallery, and learning hub simultaneously. This creates choice overload and makes the most valuable actions harder to identify.

The recommended product model is:

1. **Understand today** — Panchang and short daily guidance.
2. **Understand my chart** — Create/open one Kundli and progressively reveal detail.
3. **Ask an expert** — One consultation path with free-help reassurance inside it.

Everything else should live under a compact **Explore** menu or appear contextually after one of these three intents is selected.

## Evidence snapshot

| Page | Visible buttons | Visible text | Main issue |
|---|---:|---:|---|
| Home | 90 | 20,572 characters | Too many competing journeys and repeated CTAs |
| Master Kundli report | 35 | 4,211 characters | Dense control bar and 17-part navigation exposed at once |
| Daily forecast | 20 | 4,641 characters | Sharing and technical-proof actions repeated for every day |
| Calendar | 21 | 15,928 characters | Dense controls and too much information per calendar cell |
| Store | 27 | 5,068 characters | Repeated generic Add actions without strong product hierarchy |
| Aarti & Stotra | 29 | 3,843 characters | Long item picker competes with reading controls |

Mobile findings:

- Home: 67 of 73 paragraphs are below 14px; 87 interactive elements are below a 44px touch dimension.
- Daily: all 23 paragraphs are below 14px; 48 small interactive targets.
- Calendar: 52 small interactive targets, including 12 tightly packed month buttons.
- Store: all 18 paragraphs are below 14px; 70 small interactive targets.
- Kundali Milan: 46 small targets in an already input-heavy two-person flow.
- No audited page produced horizontal document overflow, which is a good baseline.

## P0: Simplify the core journeys

### 1. Replace the home-page catalogue with three primary intents

Keep above the fold:

- Primary: **Create my Kundli**
- Secondary: **See today’s Panchang**
- Tertiary: **Ask a Jyotishi**

Remove the separate “More Details” action from the Kundli form. Show birth time and place after the user enters name and birth date, or provide one clear “Add accurate birth details” expansion within the form.

Move the following below an **Explore all tools** entry or onto dedicated pages:

- six Muhurat service cards;
- three sample Kundli cards;
- nine individual Graha buttons;
- multiple consultation/practitioner cards;
- learning-topic grid;
- full methodology content;
- duplicate help-desk promotions.

Expected result: reduce the home page from 90 visible buttons to roughly 10–15 and make the primary conversion path visually unambiguous.

### 2. Use one consultation funnel

The current experience exposes “Free Help Desk,” “Talk Free on WhatsApp,” “Ask a Jyotishi,” “AI गुरु,” named practitioner consultations, and the ₹501 written consultation as parallel actions.

Recommended flow:

**Ask a Jyotishi** → choose **Quick free help** or **Detailed written consultation (₹501)** → collect only the fields required for that choice.

On `/ask`:

- keep one H1 and a two-sentence explanation;
- make the ₹501 consultation the primary action;
- move AI chat to a small “Help me frame my question” helper beside the question field;
- make WhatsApp a secondary reassurance link, not a separate competing card;
- explain what the user receives, expected response time, and refund/privacy terms before asking for contact information.

### 3. Create one profile and family-management surface

`/profile`, `/family`, and `/dashboard` overlap in profile selection, family members, active person, and card downloads.

Consolidate them into:

- **My Space** — current person, today’s guidance, current Dasha, saved reports;
- **Family profiles** — add/edit/select members;
- **Settings & privacy** — alerts, backup, consent, data controls.

Remove duplicate “Manage family profiles” and “Download Cosmic Card” controls from secondary pages. Show them only in My Space or the relevant profile detail.

### 4. Add consistent global wayfinding to the report

The Master Kundli report has no links and uses a standalone shell. Users can edit, print, download, and change report modes, but cannot clearly return to My Space, start over, or ask about the report.

Add a compact breadcrumb/header:

**My Space / Prabhakar’s Kundli / Master report**

Keep only:

- Back to My Space
- Edit birth details
- Download PDF
- More actions (Print, Share)

## P1: Reduce redundant controls

### Home

- Replace six identical “Request Personalised Muhurat” buttons with one “Explore Muhurat services” action after a compact service summary.
- Replace three identical “View Master Kundli” buttons with a horizontally scrollable sample gallery and one action on the selected sample.
- Show one help-desk CTA per page, preferably in the header or after a user encounters uncertainty—not both.
- Remove the second Dhanbad selector; location should have one authoritative control.
- Keep technical methodology behind “How calculations work.”

### Daily forecast

- Keep one day expanded; collapse tomorrow and the day after into summaries.
- Move WhatsApp and 9:16-card actions into one **Share** menu.
- Put ephemeris proof in a single “Calculation details” drawer for the entire forecast, rather than repeating it three times.
- Replace Daily/Weekly/Monthly/Yearly as four equal buttons with a compact period selector.

### Calendar

- Replace 12 month buttons with previous/next arrows plus one month/year picker.
- Combine “All,” “Power Days,” “Caution Days,” and “Festivals” into a single Filter control with removable chips.
- Keep only date, tithi, and one energy indicator in each cell; show full details after selection.
- Shorten the city selector result labels on mobile; state and coordinates can appear after selection.

### Master Kundli report

- Replace three reading-depth buttons with one selector labelled **Reading level**.
- Replace “Print / Save PDF” plus “Download PDF” with primary **Download PDF** and a More menu containing Print.
- Keep the nine-planet strip horizontally scrollable but use at least 44px-high targets.
- Group 17 volumes into 4 chapters and progressively disclose the individual volumes.
- Keep Folio/Workbench as a view selector inside a More or View menu unless usage data proves frequent switching.

### Kundali Milan

- Present Person A, then Person B, then Results as a three-step flow instead of one long form.
- Ask whether the user wants to use a saved profile before showing manual fields.
- Hide latitude and longitude by default; selecting a city should populate them automatically.
- Make GPS a trailing icon inside the location field, with an accessible 44px target.
- Show advanced calculation provenance after results, not before submission.

### Store and Upaya

- Replace generic “Add” with quantity-aware cart controls only after selection.
- Use product-specific labels only where necessary; one card click can open details and a single Add-to-cart action.
- Separate spiritual-information content from commerce: explain remedy suitability before showing products.
- Avoid presenting gemstones, Rudraksha, and rituals as equivalent instant purchases; use “Learn,” “Check suitability,” or “Request details” based on risk and service type.

### Aarti & Stotra Library

- On mobile, use a searchable title list or deity filter instead of displaying every long title as a large button.
- Keep reading controls sticky only after a text is selected.
- Combine A/A+/A++ into one font-size control.
- Put copy, meaning, and full/section reading options in a compact reader toolbar.

## P1: Readability system

Adopt these site-wide minimums:

- Body copy: 16px mobile, 16–18px desktop.
- Supporting metadata: 14px minimum; 12px only for nonessential labels.
- Body line-height: 1.5–1.65.
- Reading width: 60–72 characters for prose.
- Interactive targets: at least 44 × 44px, including icon buttons and text links used as actions.
- One primary filled button per section; secondary actions outlined or text-only.
- Avoid all-caps for sentences and long button labels.
- Use sentence case consistently: “Download PDF,” not “DOWNLOAD PDF.”
- Prefer one language at a time. Keep Sanskrit/Hindi terms as supporting labels or tooltips rather than duplicating every heading inline in both languages.

## P2: Navigation and information architecture

Recommended public navigation:

- Today
- My Kundli
- Consult
- Explore
- My Space

Recommended Explore groups:

- Calendar & Muhurat
- Compatibility & Numerology
- Aarti, Stotra & Library
- Remedies & Store

Move practitioner, partner, admin, test, dev, presentation, and operational workspaces out of customer navigation. They should remain role-gated and directly addressable, not discoverable beside public tools.

Simplify the footer to four groups with no repeated anchors. Currently several entries such as Tithi, Nakshatra, and Rahu Kaal point to the same home-page section, which creates the appearance of depth without distinct destinations.

## Recommended implementation sequence

### Sprint 1 — Highest impact, lowest risk

1. Simplify the global header and footer.
2. Reduce the home page to three intents plus a compact Explore section.
3. Raise mobile typography and touch-target minimums.
4. Consolidate duplicate share, download, and help actions.

### Sprint 2 — Core conversion flows

1. Rebuild consultation as one decision flow.
2. Convert Kundali Milan into a three-step form.
3. Simplify the Master Kundli action bar and group its 17 volumes.
4. Merge profile/family/dashboard concepts into My Space.

### Sprint 3 — Dense content tools

1. Simplify calendar navigation and cell content.
2. Create the focused Aarti/Stotra reader.
3. Clarify remedy-to-commerce transitions in Upaya and Store.

## Success measures

- Home-page visible actions: fewer than 15 before scrolling.
- Primary journey identifiable in a five-second test.
- Kundli creation completion rate and time-to-report.
- Consultation form start-to-submit completion rate.
- Mobile tap-target failures: zero in automated tests.
- Body text below 14px: zero for customer-facing content.
- Repeat-action labels per page: one canonical instance unless attached to distinct list items.
- Return-navigation coverage: every tool provides a clear route back to My Space or Explore.

## Important constraint

Do not solve density by hiding everything in unlabeled icon menus. The goal is progressive disclosure: show the next useful decision, preserve domain depth behind clear labels, and let advanced users open calculation details when they need them.
