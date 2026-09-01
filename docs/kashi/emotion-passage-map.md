# Kashi Sahayak — emotion → verified passage map

**Generated from:** `src/lib/kashi/emotionalSupport.ts` (`EMOTION_PATHS`)
**Store:** canonical Granth store, `src/lib/granth/data/granths/bhagavad-gita.ts`
**Verified by:** `tests/kashi-sahayak.spec.ts` — "every displayed verse exists verbatim in the canonical store"

No verse text is stored in the support module. Each emotion holds only a **reference**
(book slug + section id + shloka number); the text is resolved from the canonical store at
call time and asserted to exist verbatim in it. If a reference ever stops resolving, the
assistant says honestly that no verified passage is available — it never substitutes one.

| Emotion | Label | Book | Section | Shloka ref | Resolved verse id | Opening words |
| --- | --- | --- | --- | --- | --- | --- |
| `sadness` | उदासी / शोक | bhagavad-gita | gita-ch-2 | २-१४ | श्लोक २-१४ | मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदा |
| `anxiety` | चिंता / भय | bhagavad-gita | gita-ch-18 | १८-६६ | श्लोक १८-६६ | सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज |
| `anger` | क्रोध | bhagavad-gita | gita-ch-2 | २-६३ | श्लोक २-६३ | क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रम |
| `confusion` | भ्रम / अनिर्णय | bhagavad-gita | gita-ch-2 | २-७ | श्लोक २-७ | कार्पण्यदोषोपहतस्वभावः पृच्छामि त्वां धर्म |
| `loneliness` | अकेलापन | bhagavad-gita | gita-ch-9 | ९-२९ | श्लोक ९-२९ | समोऽहं सर्वभूतेषु न मे द्वेष्योऽस्ति न प्रियः |
| `stress` | तनाव / बोझ | bhagavad-gita | gita-ch-2 | २-४८ | श्लोक २-४८ | योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय |
| `confidence` | आत्मविश्वास की कमी | bhagavad-gita | gita-ch-6 | ६-५ | श्लोक ६-५ | उद्धरेदात्मनात्मानं नात्मानमवसादयेत् |
| `relationship` | रिश्तों में तकलीफ़ | bhagavad-gita | gita-ch-12 | १२-१३ | श्लोक १२-१३ | अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च |
| `career` | करियर की अनिश्चितता | bhagavad-gita | gita-ch-2 | २-४७ | श्लोक २-४७ | कर्मण्येवाधिकारस्ते मा फलेषु कदाचन |
| `spiritual` | आध्यात्मिक जिज्ञासा | bhagavad-gita | gita-ch-4 | ४-३४ | श्लोक ४-३४ | तद्विद्धि प्रणिपातेन परिप्रश्नेन सेवया |
| `just-talk` | बस बात करनी है | — | — | — | — | (no passage by design) |

## Provenance reported with every passage

| Field | Source |
| --- | --- |
| Book title | `item.title` |
| Source / edition line | `item.source` — e.g. *Mahabharata (Bhishma Parva, Chapters 25-42, Maharshi Ved Vyasa)* |
| Store verification flag | `item.verified` (true for all four Granths) |
| Section | `section.id` (e.g. `gita-ch-2`) |
| Verse id | `verse.shlokaNo` (e.g. `श्लोक २-४७`) |
| Fingerprint | SHA-256 over `book|section|verse|original|meaning` |
| Extraction checksum | `src/lib/granth/data/manifest.ts` — `src/lib/granth/data/granths/bhagavad-gita.ts` = `0cd941d1f4444a45b39ea25dd8f54ebc0059a0e3f58c91128498b7f378a82375` |

The store's own note applies: *"Checksums cover the emitted JSON, not an external edition."*
The extraction manifest records no licensed external edition, so these provenance fields
attest **what is in this repository**, not agreement with a printed edition.

## Crisis path

Any crisis pattern (`detectCrisis`) bypasses this table entirely: no verse is offered, the
response is the safety guidance (Tele-MANAS 14416 / 1-800-891-4416, emergency 112), and mode
is irrelevant.
