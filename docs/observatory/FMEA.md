# FMEA — Initial Observatory Slice

| Failure | Severity | Detection / fallback | Coverage |
|---|---:|---|---|
| Wrong timezone / DST | High | IANA `Intl` conversion; display timezone+UTC; city catalogue legacy offsets are not used by Observatory | time tests required before release |
| Invalid coordinates | High | Range validation in `createObservatoryTime`; reject | unit test pending |
| Renderer unavailable/WASM/WebGL/context loss | Medium | Internal 2D route has no WebGL dependency | manual route verification |
| Renderer/calculation disagreement | Critical | Renderer has no calculation input path | architecture invariant |
| Ayanamsha mismatch | Critical | Canonical adapter only; parity test | `sidereal.spec.ts` |
| Nakshatra floating boundary | High | canonical classifier is used; epsilon policy not yet formalized | release blocker for Phase 4 |
| Worker stale response / crash | Medium | Request IDs prevent unknown responses from resolving; component destroys client on state change and retains no stale result | worker client code + horizon-event test |
| Profile permission / birth leakage | Critical | no profile/birth input or telemetry in MVP | code review |
| Malformed shared URL | Medium | no public state parser in MVP | deferred |
| Offline/catalogue failure | Low | no remote catalogue required | manual |
