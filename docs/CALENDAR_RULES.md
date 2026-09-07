# 🪔 Vedic Calendar Rules & Festival Engine Specification (`CALENDAR_RULES.md`)

**Date**: September 7, 2026  
**Classification**: Traditional Jyotish & Astronomical Decision Rules Architecture

---

## 1. The 5 Limbs of Panchang (पञ्चाङ्ग गणित)

1. **Tithi (तिथि)**: Determined by solar-lunar elongation $(\lambda_{\text{Moon}} - \lambda_{\text{Sun}}) / 12^\circ$.
   - **Sunrise Tithi (उदयातिथि)**: The Tithi prevailing at local Sunrise determines the calendar date for most observances.
   - **Pradosh Tithi**: Tithi prevailing during sunset / dusk window ($\approx 1.5\text{ hours}$ after sunset) for Pradosh Vrat and Shivaratri.
2. **Nakshatra (नक्षत्र)**: Ecliptic longitude of Moon divided into 27 equal divisions of $13^\circ 20'$.
3. **Yoga (योग)**: Sum of solar and lunar longitudes $(\lambda_{\text{Sun}} + \lambda_{\text{Moon}}) / 13^\circ 20'$.
4. **Karana (करण)**: Half-tithi ($6^\circ$ elongation).
5. **Vara (वार)**: Solar day from local Sunrise to next Sunrise.

---

## 2. Comprehensive Festival Determination Rules

### A. Shiva Family Observances
- **Mahashivaratri**: Krishna Paksha Chaturdashi during Nishita Kaal (Midnight) of Magha/Phalguna.
- **Pradosh Vrat**: Trayodashi Tithi prevailing during Pradosh Kaal (Sunset $+ 1.5\text{h}$).
- **Shravan Somvar**: Mondays during Shravan lunar month.

### B. Vishnu / Krishna Family Observances
- **Ekadashi (Smart / Vaishnav)**: Ekadashi Tithi at Sunrise without Dashami overlap (Arunodaya Vedha).
- **Janmashtami**: Krishna Paksha Ashtami with Rohini Nakshatra at Nishita Kaal (Midnight) in Bhadrapada.
- **Dev Uthani Ekadashi**: Shukla Paksha Ekadashi in Kartik month.

### C. Devi Family Observances
- **Chaitra & Sharad Navratri**: Ashwin & Chaitra Pratipada Tithi at Sunrise to Navami.
- **Durga Ashtami**: Shukla Paksha Ashtami prevailing during day.
- **Kali Puja**: Amavasya Tithi prevailing at Midnight in Kartik.

### D. Ganesha Family Observances
- **Ganesh Chaturthi**: Bhadrapada Shukla Paksha Chaturthi prevailing during Madhyahna (Midday).
- **Sankashti Chaturthi**: Krishna Paksha Chaturthi prevailing at Moonrise.

### E. Surya Family Observances
- **Chhath Puja**: Kartik Shukla Paksha Shashthi (Sandhya & Usha Arghya to Sun).
- **Makar Sankranti**: Exact timestamp when Sun enters Sidereal Capricorn (Makar Rashi).

### F. Regional & General Observances
- **Chithirai Vishu / Puthandu**: Solar New Year in Tamil Nadu.
- **Pohela Boishakh**: Bengali Solar New Year.
- **Bihu**: Assam Solar transits.
- **Onam**: Chingam month Shravana Nakshatra in Kerala.
- **Vat Savitri, Karwa Chauth, Bhai Dooj, Basant Panchami, Nag Panchami**.
