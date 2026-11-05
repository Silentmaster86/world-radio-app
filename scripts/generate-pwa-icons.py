"""Regenerate the maskable icon from the existing brand artwork. Pillow 12.3.0."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1] / 'public/icons'
with Image.open(root / 'web-app-manifest-512x512.png') as source:
    icon = source.convert('RGBA').resize((384, 384), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (512, 512), '#0d1220')
    canvas.alpha_composite(icon, (64, 64))
    canvas.convert('RGB').save(root / 'maskable-512.png', optimize=True)
