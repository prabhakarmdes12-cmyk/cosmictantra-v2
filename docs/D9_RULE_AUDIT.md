# CosmicTantra — D9 Navamsha & Varga Mathematics Audit

**Document ID**: `CT-D9-RULE-AUDIT-2026-08-29`  
**Status**: **COMPLETED — PARASHARI RULE FORMULATION**  
**Classification**: Harmonic Divisional Varga Architecture  

---

## 1. Classical Jyotish Principle

The Navamsha (D9 chart) is the 9th harmonic divisional chart of Vedic astrology, representing the **Dharma**, inner potential, spiritual destiny, and marriage/partnership matrix (*Bhagya & Jaya Bhava*).

Each 30° Rashi (zodiac sign) is divided into **9 equal parts (Navamshas)** of:
$$\text{Span of 1 Navamsha} = \frac{30^\circ}{9} = 3^\circ 20' = 3.333333^\circ$$
Across the 12 signs of the zodiac, there are exactly:
$$12 \times 9 = 108\text{ Navamshas}$$
This coincides exactly with the **108 Nakshatra Padas** ($27 \times 4 = 108$).

---

## 2. Parashari Mapping Rules (*Brihat Parashara Hora Shastra*)

According to *Brihat Parashara Hora Shastra* (BPHS Chapter 6, Slokas 17–21):

1. **For Agni Rashis (Fire Signs: Aries, Leo, Sagittarius)**:
   The 9 Navamshas start from **Mesha (Aries)** and proceed sequentially:
   $$\text{Mesha} \longrightarrow \text{Vrishabha} \longrightarrow \dots \longrightarrow \text{Dhanu}$$
2. **For Prithvi Rashis (Earth Signs: Taurus, Virgo, Capricorn)**:
   The 9 Navamshas start from **Makara (Capricorn)** and proceed sequentially:
   $$\text{Makara} \longrightarrow \text{Kumbha} \longrightarrow \dots \longrightarrow \text{Kanya}$$
3. **For Vayu Rashis (Air Signs: Gemini, Libra, Aquarius)**:
   The 9 Navamshas start from **Tula (Libra)** and proceed sequentially:
   $$\text{Tula} \longrightarrow \text{Vrishchika} \longrightarrow \dots \longrightarrow \text{Mithuna}$$
4. **For Jala Rashis (Water Signs: Cancer, Scorpio, Pisces)**:
   The 9 Navamshas start from **Karka (Cancer)** and proceed sequentially:
   $$\text{Karka} \longrightarrow \text{Simha} \longrightarrow \dots \longrightarrow \text{Meena}$$

---

## 3. Mathematical Implementation Audit in CosmicTantra

In `src/lib/jyotish/canonicalSnapshot.ts`, the function `calculateNavamshaRashi(longitude)` is defined as:

```typescript
export function calculateNavamshaRashi(longitude: number): { rashiId: number; rashiName: string; pada: number } {
  const norm = normalizeAngle(longitude);
  const rashiIndex = Math.floor(norm / 30); // 0 to 11
  const degInRashi = norm % 30;
  const navamshaIndexInRashi = Math.floor(degInRashi / (30 / 9)); // 0 to 8
  const pada = navamshaIndexInRashi + 1;

  // Fire (0), Earth (1), Air (2), Water (3)
  const elementOffsets = [0, 9, 6, 3]; // Aries (0), Cap (9), Libra (6), Cancer (3)
  const baseOffset = elementOffsets[rashiIndex % 4];
  const navamshaRashiIndex = (baseOffset + navamshaIndexInRashi) % 12;
  const navamshaRashi = RASHIS[navamshaRashiIndex];

  return {
    rashiId: navamshaRashiIndex + 1,
    rashiName: navamshaRashi.name,
    pada
  };
}
```

### Mathematical Equivalence Proof:
Notice that:
$$\text{Global Navamsha Index} = \left\lfloor \frac{\text{Longitude}}{3^\circ 20'} \right\rfloor = \left\lfloor \frac{\text{Longitude} \times 60}{200} \right\rfloor$$
And the Navamsha sign index ($0 = \text{Aries}, \dots, 11 = \text{Pisces}$) is strictly:
$$\text{Navamsha Sign} = \text{Global Navamsha Index} \pmod{12}$$

Because:
- Aries (0°–30°): segments 0..8 $\rightarrow$ Signs 0..8 (Mesha to Dhanu).
- Taurus (30°–60°): segments 9..17 $\rightarrow$ Signs 9..17 mod 12 = 9..5 (Makara to Kanya).
- Gemini (60°–90°): segments 18..26 $\rightarrow$ Signs 18..26 mod 12 = 6..2 (Tula to Mithuna).
- Cancer (90°–120°): segments 27..35 $\rightarrow$ Signs 27..35 mod 12 = 3..11 (Karka to Meena).

The algorithm implemented in CosmicTantra is **100% faithful to the Parashari rule**.

---

## 4. Vargottama Condition (वर्गोत्तम)

A planet is **Vargottama (Supreme in Divisional Strength)** when its natal D1 sign and D9 Navamsha sign are identical ($D1_{\text{Rashi}} = D9_{\text{Rashi}}$).

| Sign Type | Natal Signs | Vargottama Navamsha Position | Degree Span in Sign |
| :--- | :--- | :--- | :--- |
| **Movable (Chara)** | Aries, Cancer, Libra, Capricorn | **1st Navamsha** (Mesha / Karka / Tula / Makara) | $00^\circ 00' - 03^\circ 20'$ |
| **Fixed (Sthira)** | Taurus, Leo, Scorpio, Aquarius | **5th Navamsha** (Vrishabha / Simha / Vrishchika / Kumbha) | $13^\circ 20' - 16^\circ 40'$ |
| **Dual (Dvisvabhava)** | Gemini, Virgo, Sagittarius, Pisces | **9th Navamsha** (Mithuna / Kanya / Dhanu / Meena) | $26^\circ 40' - 30^\circ 00'$ |

---

## 5. Specification for Future Vargas (Shodashavarga Architecture)

Before implementing additional Vargas, the following strict Parashari mapping rules are established:

| Varga | Name | Division Size | Computation Rule |
| :--- | :--- | :--- | :--- |
| **D1** | Rashi | $30^\circ 00'$ | Ecliptic sign (Direct sidereal placement) |
| **D2** | Hora | $15^\circ 00'$ | Sun (Leo) / Moon (Cancer) based on odd/even signs |
| **D3** | Drekkana | $10^\circ 00'$ | 1st part: Same sign; 2nd part: 5th sign; 3rd part: 9th sign |
| **D4** | Chaturthamsha | $07^\circ 30'$ | 1st: Same sign; 2nd: 4th sign; 3rd: 7th sign; 4th: 10th sign |
| **D7** | Saptamsha | $04^\circ 17' 08.57''$ | Odd signs: Count from same sign; Even signs: Count from 7th sign |
| **D9** | Navamsha | $03^\circ 20'$ | Count from Movable sign of triplicity (Aries, Cap, Libra, Cancer) |
| **D10** | Dashamsha | $03^\circ 00'$ | Odd signs: Count from same sign; Even signs: Count from 9th sign |
| **D12** | Dvadamsha | $02^\circ 30'$ | Count sequentially starting from the natal sign itself |
| **D60** | Shashtiamsha | $00^\circ 30'$ | 60 named deity portions per sign |
