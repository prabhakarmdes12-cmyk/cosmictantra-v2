# Varga and strength-system audit

What this product computes, what it delivers, and the difference between the
two.

The engine computes sixteen divisional charts. Two of them are delivered. The
remaining fourteen are computed, unverified, and — until this audit — were
also being advertised.

---

## 1. The finding that prompted this

The appendix of every delivered report carried this line:

```
Divisional charts: 16 (D1–D60 shodashavarga)
```

A reader takes that as "this report includes sixteen divisional charts". It
did not: it included two. The other fourteen were computed in the canonical
model and used by nothing. The line was true about the model and false about
the report, which is the most dangerous kind of true statement, because
nobody writing it had to lie.

It now reads:

```
Divisional charts delivered: 2 — D1 Rashi and D9 Navamsha. These two, and
                             only these two, are drawn and verified.
Divisional charts computed
but not delivered:           14 more are computed in the model as part of the
                             shodashavarga set. They are not drawn, not stated
                             and not verified: verifying a varga requires its
                             own boundary fixtures, and that work has not been
                             done. Their presence in the model is not a claim
                             that they are correct.
```

The count is computed from the model, not typed, so it cannot drift.

---

## 2. The sixteen

| Varga | Name | संस्कृत | Traditional significance | Status |
|---|---|---|---|---|
| D1 | Rashi | राशि | Physical Body, General Life & Destiny | **Delivered** |
| D2 | Hora | होरा | Wealth, Prosperity & Financial Assets | Not delivered |
| D3 | Drekkana | द्रेष्काण | Siblings, Courage, Vitality & 22nd Drekkana | Not delivered |
| D4 | Chaturthamsha | चतुर्थांश | Fixed Assets, Real Estate, Home & Fortune | Not delivered |
| D7 | Saptamsha | सप्तांश | Children, Progeny & Creative Lineage | Not delivered |
| D9 | Navamsha | नवांश | Spouse, Marriage, Dharma & Soul Purpose | **Delivered** |
| D10 | Dashamsha | दशांश | Career, Profession, Fame & Public Standing | Not delivered |
| D12 | Dwadashamsha | द्वादशांश | Parents, Ancestors & Past Karma | Not delivered |
| D16 | Shodashamsha | षोडशांश | Vehicles, Conveyances, Pleasures & Comforts | Not delivered |
| D20 | Vimshamsha | विंशांश | Spiritual Pursuits, Upasana & Devotion | Not delivered |
| D24 | Chaturvimshamsha | चतुर्विंशांश | Learning, Higher Education, Knowledge & Vidya | Not delivered |
| D27 | Saptavimshamsha | सप्तविंशांश | General Strengths, Weaknesses & Stamina | Not delivered |
| D30 | Trimshamsha | त्रिंशांश | Misfortunes, Arishta, Evils & Overcoming Obstacles | Not delivered |
| D40 | Khavedamsha | खवेदांश | Auspicious & Inauspicious Karmic Influences | Not delivered |
| D45 | Akshavedamsha | अक्षवेदांश | General Well-Being & All Moral Qualities | Not delivered |
| D60 | Shashtiamsha | षष्ट्यंश | Micro-Karma, Deep Past-Life Destiny & Final Balance | Not delivered |

"Delivered" means: drawn as a vector chart, repeated as a placement table,
covered by boundary fixtures, and checked by fourteen gate checks against the
canonical model.

"Not delivered" means: computed in the model, used by nothing, verified by
nothing, and not mentioned in any delivered report.

---

## 3. Why the fourteen stay undelivered

A divisional chart is a division of each sign into equal parts, but the
mapping from part to resulting sign is not the same for every varga. D9
advances by whole signs per navamsha within each element group; D3, D7, D10
and others each have their own rule, and several have competing rules.

Delivering a varga means asserting that its mapping is right. The only way to
support that assertion is a set of boundary fixtures: planets placed just
below, exactly at, and just above each division boundary, with the expected
resulting sign supplied independently rather than read back out of the code
under test.

D1 and D9 have that. The others do not. Until they do, they stay in the model
and out of the report.

**D10 in particular.** It is the next one people ask for, and it is
explicitly gated: it may be delivered only after it has passed its own
boundary fixtures. `varga-audit.spec.ts` asserts that the string `D10` does
not appear anywhere in a delivered report, so it cannot slip out.

---

## 4. Strength systems

| System | Computed internally | Delivered | Independently verified |
|---|---|---|---|
| Shadbala (six-fold strength) | Yes | No | No |
| Ashtakavarga | Yes | No | No |
| Jaimini chara karakas | Yes | No | No |
| Ashtakoota matching | Yes | No | No |
| Gochara (transits) | Yes | No | No |

All five are declared as not carried in the appendix and counted in the
Scholar Summary's not-calculated list. Being computed internally is not being
verified, and neither is being delivered — the report says all three things
separately, because collapsing them is where the varga line went wrong.

---

## 5. What is enforced

`tests/kundli-pipeline/varga-audit.spec.ts` makes the boundary executable
rather than a matter of discipline:

- The model does compute sixteen vargas, so the tests are not vacuous.
- Only D1 and D9 appear as chart sections or placement tables.
- `D10` and `Dashamsha` appear nowhere in a delivered report.
- No varga outside the delivered set is named anywhere in the report — which
  is why the disclosure now says "the shodashavarga set" instead of
  "D1–D60", since naming D60 in a sentence about not naming it was still
  naming it.
- The delivered and undelivered counts are computed from the model.
- Each strength system is declared as not carried rather than silently
  omitted.

To deliver another varga, change `DELIVERED_VARGAS` in that file and add its
boundary fixtures in the same commit. The tests will fail until both are
done.

---

## 6. What this audit did not do

It did not verify any varga. It did not check D2–D60 against a reference
implementation or a published table; it established only that they are
computed and not delivered. Verifying them is the work described in §3, and
it has not started.

It also did not audit the accuracy of the varga engine's mathematics. The
fourteen undelivered vargas may be correct or wrong. This report makes no
claim either way, which is the point.
