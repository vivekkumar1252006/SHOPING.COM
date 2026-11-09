import urllib.request
import json

url = 'https://dummyjson.com/products?limit=200'
req = urllib.request.Request(url, headers={'User-Agent': 'SmartCartBot/1.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

print(f"Total products: {len(data['products'])}")
for p in data['products']:
    cat = p['category']
    title = p['title']
    imgs = p.get('images', [])
    thumb = p.get('thumbnail', '')
    print(f"[{cat}] {title}: thumb={thumb}, imgs_count={len(imgs)}")
