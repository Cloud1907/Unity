#!/usr/bin/env python3
"""Generate a high-resolution UniTask Grid-Mark logo PNG for email use."""
from PIL import Image, ImageDraw, ImageFont

SCALE = 4  # Retina-quality
CELL = 30 * SCALE
GAP = 5 * SCALE
RAD = 8 * SCALE
SIZE = CELL * 2 + GAP

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

colors = {
    'g1': (91, 53, 245),   # #5B35F5
    'g2': (155, 123, 255), # #9B7BFF
    'g3': (196, 176, 255), # #C4B0FF
    'g4': (91, 53, 245),   # #5B35F5
}

# Top-left
draw.rounded_rectangle([0, 0, CELL, CELL], radius=RAD, fill=colors['g1'])
# Top-right
draw.rounded_rectangle([CELL + GAP, 0, CELL * 2 + GAP, CELL], radius=RAD, fill=colors['g2'])
# Bottom-left
draw.rounded_rectangle([0, CELL + GAP, CELL, CELL * 2 + GAP], radius=RAD, fill=colors['g3'])
# Bottom-right
draw.rounded_rectangle([CELL + GAP, CELL + GAP, CELL * 2 + GAP, CELL * 2 + GAP], radius=RAD, fill=colors['g4'])

# Checkmark on bottom-right cell
cx = CELL + GAP
cy = CELL + GAP
stroke_w = max(3, int(3.2 * SCALE))

# Checkmark points (scaled to cell)
p1 = (cx + int(CELL * 0.22), cy + int(CELL * 0.52))
p2 = (cx + int(CELL * 0.42), cy + int(CELL * 0.75))
p3 = (cx + int(CELL * 0.80), cy + int(CELL * 0.28))

draw.line([p1, p2], fill='white', width=stroke_w, joint='curve')
draw.line([p2, p3], fill='white', width=stroke_w, joint='curve')

# Add round caps
for p in [p1, p2, p3]:
    r = stroke_w // 2
    draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill='white')

# Save at high resolution (260x260 actual, displays at 65x65)
output_path = '/Users/cloudsmac/Documents/AntiGravity/UnityApp/dotnet-backend/Unity.API/wwwroot/unitask-logo-email.png'
img.save(output_path, 'PNG', optimize=True)
print(f"✅ Logo saved to {output_path} ({img.size[0]}x{img.size[1]})")
