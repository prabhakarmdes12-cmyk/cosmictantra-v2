#!/usr/bin/env python3
"""Dev-time thumbnail generator for calendar event artwork.

Creates `<name>-sm.webp` (384×216, q72) next to every `<name>.webp` under
public/assets/calendar/events — used for the lightweight month-grid strips
while the full-size files serve the day-detail hero.

Usage: python3 scripts/make-art-thumbs.py [width] [height]
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
EVENTS = os.path.normpath(os.path.join(HERE, '..', 'public', 'assets', 'calendar', 'events'))
W = int(sys.argv[1]) if len(sys.argv) > 1 else 384
H = int(sys.argv[2]) if len(sys.argv) > 2 else 216

made = skipped = 0
for name in sorted(os.listdir(EVENTS)):
    if not name.endswith('.webp') or name.endswith('-sm.webp'):
        continue
    src = os.path.join(EVENTS, name)
    dst = os.path.join(EVENTS, name[:-5] + '-sm.webp')
    if os.path.exists(dst):
        skipped += 1
        continue
    with Image.open(src) as im:
        im = im.convert('RGB').resize((W, H), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=72, method=6)
    made += 1
print(f'{EVENTS}: made {made} thumbs ({W}x{H}), skipped {skipped} existing')
