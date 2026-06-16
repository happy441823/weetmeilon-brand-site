export type AnalyticsEventName =
  | "view_home"
  | "click_tmall_button"
  | "click_jd_button"
  | "click_tmall_product"
  | "click_jd_product"
  | "click_official_channel_button"
  | "view_product"
  | "view_product_list"
  | "view_products"
  | "view_upcoming_product"
  | "filter_product_status"
  | "filter_product_category"
  | "filter_product_subcategory"
  | "filter_product_series"
  | "search_product"
  | "click_product_detail"
  | "click_upcoming_product_detail"
  | "view_new_arrivals_section"
  | "view_material_page"
  | "view_faq"
  | "view_privacy_shipping"
  | "click_privacy_shipping"
  | "article_read"
  | "view_brand"
  | "view_guide"
  | "view_buy_page"
  | "view_contact";

export function trackEvent(event: AnalyticsEventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    event,
    ...params,
    timestamp: new Date().toISOString()
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (window.gtag) {
    window.gtag("event", event, params);
  }

  if (window._hmt) {
    window._hmt.push(["_trackEvent", "site", event, JSON.stringify(params)]);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", payload);
  }
}
