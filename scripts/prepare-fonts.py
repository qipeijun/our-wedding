"""将合法取得的思源宋体制作成自托管字形子集；不上传文案。"""
import json
import sys
from pathlib import Path
from hashlib import sha256
from fontTools import subset
from fontTools.ttLib import TTFont

if len(sys.argv) != 3:
    raise SystemExit('用法：python3 scripts/prepare-fonts.py 字体.otf LICENSE.txt（需 fonttools 与 brotli）')
source, license_path = map(Path, sys.argv[1:])

def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)

text = ''.join(strings(json.loads(Path('config/wedding.json').read_text()))) + ''.join(strings(json.loads(Path('config/copy.json').read_text())))
text += '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ·：，。（）／-+↓↗'
font = TTFont(source)
missing = sorted({ord(c) for c in text if not c.isspace()} - set(font.getBestCmap()))
if missing:
    raise SystemExit('源字体缺字：' + ''.join(chr(c) for c in missing))
options = subset.Options()
options.flavor = 'woff2'
options.name_IDs = ['*']
options.name_legacy = True
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
# 子集是修改版，按 OFL 保留版权/许可并替换保留名称 Source。
for record in font['name'].names:
    if record.nameID in [1, 3, 4, 6, 16, 21]:
        name = 'WeddingSerif-SemiBold' if record.nameID == 6 else 'Wedding Serif'
        record.string = name.encode(record.getEncoding())
if 'CFF ' in font:
    font['CFF '].cff.fontNames = ['WeddingSerif-SemiBold']
    top = font['CFF '].cff.topDictIndex[0]
    top.FamilyName = 'Wedding Serif'
    top.FullName = 'Wedding Serif SemiBold'
font.flavor = 'woff2'
Path('public/fonts').mkdir(parents=True, exist_ok=True)
font.save('public/fonts/wedding-serif.woff2')
Path('public/fonts/OFL.txt').write_bytes(license_path.read_bytes())
report = {'source': 'Adobe Source Han Serif CN SemiBold', 'sourceUrl': 'https://github.com/adobe-fonts/source-han-serif/tree/release/SubsetOTF/CN', 'sha256': sha256(source.read_bytes()).hexdigest(), 'subsetFamily': 'Wedding Serif', 'weight': 600, 'glyphCharacters': len(set(text)), 'missing': [], 'outputBytes': Path('public/fonts/wedding-serif.woff2').stat().st_size, 'license': 'SIL OFL 1.1; public/fonts/OFL.txt'}
Path('docs/v2/font-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False))
