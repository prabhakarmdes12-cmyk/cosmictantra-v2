# CosmicTantra — Hero Background Video Prompts & Configuration Guide

> To replace the background image with a video, drop your compiled `.mp4` file into `public/kashi-hero-video.mp4`. The Hero component is already configured with an `<video autoPlay loop muted playsInline>` layer and automatic fallback to `/varanasi-ghats-hero.jpg`.

---

## 📽️ AI Video Generation Prompts (Luma Dream Machine / Runway Gen-3 / Sora)

### Prompt 1: Sacred Celestial Dawn over Ganges (Recommended)
```text
Cinematic 8k slow panning shot of the ancient Man Mandir Ghat stone observatory at sunrise overlooking the sacred Ganges river in Varanasi, golden morning light reflecting on gentle river ripples, subtle luminescent gold 3D celestial astrolabe coordinate grid floating softly in the mist over the water, hyper-realistic, photorealistic, atmospheric depth, 24fps slow movement.
```

### Prompt 2: Digital Jantar Mantar Observatory at Night
```text
Photorealistic nighttime view of 18th-century stone astronomical instruments in Varanasi, deep indigo sky filled with glittering stars and glowing gold Sidereal planet orbit paths overhead, soft flickering diya oil lamps illuminating ancient stone steps, dramatic atmospheric cinematic lighting, 8k resolution, ultra-smooth motion.
```

### Prompt 3: Varanasi Ganga Aarti Divine Flame
```text
Close-up cinematic slow motion of a brass multi-tiered Aarti flame burning at Dashashwamedh Ghat in Varanasi at dusk, deep orange and amber flame glow, sacred smoke rising softly into dark blue twilight, subtle geometric sacred mandalas glowing faintly in the background haze, 8k ultra-hd, shallow depth of field.
```

### Prompt 4: Scholar's Study & Parchment Scroll
```text
Cinematic close-up of a traditional Sanskrit palm leaf manuscript scroll laying on a weathered dark wood table next to a glowing brass compass, soft ambient candlelight, digital gold constellations projecting gently above the scroll surface, hyper-detailed, atmospheric interior lighting.
```

---

## 🛠️ Video File Deployment Instructions

1. Export your generated video in **MP4 (H.264)** format with target bitrate ~3-5 Mbps.
2. Rename the file to **`kashi-hero-video.mp4`**.
3. Place it in **`public/kashi-hero-video.mp4`**.
4. Push to Git (`git add public/kashi-hero-video.mp4 && git commit -m "feat: added hero background video" && git push origin main`).
5. Next.js & Vercel will instantly render the video behind the Hero section across all desktop and mobile devices.
