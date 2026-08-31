#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate full 18-chapter Bhagavad Gita TSX sections for granthsData[0]."""
import json, re, io

DIGITS = '०१२३४५६७८९'
def dev(n):
    return ''.join(DIGITS[int(c)] for c in str(n))

def load_hi(ch):
    """Return (speakers list, verse_map {n: hindi}) for chapter ch."""
    p = f'gita_raw/hi/{int(ch):02d}.txt'
    speakers, verses = [], {}
    for line in open(p, encoding='utf-8').read().split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('SP|'):
            speakers.append(line[3:])
        elif re.match(r'^\d+\|', line):
            n, text = line.split('|', 1)
            verses[int(n)] = text.strip()
    return speakers, verses

SPEAKER_RE = re.compile(r'^(श्रीभगवानुवाच|श्रीभगवान् उवाच|धृतराष्ट्र उवाच|सञ्जय उवाच|अर्जुन उवाच)\s*।\s*$')

def split_embedded_speaker(text):
    lines = text.split('\n')
    if lines and SPEAKER_RE.match(lines[0].strip()):
        return lines[0].strip(), '\n'.join(lines[1:]).strip()
    return None, text

data = json.load(open('gita_raw/gita.json', encoding='utf-8'))

out = io.StringIO()

for ch in sorted(data, key=int):
    speakers, verse_hindi = load_hi(ch)
    sp_idx = 0
    info = data[ch]
    name = info['name'].rstrip('ः')
    en = info['en']
    verses = [it for it in info['items'] if it['type'] == 'verse']
    count = len(verses)
    out.write(f"""      {{
        id: 'gita-ch-{ch}',
        title: 'अध्याय {dev(int(ch))} • {name} ({dev(count)} श्लोक)',
        subtitle: 'Chapter {ch} — {en} • Complete ({count} Shlokas)',
        verses: [
""")
    for it in info['items']:
        if it['type'] == 'speaker':
            label = it['label']
            sans = label
            no = label.rstrip(' ।')
            hindi = speakers[sp_idx]; sp_idx += 1
            out.write(f"""          {{
            shlokaNo: '{no}',
            sanskrit: `{sans}`,
            hindi: '{hindi}',
          }},
""")
        else:
            n = it['n']
            text = it['text']
            sp_line, text = split_embedded_speaker(text)
            if sp_line:
                no = sp_line.rstrip(' ।')
                sans = sp_line
                hindi = speakers[sp_idx]; sp_idx += 1
                out.write(f"""          {{
            shlokaNo: '{no}',
            sanskrit: `{sans}`,
            hindi: '{hindi}',
          }},
""")
            hindi = verse_hindi[n]
            out.write(f"""          {{
            shlokaNo: 'श्लोक {dev(int(ch))}-{dev(n)}',
            sanskrit: `{text}`,
            hindi: '{hindi}',
          }},
""")
    out.write("""        ],
      },
""")

open('gita_raw/gita_sections.txt', 'w', encoding='utf-8').write(out.getvalue())
print('gita_sections.tsx written, bytes:', len(out.getvalue().encode('utf-8')))
