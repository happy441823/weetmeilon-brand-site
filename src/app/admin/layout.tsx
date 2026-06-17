import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SWEETMEILON CMS 后台",
  description: "蜜女郎品牌官网内容管理后台",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

