from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/brand"


def make_image(filename, label, accent):
    width, height = 1200, 900
    image = Image.new("RGBA", (width, height), (19, 0, 31, 255))
    px = image.load()
    for y in range(height):
        for x in range(width):
            nx = x / width
            ny = y / height
            glow = max(0, 1 - ((nx - 0.72) ** 2 + (ny - 0.28) ** 2) / 0.14)
            low = max(0, 1 - ((nx - 0.2) ** 2 + (ny - 0.85) ** 2) / 0.2)
            px[x, y] = (
                int(19 + accent[0] * glow + 34 * low),
                int(0 + accent[1] * glow + 18 * low),
                int(31 + accent[2] * glow + 48 * low),
                255,
            )

    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for i in range(6):
        x0 = 160 + i * 120
        y0 = 230 + (i % 2) * 75
        draw.rounded_rectangle(
            (x0, y0, x0 + 420, y0 + 110),
            radius=55,
            fill=(144, 255, 231, 20),
            outline=(144, 255, 231, 50),
            width=3,
        )
    draw.rounded_rectangle((80, 70, 360, 132), radius=31, fill=(16, 0, 25, 175), outline=(144, 255, 231, 75), width=2)
    draw.text((112, 92), label, fill=(144, 255, 231, 240))
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1)))
    OUT.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(OUT / filename, "PNG", optimize=True)


make_image("material-detail.png", "MATERIAL", (60, 95, 80))
make_image("package.png", "PACKAGE", (48, 88, 108))
make_image("privacy-shipping.png", "PRIVACY", (78, 70, 120))
make_image("care-storage.png", "CARE", (58, 105, 92))
print("created brand placeholders")
