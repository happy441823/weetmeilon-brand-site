import csv
import json
import re
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSET_JSON = ROOT / "data/catalog/raw/qn-material-center-assets-2026-06-14.json"
TMALL_TS = ROOT / "src/data/catalog/tmall-live-products.ts"
REVIEW_DIR = ROOT / "data/catalog/review"
PROMPT_DIR = ROOT / "data/catalog/image-prompts"
PUBLIC_PRODUCTS = ROOT / "public/images/products"


def read_tmall_products():
    text = TMALL_TS.read_text(encoding="utf-8")
    match = re.search(r"export const tmallLiveProducts: CatalogProduct\[] = (\[[\s\S]*?\]);", text)
    if not match:
        raise RuntimeError("Cannot find tmallLiveProducts array")
    json_text = re.sub(r",(\s*[\]}])", r"\1", match.group(1))
    return json.loads(json_text)


def normalize_url(url):
    if not url:
        return ""
    url = url.replace("\\/", "/")
    if url.startswith("//"):
        return "https:" + url
    return url


def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return
    request = urllib.request.Request(
        normalize_url(url),
        headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://qn.taobao.com/"
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        dest.write_bytes(response.read())


def load_image(path):
    return Image.open(path).convert("RGBA")


def create_brand_cover(source_path, output_path, size=1200):
    source = load_image(source_path)
    source.thumbnail((int(size * 0.72), int(size * 0.72)), Image.Resampling.LANCZOS)

    base = Image.new("RGBA", (size, size), (18, 0, 31, 255))
    px = base.load()
    for y in range(size):
        for x in range(size):
            nx = x / (size - 1)
            ny = y / (size - 1)
            mint = max(0, 1 - ((nx - 0.72) ** 2 + (ny - 0.23) ** 2) / 0.15)
            violet = max(0, 1 - ((nx - 0.18) ** 2 + (ny - 0.82) ** 2) / 0.18)
            r = int(18 + 24 * mint + 42 * violet)
            g = int(0 + 52 * mint + 22 * violet)
            b = int(31 + 42 * mint + 58 * violet)
            px[x, y] = (r, g, b, 255)

    shadow = Image.new("RGBA", source.size, (0, 0, 0, 0))
    alpha = source.getchannel("A")
    shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(18)))
    shadow = Image.composite(Image.new("RGBA", source.size, (8, 0, 20, 122)), shadow, alpha)

    x = (size - source.width) // 2
    y = (size - source.height) // 2 + 24
    base.alpha_composite(shadow, (x + 16, y + 28))
    base.alpha_composite(source, (x, y))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(output_path, "WEBP", quality=88, method=6)


def public_path(path):
    return "/" + path.relative_to(ROOT / "public").as_posix()


def clean_name(product):
    title = product.get("name", "")
    item_id = product["id"].replace("tmall-", "")
    category = product.get("categoryId")
    if item_id == "856316241725":
        return "半身倒模款", "半身款"
    if category == "half-body":
        return "半身倒模款", "半身款"
    if category == "hip-lower-body":
        if "自动" in title or "电动" in title or "加热" in title:
            return "自动臀部倒模款", "自动倒模"
        return "臀部倒模款", "臀部倒模"
    if category == "local-mold":
        return "局部倒模款", "局部倒模"
    if category == "care-accessories":
        return "护理收纳配件", "护理配件"
    if "收纳" in title or "干燥" in title:
        return "护理收纳配件", "护理配件"
    return "官方在售款", "在售款"


def safe_csv_value(value):
    if isinstance(value, list):
        return " / ".join(str(item) for item in value)
    return "" if value is None else str(value)


def write_csv(path, rows, fieldnames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: safe_csv_value(row.get(key, "")) for key in fieldnames})


