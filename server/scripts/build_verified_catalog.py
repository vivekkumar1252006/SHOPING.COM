# server/scripts/build_verified_catalog.py
import urllib.request
import json
import os

print("Starting verified catalog builder...")

# Fetch all products from DummyJSON
req = urllib.request.Request('https://dummyjson.com/products?limit=250', headers={'User-Agent': 'SmartCartBot/1.0'})
with urllib.request.urlopen(req) as resp:
    dummy_data = json.loads(resp.read().decode())['products']

print(f"Fetched {len(dummy_data)} products from DummyJSON.")
