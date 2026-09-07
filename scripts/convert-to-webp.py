#!/usr/bin/env python3
"""Dev-time converter: center-crop any source image to 16:9 and emit WebP.

Usage: python3 scripts/convert-to-webp.py <in.png> <out.webp> [width] [height]
Default target 1280x720 (16:9). Requires Pillow with WebP support.
"""
import sys
from PIL import Image, ImageOps

def main():
    src, dst = sys.argv[1], sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1280
    h = int(sys.argv[4]) if len(sys.argv) > 4 else 720
    im = Image.open(src).convert('RGB')
    # centre-crop to target aspect, then resize
    target_aspect = w / h
    sw, sh = im.size
    aspect = sw / sh
    if aspect > target_aspect:
        nw = int(sh * target_aspect)
        x = (sw - nw) // 2
        im = im.crop((x, 0, x + nw, sh))
    elif aspect < target_aspect:
        nh = int(sw / target_aspect)
        y = (sh - nh) // 2
        im = im.crop((0, y, sw, y + nh))
    im = im.resize((w, h), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=82, method=6)
    print(f'{dst}: {im.size} webp ok')

if __name__ == '__main__':
    main()
