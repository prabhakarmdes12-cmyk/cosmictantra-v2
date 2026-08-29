# CosmicTantra — Real-World Location Resolution Audit & Boundary Analysis

**Document ID**: `CT-LOC-REAL-WORLD-2026-08-29`  
**Status**: **AUDITED — BOUNDARY CONDITIONS IDENTIFIED**  
**Classification**: Geographical Geocoding & Historical Ephemeris Timezone Engine  

---

## 1. Executive Summary

This audit tests the real-world resolution capabilities of the four-field birth flow against 12 diverse locations representing Indian metros, small Jharkhand towns, obscure villages, duplicate locality names, pilgrimage centers, and global cities.

---

## 2. Test Execution Results

| Test Category | Input Query | Resolved Location | Coordinates | Timezone Offset | Timezone ID | Database Match? | Fallback Behavior / Boundary Analysis |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| **Indian Metro** | `"Mumbai"` | Mumbai, Maharashtra, India | $19.0760^\circ\text{N}, 72.8777^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ✅ Yes (1 match) | Exact match in static 516-city cache. |
| **Small Town (JH)** | `"Jhumri Telaiya"` | Dhanbad | $23.7957^\circ\text{N}, 86.4304^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ❌ No (0 match) | **Fell back to Dhanbad default**. Requires geocoder fallback or manual coords. |
| **Small Suburb (JH)** | `"Govindpur"` | Dhanbad | $23.7957^\circ\text{N}, 86.4304^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ❌ No (0 match) | **Fell back to Dhanbad default**. Located 12km from Dhanbad. |
| **Obscure Village** | `"McCluskieganj"` | Dhanbad | $23.7957^\circ\text{N}, 86.4304^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ❌ No (0 match) | **Fell back to Dhanbad default**. Historic Anglo-Indian village in Ranchi district. |
| **Obscure Village** | `"Maluti"` | Dhanbad | $23.7957^\circ\text{N}, 86.4304^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ❌ No (0 match) | **Fell back to Dhanbad default**. Temple village in Dumka district. |
| **Duplicate Name** | `"Rampur"` | Rampur, Uttar Pradesh, India | $28.8038^\circ\text{N}, 79.0261^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ⚠️ 3 Matches | Arbitrarily selected first match (UP). Bihar/HP Rampurs require user disambiguation. |
| **Duplicate Name** | `"Aurangabad"` | Aurangabad, Maharashtra, India | $19.8762^\circ\text{N}, 75.3433^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ⚠️ 1 Match | Matches Maharashtra. Aurangabad (Bihar) was not distinguished. |
| **Pilgrimage Center**| `"Varanasi"` | Varanasi, Uttar Pradesh, India | $25.3176^\circ\text{N}, 82.9739^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ✅ Yes (1 match) | Exact match. |
| **International (Nepal)**| `"Kathmandu"` | Dhanbad | $23.7957^\circ\text{N}, 86.4304^\circ\text{E}$ | $+5.5$ | `Asia/Kolkata` | ❌ No (0 match) | **Fell back to Dhanbad default**. Nepal UTC+5:45 offset not handled by static cache. |
| **International (UK)**| `"London"` | London, England, UK | $51.5074^\circ\text{N}, -0.1278^\circ\text{E}$ | $+1.0$ | `UTC` | ✅ Yes (1 match) | Exact match in static international presets. |
| **International (US)**| `"New York"` | New York, NY, USA | $40.7128^\circ\text{N}, -74.0060^\circ\text{E}$ | $-4.0$ | `UTC` | ✅ Yes (1 match) | Exact match in static international presets. |
| **International (AUS)**| `"Sydney"` | Sydney, NSW, Australia | $-33.8688^\circ\text{N}, 151.2093^\circ\text{E}$ | $+10.0$ | `UTC` | ✅ Yes (1 match) | Exact match in static international presets. |

---

## 3. Key Findings & Boundary Limitations

1. **Static 516-City Cache Coverage**:
   - Covers all major Indian district headquarters and tier-1/tier-2 cities.
   - **Fails on sub-district tehsils, blocks, and villages** (e.g. *Jhumri Telaiya*, *Govindpur*, *Maluti*, *McCluskieganj*), falling back to the default city (*Dhanbad*).
2. **Duplicate City Disambiguation**:
   - For names such as *Rampur* (UP, Bihar, Himachal) and *Aurangabad* (Maharashtra, Bihar), text substring matching takes the first entry. The UI search dropdown exposes the state name to allow user disambiguation, but programmatic resolution must support `"City, State"` parsing.
3. **Historical Daylight Saving Time (DST) & Timezone Shifts**:
   - Standard longitude approximation or fixed offsets do not account for historical War Time (e.g. India Summer Time 1942–1945 $+6.5\text{h}$) or international DST changes without an IANA Timezone Database lookup.
4. **GPS & Custom Coordinates Safety**:
   - The engine correctly allows direct custom latitude, longitude, and timezone override, which is the verified workaround for any village or unindexed location.

---

## 4. Production Recommendation

1. **Keep Offline 516 Cache as Zero-Latency Tier 1**.
2. **Add Multi-Result Selection Modal** when searching ambiguous names.
3. **Always preserve user-supplied custom GPS coordinates** via `ResolvedBirthPlace` contract.
