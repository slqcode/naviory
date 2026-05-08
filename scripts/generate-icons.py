#!/usr/bin/env python3
"""生成 Naviory 扩展图标（16/48/128 像素）
设计：圆角方形紫色渐变背景 + 白色 "N" 字母 + 右上角导航箭头
使用纯 Python 标准库（zlib）生成 PNG，无需 PIL
"""
import zlib
import struct
import math
import os

# 颜色定义
INDIGO_START = (79, 70, 229)   # #4F46E5
INDIGO_END = (124, 58, 237)    # #7C3AED
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

def write_png(path, width, height, rgba_pixels):
    """将 RGBA 像素数组写入 PNG 文件
    rgba_pixels: [[(r,g,b,a), ...], ...] (height x width)
    """
    def chunk(tag, data):
        return (
            struct.pack('>I', len(data)) +
            tag +
            data +
            struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        )

    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR: width, height, bit depth=8, color type=6 (RGBA)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)

    # IDAT: 每行前加一个 filter byte (0 = None)
    raw = bytearray()
    for row in rgba_pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend([r, g, b, a])
    idat = zlib.compress(bytes(raw), 9)

    with open(path, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    )


def rounded_square_mask(size, radius):
    """返回 size x size 的遮罩，1 表示在圆角矩形内，[0,1] 表示抗锯齿边缘"""
    mask = [[0.0] * size for _ in range(size)]
    # 超采样抗锯齿：每像素 4x4 采样
    ss = 4
    for y in range(size):
        for x in range(size):
            count = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = x + (sx + 0.5) / ss
                    py = y + (sy + 0.5) / ss
                    # 判断点是否在圆角矩形内
                    cx = max(radius, min(size - radius, px))
                    cy = max(radius, min(size - radius, py))
                    dx = px - cx
                    dy = py - cy
                    if dx * dx + dy * dy <= radius * radius:
                        count += 1
            mask[y][x] = count / (ss * ss)
    return mask


def draw_n_letter(size):
    """返回 size x size 的 'N' 字母遮罩（粗体）"""
    mask = [[0.0] * size for _ in range(size)]
    # N 字母用线段构造：左竖 + 斜线 + 右竖
    # 字母覆盖区域：中心 70%
    pad = size * 0.22
    w = size - 2 * pad
    stroke = w * 0.22  # 笔画粗细

    # 三条线段：左竖、斜线、右竖
    segments = [
        # (x1, y1, x2, y2)
        (pad, pad, pad, size - pad),                          # 左竖
        (pad, pad, size - pad, size - pad),                   # 斜线（左上→右下）
        (size - pad, pad, size - pad, size - pad),            # 右竖
    ]

    ss = 4  # 超采样
    for y in range(size):
        for x in range(size):
            count = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = x + (sx + 0.5) / ss
                    py = y + (sy + 0.5) / ss
                    inside = False
                    for (x1, y1, x2, y2) in segments:
                        # 点到线段距离
                        dx = x2 - x1
                        dy = y2 - y1
                        length_sq = dx * dx + dy * dy
                        if length_sq == 0:
                            continue
                        t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / length_sq))
                        projx = x1 + t * dx
                        projy = y1 + t * dy
                        dist_sq = (px - projx) ** 2 + (py - projy) ** 2
                        if dist_sq <= (stroke / 2) ** 2:
                            inside = True
                            break
                    if inside:
                        count += 1
            mask[y][x] = count / (ss * ss)
    return mask


def draw_arrow_dot(size):
    """在右上角画一个小圆点，作为"导航/定位"标志"""
    mask = [[0.0] * size for _ in range(size)]
    cx = size * 0.78
    cy = size * 0.22
    r = size * 0.09

    ss = 3
    for y in range(size):
        for x in range(size):
            count = 0
            for sy in range(ss):
                for sx in range(ss):
                    px = x + (sx + 0.5) / ss
                    py = y + (sy + 0.5) / ss
                    if (px - cx) ** 2 + (py - cy) ** 2 <= r * r:
                        count += 1
            mask[y][x] = count / (ss * ss)
    return mask


def generate_icon(size):
    radius = size * 0.22  # 圆角半径
    bg_mask = rounded_square_mask(size, radius)
    # 小尺寸下 N 字母细节太多，用简化版
    letter_mask = draw_n_letter(size) if size >= 32 else None
    dot_mask = draw_arrow_dot(size) if size >= 32 else None

    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            bg_alpha = bg_mask[y][x]
            if bg_alpha <= 0:
                row.append((0, 0, 0, 0))
                continue

            # 背景：从左上到右下的渐变
            t = (x + y) / (2 * size)
            bg_color = lerp_color(INDIGO_START, INDIGO_END, t)
            r, g, b = bg_color

            # 小尺寸（16px）用简化方案：纯渐变背景 + 一个白色小圆点提示
            if size < 32:
                # 中心白圆点
                cx, cy = size / 2, size / 2
                dist = math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2)
                dot_r = size * 0.28
                if dist <= dot_r:
                    # 距离越近越白
                    edge = dot_r - dist
                    alpha = min(1, edge * 2)
                    r = int(lerp(r, 255, alpha))
                    g = int(lerp(g, 255, alpha))
                    b = int(lerp(b, 255, alpha))
                a = int(bg_alpha * 255)
                row.append((r, g, b, a))
                continue

            # 大尺寸：在背景上叠加白色 N 字母 + 右上角小点
            letter_alpha = letter_mask[y][x] if letter_mask else 0
            dot_alpha = dot_mask[y][x] if dot_mask else 0
            fg_alpha = max(letter_alpha, dot_alpha)

            if fg_alpha > 0:
                r = int(lerp(r, 255, fg_alpha))
                g = int(lerp(g, 255, fg_alpha))
                b = int(lerp(b, 255, fg_alpha))

            a = int(bg_alpha * 255)
            row.append((r, g, b, a))
        pixels.append(row)

    return pixels


if __name__ == '__main__':
    os.makedirs('public/icons', exist_ok=True)
    for size in (16, 48, 128):
        print(f'Generating icon-{size}.png...')
        pixels = generate_icon(size)
        write_png(f'public/icons/icon-{size}.png', size, size, pixels)
    print('Done.')
