# Data Lineage

`ObserverLocation + UTC instant` → `ObservatoryTime (IANA offset, JD, century)` → `calculateKundali` (canonical engine) → canonical sidereal Moon longitude → canonical Lahiri adapter classification → typed `BodyPosition` with frame/source/version/time metadata → 2D instrument and inspector.

The 2D instrument can only read `BodyPosition`; it does not calculate or classify Jyotish values. The visual star field and ecliptic are presentational and not a catalogue/ephemeris source.

## Privacy boundary
City selection remains client-side. No browser geolocation is requested. Query/deep-link state contains no birth profile or personal data. The MVP emits no Observatory analytics.
