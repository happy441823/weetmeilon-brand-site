"use client";

import Script from "next/script";
import { BAIDU_TONGJI_ID, GA4_ID } from "@/lib/constants";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    _hmt?: unknown[];
  }
}

export function AnalyticsProvider() {
  return (
    <>
      {GA4_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `}
          </Script>
        </>
      ) : null}
      {BAIDU_TONGJI_ID ? (
        <Script id="baidu-tongji" strategy="afterInteractive">
          {`
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}";
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(hm, s);
              window._hmt = _hmt;
            })();
          `}
        </Script>
      ) : null}
    </>
  );
}
