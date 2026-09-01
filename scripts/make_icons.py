#!/usr/bin/env python3
"""Create app and notification icons without third-party Python deps.

Uses rsvg-convert (and optionally magick) to rasterize the Bitcoin ₿ glyph.
"""
from __future__ import annotations

import math
import struct
import subprocess
import tempfile
import zlib
from pathlib import Path

# Official Bitboy / Wikimedia Commons "B" (already tilted ~14°).
# Do not use evenodd; the counters are reverse-wound for nonzero fill.
BITCOIN_B_SVG = """\
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path fill="#F7931A" d="m46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z"/>
</svg>
"""


def png(width: int, height: int, pixels: bytes, alpha: bool = True) -> bytes:
    channels = 4 if alpha else 3
    raw = b""
    stride = width * channels
    for y in range(height):
        raw += b"\x00" + pixels[y * stride : (y + 1) * stride]

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6 if alpha else 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def fill(w: int, h: int, color: tuple[int, int, int, int]) -> list[int]:
    px = []
    for _ in range(w * h):
        px.extend(color)
    return px


def blend(px: list[int], w: int, x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if not (0 <= x < w):
        return
    i = (y * w + x) * 4
    if not (0 <= i < len(px) - 3):
        return
    a = color[3] / 255
    inv = 1 - a
    px[i] = int(px[i] * inv + color[0] * a)
    px[i + 1] = int(px[i + 1] * inv + color[1] * a)
    px[i + 2] = int(px[i + 2] * inv + color[2] * a)
    src_a = color[3]
    dst_a = px[i + 3]
    px[i + 3] = int(src_a + dst_a * (1 - a))


def _alpha(color: tuple[int, int, int, int], coverage: float) -> tuple[int, int, int, int]:
    return (color[0], color[1], color[2], int(color[3] * max(0.0, min(1.0, coverage))))


def circle(
    px: list[int],
    w: int,
    h: int,
    cx: float,
    cy: float,
    r: float,
    color: tuple[int, int, int, int],
    ring: float | None = None,
    feather: float = 1.25,
) -> None:
    r_out = r + feather
    r_in = (r - ring) if ring else -feather
    y0 = max(0, int(cy - r_out) - 1)
    y1 = min(h, int(cy + r_out) + 2)
    x0 = max(0, int(cx - r_out) - 1)
    x1 = min(w, int(cx + r_out) + 2)
    for y in range(y0, y1):
        dy = y + 0.5 - cy
        for x in range(x0, x1):
            dist = math.hypot(x + 0.5 - cx, dy)
            outer = (r + 0.5 - dist) / feather + 0.5
            if outer <= 0:
                continue
            if ring:
                inner = (dist - (r_in - 0.5)) / feather + 0.5
                if inner <= 0:
                    continue
                cov = min(1.0, outer) * min(1.0, inner)
            else:
                cov = min(1.0, outer)
            if cov > 0.02:
                blend(px, w, x, y, _alpha(color, cov))


def semicircle(
    px: list[int],
    w: int,
    h: int,
    cx: float,
    cy: float,
    r: float,
    ox: float,
    oy: float,
    color: tuple[int, int, int, int],
    feather: float = 1.25,
) -> None:
    """Half-disk at (cx, cy) whose round side faces unit vector (ox, oy)."""
    r_out = r + feather
    y0 = max(0, int(cy - r_out) - 1)
    y1 = min(h, int(cy + r_out) + 2)
    x0 = max(0, int(cx - r_out) - 1)
    x1 = min(w, int(cx + r_out) + 2)
    for y in range(y0, y1):
        dy = y + 0.5 - cy
        for x in range(x0, x1):
            dx = x + 0.5 - cx
            dist = math.hypot(dx, dy)
            disk = (r + 0.5 - dist) / feather + 0.5
            if disk <= 0:
                continue
            half = (dx * ox + dy * oy) / feather + 0.5
            if half <= 0:
                continue
            cov = min(1.0, disk) * min(1.0, half)
            if cov > 0.02:
                blend(px, w, x, y, _alpha(color, cov))


def capsule(
    px: list[int],
    w: int,
    h: int,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    radius: float,
    color: tuple[int, int, int, int],
    feather: float = 1.25,
) -> None:
    dx, dy = x1 - x0, y1 - y0
    length_sq = dx * dx + dy * dy
    pad = radius + feather + 1
    minx = max(0, int(min(x0, x1) - pad))
    maxx = min(w, int(max(x0, x1) + pad) + 1)
    miny = max(0, int(min(y0, y1) - pad))
    maxy = min(h, int(max(y0, y1) + pad) + 1)
    for y in range(miny, maxy):
        py = y + 0.5
        for x in range(minx, maxx):
            px_ = x + 0.5
            if length_sq == 0:
                dist = math.hypot(px_ - x0, py - y0)
            else:
                t = ((px_ - x0) * dx + (py - y0) * dy) / length_sq
                t = 0.0 if t < 0 else 1.0 if t > 1 else t
                dist = math.hypot(px_ - (x0 + t * dx), py - (y0 + t * dy))
            cov = (radius + 0.5 - dist) / feather + 0.5
            if cov > 0.02:
                blend(px, w, x, y, _alpha(color, min(1.0, cov)))


def rasterize_svg(svg: str, size: int) -> bytes:
    # Render large, then downscale so small icons keep smooth edges.
    hi = max(size * 4, 1024)
    with tempfile.TemporaryDirectory() as tmp:
        svg_path = Path(tmp) / "bitcoin-b.svg"
        png_path = Path(tmp) / "bitcoin-b.png"
        svg_path.write_text(svg, encoding="utf-8")
        subprocess.check_call(
            ["rsvg-convert", "-w", str(hi), "-h", str(hi), "-o", str(png_path), str(svg_path)]
        )
        return subprocess.check_output(
            ["magick", str(png_path), "-resize", f"{size}x{size}", "-depth", "8", "RGBA:-"]
        )


def blit_mask(
    dest: list[int],
    dw: int,
    dh: int,
    mask: bytes,
    sw: int,
    dx: int,
    dy: int,
    fill: tuple[int, int, int, int],
    clip_cx: float,
    clip_cy: float,
    clip_r: float,
) -> None:
    """Stamp `fill` using the glyph's alpha as a mask (keeps orange from mixing muddy)."""
    clip_r2 = clip_r * clip_r
    fr, fg, fb, fa = fill
    for y in range(sw):
        py = dy + y
        if py < 0 or py >= dh:
            continue
        row = y * sw * 4
        for x in range(sw):
            px = dx + x
            if px < 0 or px >= dw:
                continue
            dist2 = (px - clip_cx) ** 2 + (py - clip_cy) ** 2
            if dist2 > clip_r2:
                continue
            coverage = mask[row + x * 4 + 3] / 255.0
            # Feather the circular clip so the B is not chopped into a hard jag.
            dist = dist2 ** 0.5
            feather = 2.0
            if dist > clip_r - feather:
                coverage *= max(0.0, (clip_r - dist) / feather)
            if coverage < 0.02:
                continue
            blend(dest, dw, px, py, (fr, fg, fb, int(fa * coverage)))


def draw_alarm(
    px: list[int],
    size: int,
    *,
    body: tuple[int, int, int, int],
    glyph_fill: tuple[int, int, int, int] | None,
    scale: float = 1.0,
) -> None:
    """Classic twin-bell alarm: bells + hammer on top, feet below, ₿ on the face.

    `scale` is relative to the canvas. Android adaptive icons only keep the
    center 72/108 (~66%) of the foreground, then mask to a circle/squircle.
    The unscaled drawing extends to ~0.475 of the canvas, so a launcher
    scale of ~0.66 keeps bells, hammer, and feet inside that safe circle.
    """
    cx = cy = size * 0.5
    u = size * scale
    outer_r = u * 0.353
    inner_r = u * 0.289
    ring_w = outer_r - inner_r

    # Semicircle bells: diameter sits just outside the rim so a navy gap
    # separates each bell from the main ring.
    bell_r = u * 0.100
    bell_gap = u * 0.022
    bell_angle = math.radians(54)
    bell_d = outer_r + bell_gap
    bells = []
    for sign in (-1, 1):
        ox = sign * math.sin(bell_angle)
        oy = -math.cos(bell_angle)
        bells.append((cx + ox * bell_d, cy + oy * bell_d, ox, oy))

    # Splayed feet first so the body sits on them.
    foot_r = u * 0.026
    foot_angle = math.radians(28)
    for sign in (-1, 1):
        sx = cx + sign * math.sin(foot_angle) * (outer_r - ring_w * 0.2)
        sy = cy + math.cos(foot_angle) * (outer_r - ring_w * 0.2)
        ex = cx + sign * math.sin(foot_angle) * (outer_r + u * 0.057)
        ey = cy + math.cos(foot_angle) * (outer_r + u * 0.057)
        capsule(px, size, size, sx, sy, ex, ey, foot_r, body)

    if glyph_fill is not None:
        glyph_scale = 1.4
        glyph_size = int(inner_r * 2 * glyph_scale)
        glyph = rasterize_svg(BITCOIN_B_SVG, glyph_size)
        blit_mask(
            px, size, size, glyph, glyph_size,
            int(cx - glyph_size // 2), int(cy - glyph_size // 2),
            fill=glyph_fill,
            clip_cx=cx, clip_cy=cy, clip_r=inner_r,
        )

    circle(px, size, size, cx, cy, outer_r, body, ring=ring_w)

    for bx, by, ox, oy in bells:
        semicircle(px, size, size, bx, by, bell_r, ox, oy, body)

    # Hammer / snooze sits in the gap above the rim.
    ring_top = cy - outer_r
    hammer_y = ring_top - u * 0.023
    capsule(px, size, size, cx, ring_top + ring_w * 0.2, cx, hammer_y, u * 0.016, body)
    capsule(px, size, size, cx - u * 0.033, hammer_y, cx + u * 0.033, hammer_y, u * 0.016, body)
    circle(px, size, size, cx, hammer_y, u * 0.028, body)


def downscale_png(data: bytes, size: int) -> bytes:
    # PNG32 keeps a real alpha channel (Android tints this as a status-bar mask).
    return subprocess.check_output(
        ["magick", "png:-", "-resize", f"{size}x{size}", "PNG32:-"],
        input=data,
    )


def main() -> None:
    out = Path("assets/images")
    out.mkdir(parents=True, exist_ok=True)
    size = 1024
    navy = (18, 38, 57, 255)
    orange = (247, 147, 26, 255)
    white = (255, 255, 255, 255)

    px = fill(size, size, navy)
    draw_alarm(
        px, size,
        body=orange,
        glyph_fill=orange,
        # Adaptive launcher crop: keep the whole clock inside the 66% safe zone.
        scale=0.66,
    )
    Path(out / "icon.png").write_bytes(png(size, size, bytes(px)))

    # Themed-icon / adaptive monochrome layer: white silhouette on transparent.
    # Same safe-zone scale as the color icon so bells and feet are not cropped.
    mpx = fill(size, size, (0, 0, 0, 0))
    draw_alarm(
        mpx, size,
        body=white,
        glyph_fill=white,
        scale=0.66,
    )
    Path(out / "monochrome-icon.png").write_bytes(png(size, size, bytes(mpx)))

    # Android status-bar icons are an alpha mask: white on transparent.
    npx = fill(size, size, (0, 0, 0, 0))
    draw_alarm(
        npx, size,
        body=white,
        glyph_fill=white,
    )
    Path(out / "notification-icon.png").write_bytes(
        downscale_png(png(size, size, bytes(npx)), 256)
    )
    print("wrote assets/images/icon.png, monochrome-icon.png, and notification-icon.png")


if __name__ == "__main__":
    main()
