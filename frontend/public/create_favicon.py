#!/usr/bin/env python3
"""
Creates a pixel-perfect favicon: purple rounded square with white hexagon outline.
Guaranteed transparent background - no AI generation artifacts.
"""
import math
from PIL import Image, ImageDraw

SIZE = 512
OUTPUT = '/Users/cloudsmac/Documents/AntiGravity/UnityApp/frontend/public/logo.png'
OUTPUT192 = '/Users/cloudsmac/Documents/AntiGravity/UnityApp/frontend/public/logo192.png'
OUTPUT512 = '/Users/cloudsmac/Documents/AntiGravity/UnityApp/frontend/public/logo512.png'

# Create a fully transparent canvas
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Draw purple rounded rectangle
padding = 40
radius = 100
purple = (124, 58, 237, 255)  # #7c3aed - solid purple, no white
draw.rounded_rectangle(
    [padding, padding, SIZE - padding, SIZE - padding],
    radius=radius,
    fill=purple
)

# Draw white hexagon outline in the center
cx, cy = SIZE // 2, SIZE // 2
hex_radius = 130  # outer radius
stroke_width = 18

# Calculate 6 vertices of hexagon (flat-top orientation, rotated 30 deg)
points = []
for i in range(6):
    angle_deg = 60 * i - 30  # -30 to start at top
    angle_rad = math.radians(angle_deg)
    x = cx + hex_radius * math.cos(angle_rad)
    y = cy + hex_radius * math.sin(angle_rad)
    points.append((x, y))

# Draw filled white hexagon first (slightly larger), then purple to create an outline effect
outer_pts = []
for i in range(6):
    angle_deg = 60 * i - 30
    angle_rad = math.radians(angle_deg)
    outer_pts.append((cx + hex_radius * math.cos(angle_rad), cy + hex_radius * math.sin(angle_rad)))

inner_pts = []
inner_r = hex_radius - stroke_width
for i in range(6):
    angle_deg = 60 * i - 30
    angle_rad = math.radians(angle_deg)
    inner_pts.append((cx + inner_r * math.cos(angle_rad), cy + inner_r * math.sin(angle_rad)))

draw.polygon(outer_pts, fill=(255, 255, 255, 255))  # white fill
draw.polygon(inner_pts, fill=purple)                  # hollow center

img.save(OUTPUT, 'PNG')
img.save(OUTPUT192, 'PNG')
img.save(OUTPUT512, 'PNG')
print(f"Saved to {OUTPUT}")