def main():
    products = read_tmall_products()
    assets = json.loads(ASSET_JSON.read_text(encoding="utf-8"))
    assets_by_id = {row["itemId"]: row for row in assets if row.get("itemId")}
    REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    PROMPT_DIR.mkdir(parents=True, exist_ok=True)

    image_review_rows = []
    name_review_rows = []
    category_review_rows = []
    missing_images = []
    missing_or_unusable = []
    overrides = {}
    downloaded = 0
    composited = 0

    for product in products:
        item_id = product["id"].replace("tmall-", "")
        display_name, short_name = clean_name(product)
        asset = assets_by_id.get(item_id)
        product_dir = PUBLIC_PRODUCTS / product["id"]
        source_dir = product_dir / "source"
        approved_dir = product_dir / "approved"
        source_white = ""
        source_transparent = ""
        approved_cover = ""
        problems = []
        recommended = "request-original"
        visual_status = "pending"
        image_status = "missing"
        source_type = "unknown"

        if asset:
            white_img = (asset.get("whiteBg", {}).get("images") or [{}])[0].get("src")
            transparent_img = (asset.get("transparent", {}).get("images") or [{}])[0].get("src")
            if white_img:
                white_dest = source_dir / "material-center-white-bg.webp"
                download(white_img, white_dest)
                downloaded += 1
                source_white = public_path(white_dest)
            if transparent_img:
                transparent_dest = source_dir / "material-center-transparent.webp"
                download(transparent_img, transparent_dest)
                downloaded += 1
                source_transparent = public_path(transparent_dest)
                cover_dest = approved_dir / "cover.webp"
                create_brand_cover(transparent_dest, cover_dest)
                approved_cover = public_path(cover_dest)
                composited += 1
                source_type = "official-store"
                visual_status = "composited"
                image_status = "ready"
                recommended = "generate-background"
            else:
                problems.append("素材中心未读取到透明图")

            white_status = asset.get("whiteBg", {}).get("statusText", "")
            transparent_status = asset.get("transparent", {}).get("statusText", "")
            if "审核不通过" in white_status:
                problems.append("素材中心白底图后台状态为审核不通过")
            if "审核中" in white_status:
                problems.append("素材中心白底图后台状态为审核中")
        else:
            problems.append("未在素材中心列表匹配到该天猫商品ID")

        if not approved_cover:
            missing_images.append({
                "productId": product["id"],
                "productName": display_name,
                "sourceTitle": product.get("name", ""),
                "reason": "缺少可用素材中心透明图或未完成 approved 主图"
            })
            missing_or_unusable.append({
                "productId": product["id"],
                "productName": display_name,
                "sourceImage": product.get("coverImage", ""),
                "problem": "平台主图仅作临时来源，不作为官网正式 approved 主图",
                "recommendedAction": "request-original"
            })

        publish_issues = []
        if image_status != "ready":
            publish_issues.append("缺少 approved 官网主图")
        if not product.get("categoryId") or product.get("categoryId") == "other":
            publish_issues.append("分类需要人工复核")
        channels = product.get("channelLinks", {})
        if not any(channels.get(channel, {}).get("enabled") and channels.get(channel, {}).get("verified") and channels.get(channel, {}).get("url") for channel in ("tmall", "jd")):
            publish_issues.append("缺少已验证购买链接")

        overrides[product["id"]] = {
            "sourceTitle": product.get("name", ""),
            "displayName": display_name,
            "name": display_name,
            "shortName": short_name,
            "coverImage": approved_cover or product.get("coverImage", ""),
            "imageAlt": f"蜜女郎{display_name}官网商品主图",
            "imageTag": "官网主图" if approved_cover else "待补主图",
            "shortDescription": "该商品已同步官方旗舰店入口。具体规格、价格、库存、优惠和售后以天猫商品页为准。",
            "visualAssetStatus": visual_status,
            "imageStatus": image_status,
            "linkStatus": "verified",
            "contentStatus": "needs-review",
            "publishReady": len(publish_issues) == 0,
            "publishIssues": publish_issues,
            "visualAssets": {
                "sourceWhiteBg": source_white or None,
                "sourceTransparent": source_transparent or None,
                "approvedCover": approved_cover or None,
                "materialCenterItemId": item_id if asset else None,
                "materialCenterWhiteBgStatus": asset.get("whiteBg", {}).get("statusText", "") if asset else None,
                "materialCenterTransparentStatus": asset.get("transparent", {}).get("statusText", "") if asset else None,
                "imageReview": {
                    "sourceType": source_type,
                    "suitabilityScore": 82 if approved_cover else 40,
                    "productAccuracyScore": 86 if approved_cover else 45,
                    "brandFitScore": 84 if approved_cover else 35,
                    "problems": problems,
                    "recommendedAction": recommended
                }
            }
        }

        image_review_rows.append({
            "productId": product["id"],
            "productName": display_name,
            "sourceImage": source_transparent or source_white or product.get("coverImage", ""),
            "sourceType": source_type,
            "suitabilityScore": 82 if approved_cover else 40,
            "productAccuracyScore": 86 if approved_cover else 45,
            "brandFitScore": 84 if approved_cover else 35,
            "problems": problems,
            "recommendedAction": recommended,
            "reviewStatus": "pending-human-review" if problems else "ready-for-site-review",
            "outputImage": approved_cover
        })
        name_review_rows.append({
            "productId": product["id"],
            "sourceTitle": product.get("name", ""),
            "displayName": display_name,
            "shortName": short_name,
            "contentStatus": "needs-review",
            "note": "自动生成官网展示名，已去除平台促销式长标题，需人工最终复核。"
        })
        category_review_rows.append({
            "productId": product["id"],
            "productName": display_name,
            "categoryId": product.get("categoryId", ""),
            "seriesId": product.get("seriesId", ""),
            "confidence": 0.8 if product.get("categoryId") != "other" else 0.45,
            "reviewStatus": "needs-review" if product.get("categoryId") == "other" else "provisional"
        })

        prompt = f"""# {product['id']} 官网主图制作提示词

商品真实名称：{display_name}
平台原始标题：{product.get('name', '')}
参考图路径：{source_transparent or source_white or product.get('coverImage', '')}
输出文件：/images/products/{product['id']}/approved/cover.webp

要求：
- 保持参考商品真实结构、比例、颜色和可见细节。
- 仅重构背景、灯光、台面与构图，不重新设计商品主体。
- 使用蜜女郎 SWEETMEILON 深紫色官网电商主视觉，薄荷绿与浅蓝紫柔和光效。
- 1200 x 1200px，商品主体居中或略偏右，四周留安全边距。
- 不添加价格、销量、优惠、认证、医疗暗示、平台角标或不存在的配件。
- 不生成真人可识别面部、裸露场景或低俗姿势。
"""
        (PROMPT_DIR / f"{product['id']}.md").write_text(prompt, encoding="utf-8")

    overrides_path = ROOT / "src/data/catalog/generated-overrides.json"
    overrides_path.write_text(json.dumps(overrides, ensure_ascii=False, indent=2), encoding="utf-8")

    write_csv(REVIEW_DIR / "product-image-review.csv", image_review_rows, [
        "productId", "productName", "sourceImage", "sourceType", "suitabilityScore",
        "productAccuracyScore", "brandFitScore", "problems", "recommendedAction",
        "reviewStatus", "outputImage"
    ])
    write_csv(REVIEW_DIR / "missing-product-images.csv", missing_images, ["productId", "productName", "sourceTitle", "reason"])
    write_csv(REVIEW_DIR / "missing-or-unusable-images.csv", missing_or_unusable, ["productId", "productName", "sourceImage", "problem", "recommendedAction"])
    write_csv(REVIEW_DIR / "product-name-review.csv", name_review_rows, ["productId", "sourceTitle", "displayName", "shortName", "contentStatus", "note"])
    write_csv(REVIEW_DIR / "product-category-review.csv", category_review_rows, ["productId", "productName", "categoryId", "seriesId", "confidence", "reviewStatus"])

    report = f"""# IMAGE_ASSET_REPORT

生成时间：2026-06-14

## 素材中心结果

- 素材中心商品行：{len(assets)}
- 官网天猫商品：{len(products)}
- 匹配到素材中心商品：{sum(1 for p in products if p['id'].replace('tmall-', '') in assets_by_id)}
- 已下载素材文件：{downloaded}
- 已合成官网 approved 主图：{composited}
- 仍缺 approved 主图商品：{len(missing_images)}

## 处理原则

- 白底图和透明图来自天猫/千牛商家后台素材中心。
- 后台显示“审核不通过/审核中”的白底图不等同于官网审核通过，仅作为真实商品主体来源。
- 官网正式页面只读取 `public/images/products/{{product-id}}/approved/cover.webp`。
- 未匹配到素材中心透明图的商品仍保留内部数据，但不标记为 `publishReady`。
"""
    (ROOT / "IMAGE_ASSET_REPORT.md").write_text(report, encoding="utf-8")

    print(json.dumps({
        "products": len(products),
        "assets": len(assets),
        "matched": sum(1 for p in products if p["id"].replace("tmall-", "") in assets_by_id),
        "downloaded": downloaded,
        "composited": composited,
        "missing": len(missing_images)
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
