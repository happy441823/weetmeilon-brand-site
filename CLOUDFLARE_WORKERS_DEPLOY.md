# Cloudflare Workers Deployment

## Required environment variables

Set these in Cloudflare Workers Builds before the first production deployment:

```txt
NEXT_PUBLIC_SITE_URL=https://sweetmeilon.com
NEXT_PUBLIC_TMALL_STORE_URL=https://minvlang.tmall.com/
NEXT_PUBLIC_JD_STORE_URL=https://mall.jd.com/index-127854045.html?cid=0
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_BAIDU_TONGJI_ID=
ADMIN_UPLOAD_PASSWORD=<set-in-dashboard>
```

## Local verification

```bash
npm install
npm run build
npm run preview
```

## Deploy

```bash
npm run deploy
```

After the first successful deployment:

1. Bind `sweetmeilon.com` to this Worker as the only content domain.
2. Keep `www.sweetmeilon.com`, `sweetmeilon.cn`, and `www.sweetmeilon.cn` as redirect-only hostnames.
3. Verify `https://sweetmeilon.com/robots.txt` and `https://sweetmeilon.com/sitemap.xml`.
