"""Exact material-coordinate diagrams. Intentionally spoiler-labelled."""
from pathlib import Path
import json,re,html
HERE=Path(__file__).resolve().parent
data=json.loads(re.search(r'const DATA = (\{.*?\});',(HERE.parent.parent/'wind-ribbon-data.js').read_text(),re.S)[1])
out=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="770" viewBox="0 0 1200 770">',
'<rect width="1200" height="770" fill="#f5f2e8"/><g font-family="sans-serif" fill="#243d49">',
'<text x="45" y="45" font-size="25">風に綴じられた言葉 — 展開図・接続図（ネタバレ）</text>',
'<text x="45" y="80" font-size="16">s は素材に固定した位置。＋／− は切る前の長辺の仮称で、二本の独立した縁を意味しない。</text>',
'<rect x="100" y="140" width="1000" height="200" fill="#cad6d1" stroke="#536e78" stroke-width="2"/>',
f'<rect x="{100+data["task"]["from"]}" y="140" width="{data["task"]["to"]-data["task"]["from"]}" height="200" fill="#e5dcc2"/>',
'<path d="M100 140H1100M100 340H1100" stroke="#94a9b2" stroke-width="7"/>',
'<text x="35" y="147" font-size="19">−縁</text><text x="35" y="347" font-size="19">＋縁</text>',
'<text x="113" y="225" font-size="18">課題の本文を</text><text x="113" y="251" font-size="18">印刷する平面区間</text>',
'<text x="113" y="280" font-size="15">同じ布の s=.020〜.235</text>']
for g in data['glyphs']:
    x=100+g['station'];y=163 if g['edge']==-1 else 326
    out.append(f'<rect x="{x-20}" y="{y-29}" width="40" height="40" rx="3" fill="#f8f3dc" stroke="#7f969a"/><text x="{x}" y="{y}" text-anchor="middle" font-size="29">{html.escape(g["text"])}</text>')
for s,label in [(data['start']['station'],'✦ →'),(data['stop']['station'],'❖')]:
    out.append(f'<text x="{100+s}" y="377" font-size="23" text-anchor="middle">{label}</text>')
out.extend(['<text x="100" y="120" font-size="16">s=0</text><text x="1050" y="120" font-size="16">s=1</text>',
'<path d="M100 140C8 140 8 440 100 440H1100C1185 440 1185 340 1100 340" fill="none" stroke="#617f8b" stroke-width="2"/>',
'<path d="M100 340C35 340 35 480 100 480H1100C1160 480 1160 140 1100 140" fill="none" stroke="#96783f" stroke-width="2"/>',
'<text x="600" y="429" text-anchor="middle" font-size="17">右端の＋縁を左端の−縁へ接続</text>',
'<text x="600" y="508" text-anchor="middle" font-size="17">右端の−縁を左端の＋縁へ接続</text>',
'<text x="50" y="560" font-size="19">短辺全体の貼合せ： (s=1, v) ≡ (s=0, −v)。縁は分岐せず、ひとつの閉経路になる。</text>',
'<text x="50" y="604" font-size="21">✦ → よ → あ → け → を → つ → ぐ → い → と → ❖</text>',
'<text x="50" y="646" font-size="17">通常の二列読み：＋縁「ぐいとよ」／−縁「あけをつ」。銘はそのどちらでもない。</text>',
'<text x="50" y="682" font-size="17">札の区間を除くと「よ？？をつ？？と」。接続を通常の輪に戻すと「よぐいと」。</text>',
'<text x="50" y="728" font-size="15">これは検証用の展開図。プレイ画面に帯を自動展開・整列する機能は設けない。</text></g></svg>'])
(HERE/'material-layout-SPOILERS.svg').write_text('\n'.join(out)+'\n')
print(HERE/'material-layout-SPOILERS.svg')
