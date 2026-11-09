import json
import re

with open('server/utils/sampleData.js', 'r', encoding='utf-8') as f:
    content = f.read()

products_match = re.findall(r'"name":\s*"([^"]+)".*?"category":\s*"([^"]+)".*?"images":\s*\[([^\]]+)\]', content, re.DOTALL)
print('Found products with images:', len(products_match))

cat_images = {}
for name, cat, imgs_str in products_match:
    urls = re.findall(r'https://images\.unsplash\.com/(photo-[a-zA-Z0-9_-]+)', imgs_str)
    if cat not in cat_images:
        cat_images[cat] = set()
    for u in urls:
        cat_images[cat].add(u)

for cat, imgs in cat_images.items():
    print(f'{cat}: {len(imgs)} unique photos')
