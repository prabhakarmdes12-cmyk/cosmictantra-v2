const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = 'public/assets/hero/banners';
const map = {
  'hero_cosmic_now_dial.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_01_cosmic_dial_1788830029682.jpg',
  'hero_janma_kundli_blueprint.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_02_janma_kundli_1788830048534.jpg',
  'hero_kashi_sahayak_ai.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_03_kashi_ai_1788830072508.jpg',
  'hero_drik_panchang_observatory.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_04_panchang_obs_1788830114932.jpg',
  'hero_kashi_scholars.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_05_kashi_scholar_1788830140040.jpg',
  'hero_vimshottari_dasha_river.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_06_dasha_river_1788830294503.jpg',
  'hero_guna_milan_matchmaking.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_guna_milan_matchmaking_1788825854021.jpg',
  'hero_kashi_ghats_darshan.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_08_kashi_ghats_1788830323224.jpg',
  'hero_vedic_muhurat_finder.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_09_muhurat_1788830352155.jpg',
  'hero_granth_stotra_sanctuary.webp': 'C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/hero_10_granth_library_1788830500503.jpg'
};

for (const [webpName, jpgPath] of Object.entries(map)) {
  const mainWebp = path.join(targetDir, webpName);
  const smWebp = path.join(targetDir, webpName.replace('.webp', '-sm.webp'));
  
  execSync(`npx --yes sharp-cli -i "${jpgPath}" -o "${mainWebp}" -q 85`);
  execSync(`npx --yes sharp-cli -i "${jpgPath}" -o "${smWebp}" -q 80 resize 384 216`);
  console.log('Successfully converted distinct image for:', webpName);
}
