from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/products"


def gradient_base(size=1200):
    image = Image.new("RGB", (size, size), "#13001f")
    px = image.load()
    for y in range(size):
        for x in range(size):
            nx = x / (size - 1)
            ny = y / (size - 1)
            mint = max(0, 1 - ((nx - 0.72) ** 2 + (ny - 0.25) ** 2) / 0.18)
            violet = max(0, 1 - ((nx - 0.2) ** 2 + (ny - 0.78) ** 2) / 0.2)
            r = int(19 + 24 * mint + 54 * violet)
            g = int(0 + 58 * mint + 24 * violet)
            b = int(31 + 50 * mint + 68 * violet)
            px[x, y] = (r, g, b)
    return image.convert("RGBA")


def make_visual(filename, offset, label):
    size = 1200
    base = gradient_base(size)
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for i in range(7):
        x = 170 + i * 118 + offset
        y = 280 + ((i % 3) - 1) * 56
        draw.ellipse(
            (x, y, x + 360, y + 360),
            outline=(144, 255, 231, 46),
            width=3,
        )

    for i in range(5):
        x0 = 220 + i * 130 - offset
        y0 = 670 + i * 18
        draw.rounded_rectangle(
            (x0, y0, x0 + 470, y0 + 70),
            radius=35,
            fill=(188, 164, 255, 18),
            outline=(144, 255, 231, 38),
            width=2,
        )

    glow = overlay.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(glow)
    base.alpha_composite(overlay)

    text_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    text_draw.rounded_rectangle((88, 88, 318, 142), radius=27, fill=(16, 0, 25, 170), outline=(144, 255, 231, 70), width=2)
    text_draw.text((120, 106), label, fill=(144, 255, 231, 235))
    base.alpha_composite(text_layer)

    OUT.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(OUT / filename, "PNG", optimize=True)


make_visual("product-01.png", 0, "PREVIEW 01")
make_visual("product-02.png", 55, "PREVIEW 02")
make_visual("product-03.png", -45, "PREVIEW 03")
print("created upcoming visuals")
