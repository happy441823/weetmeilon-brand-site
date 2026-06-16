export const storeLinks = {
  tmall: process.env.NEXT_PUBLIC_TMALL_STORE_URL || "https://minvlang.tmall.com/",
  jd: process.env.NEXT_PUBLIC_JD_STORE_URL || "https://mall.jd.com/index-127854045.html?cid=0"
} as const;

export type StoreChannel = keyof typeof storeLinks;
