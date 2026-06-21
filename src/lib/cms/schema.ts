export type CmsRole = "super_admin" | "editor" | "reviewer" | "viewer";

export type CmsResource =
  | "admin_users"
  | "admin_roles"
  | "products"
  | "categories"
  | "product_series"
  | "product_tags"
  | "articles"
  | "article_categories"
  | "article_tags"
  | "pages"
  | "homepage_sections"
  | "faqs"
  | "faq_categories"
  | "media_assets"
  | "navigation_items"
  | "footer_groups"
  | "footer_items"
  | "site_settings"
  | "redirects"
  | "audit_logs"
  | "publish_jobs"
  | "import_jobs"
  | "imported_product_sources"
  | "imported_media_sources"
  | "seo_generation_jobs"
  | "seo_push_logs";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "json" | "select" | "datetime";

export type CmsField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  options?: { label: string; value: string }[];
};

export type CmsResourceConfig = {
  table: string;
  primaryKey?: string;
  label: string;
  labelPlural: string;
  searchable: string[];
  mutableRoles: CmsRole[];
  readRoles?: CmsRole[];
  writeRoles?: CmsRole[];
  deleteRoles?: CmsRole[];
  fields: CmsField[];
  listColumns: string[];
};

export const productStatusOptions = [
  { label: "草稿", value: "draft" },
  { label: "待审核", value: "pending_review" },
  { label: "即将上新", value: "coming_soon" },
  { label: "定时发布", value: "scheduled" },
  { label: "已发布", value: "published" },
  { label: "已下架", value: "offline" },
  { label: "归档", value: "archived" }
];

export const articleStatusOptions = [
  { label: "草稿", value: "draft" },
  { label: "待审核", value: "pending_review" },
  { label: "定时发布", value: "scheduled" },
  { label: "已发布", value: "published" },
  { label: "已下架", value: "offline" },
  { label: "归档", value: "archived" }
];

export const cmsResources = {
  admin_users: {
    table: "admin_users",
    label: "管理员",
    labelPlural: "管理员管理",
    searchable: ["email", "name"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin"],
    writeRoles: ["super_admin"],
    deleteRoles: ["super_admin"],
    listColumns: ["email", "name", "is_active", "last_login_at"],
    fields: [
      { name: "email", label: "邮箱", type: "text", required: true },
      { name: "name", label: "姓名", type: "text" },
      { name: "avatar_url", label: "头像 URL", type: "text" },
      { name: "is_active", label: "启用", type: "boolean" }
    ]
  },
  admin_roles: {
    table: "admin_roles",
    label: "角色",
    labelPlural: "角色管理",
    searchable: ["name", "description"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin"],
    writeRoles: ["super_admin"],
    deleteRoles: ["super_admin"],
    listColumns: ["name", "description", "updated_at"],
    fields: [
      { name: "name", label: "角色名", type: "text", required: true },
      { name: "description", label: "说明", type: "textarea" },
      { name: "permissions_json", label: "权限 JSON", type: "json", required: true }
    ]
  },
  products: {
    table: "products",
    label: "商品",
    labelPlural: "商品管理",
    searchable: ["id", "name", "short_name", "slug", "summary"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    listColumns: ["id", "name", "status", "slug", "updated_at"],
    fields: [
      { name: "name", label: "商品名称", type: "text", required: true },
      { name: "short_name", label: "卡片短名称", type: "text" },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "subtitle", label: "副标题", type: "text" },
      { name: "primary_category_id", label: "一级分类 ID", type: "text" },
      { name: "subcategory_id", label: "二级分类 ID", type: "text" },
      { name: "series_id", label: "产品系列 ID", type: "text" },
      { name: "status", label: "状态", type: "select", options: productStatusOptions },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "summary", label: "一句话说明", type: "textarea" },
      { name: "body_html", label: "完整介绍 HTML", type: "textarea" },
      { name: "highlights_json", label: "产品亮点 JSON", type: "json" },
      { name: "concerns_json", label: "用户关注 JSON", type: "json" },
      { name: "material_notes", label: "材质说明", type: "textarea" },
      { name: "specifications_json", label: "规格 JSON", type: "json" },
      { name: "package_list", label: "包装清单", type: "textarea" },
      { name: "care_notes", label: "清洁说明", type: "textarea" },
      { name: "storage_notes", label: "收纳说明", type: "textarea" },
      { name: "privacy_notes", label: "隐私说明", type: "textarea" },
      { name: "usage_tips", label: "使用建议", type: "textarea" },
      { name: "compliance_notes", label: "合规说明", type: "textarea" },
      { name: "tmall_url", label: "天猫商品链接", type: "text" },
      { name: "jd_url", label: "京东商品链接", type: "text" },
      { name: "tmall_enabled", label: "启用天猫", type: "boolean" },
      { name: "jd_enabled", label: "启用京东", type: "boolean" },
      { name: "links_verified", label: "链接已验证", type: "boolean" },
      { name: "buy_button_enabled", label: "购买按钮开关", type: "boolean" },
      { name: "featured", label: "首页推荐", type: "boolean" },
      { name: "visible_home", label: "首页可见", type: "boolean" },
      { name: "visible_catalog", label: "产品中心可见", type: "boolean" },
      { name: "cover_media_id", label: "主图素材 ID", type: "text" },
      { name: "hero_media_id", label: "首屏素材 ID", type: "text" },
      { name: "og_media_id", label: "OG 素材 ID", type: "text" },
      { name: "gallery_json", label: "商品图集 JSON", type: "json" },
      { name: "image_alt", label: "图片 alt", type: "text" },
      { name: "seo_title", label: "SEO 标题", type: "text" },
      { name: "seo_description", label: "SEO 描述", type: "textarea" },
      { name: "canonical_url", label: "Canonical", type: "text" },
      { name: "indexable", label: "允许索引", type: "boolean" },
      { name: "scheduled_at", label: "定时发布时间", type: "datetime" }
    ]
  },
  categories: {
    table: "categories",
    label: "商品分类",
    labelPlural: "商品分类",
    searchable: ["name", "slug"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "level", "slug", "updated_at"],
    fields: [
      { name: "name", label: "分类名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "parent_id", label: "父级分类 ID", type: "text" },
      { name: "level", label: "层级", type: "select", options: [{ label: "一级", value: "primary" }, { label: "二级", value: "secondary" }] },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_active", label: "启用", type: "boolean" },
      { name: "seo_title", label: "SEO 标题", type: "text" },
      { name: "seo_description", label: "SEO 描述", type: "textarea" }
    ]
  },
  product_series: {
    table: "product_series",
    label: "产品系列",
    labelPlural: "产品系列",
    searchable: ["name", "slug", "description"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "slug", "is_active", "updated_at"],
    fields: [
      { name: "name", label: "系列名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "description", label: "系列介绍", type: "textarea" },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_active", label: "启用", type: "boolean" },
      { name: "seo_title", label: "SEO 标题", type: "text" },
      { name: "seo_description", label: "SEO 描述", type: "textarea" }
    ]
  },
  product_tags: {
    table: "product_tags",
    label: "商品标签",
    labelPlural: "商品标签",
    searchable: ["name", "slug"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "slug", "updated_at"],
    fields: [
      { name: "name", label: "标签名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true }
    ]
  },
  articles: {
    table: "articles",
    label: "文章",
    labelPlural: "文章管理",
    searchable: ["title", "subtitle", "slug", "excerpt", "author"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    listColumns: ["title", "status", "slug", "updated_at"],
    fields: [
      { name: "title", label: "标题", type: "text", required: true },
      { name: "subtitle", label: "副标题", type: "text" },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "excerpt", label: "摘要", type: "textarea" },
      { name: "cover_media_id", label: "封面素材 ID", type: "text" },
      { name: "author", label: "作者", type: "text" },
      { name: "category_id", label: "文章分类 ID", type: "text" },
      { name: "status", label: "状态", type: "select", options: articleStatusOptions },
      { name: "featured", label: "推荐", type: "boolean" },
      { name: "pinned", label: "置顶", type: "boolean" },
      { name: "body_html", label: "富文本 HTML", type: "textarea" },
      { name: "markdown_source", label: "Markdown 源码", type: "textarea" },
      { name: "content_blocks_json", label: "内容块 JSON", type: "json" },
      { name: "seo_title", label: "SEO 标题", type: "text" },
      { name: "seo_description", label: "SEO 描述", type: "textarea" },
      { name: "canonical_url", label: "Canonical URL", type: "text" },
      { name: "og_media_id", label: "OG 素材 ID", type: "text" },
      { name: "keywords_json", label: "关键词 JSON", type: "json" },
      { name: "indexable", label: "允许索引", type: "boolean" },
      { name: "scheduled_at", label: "定时发布时间", type: "datetime" }
    ]
  },
  article_categories: {
    table: "article_categories",
    label: "文章分类",
    labelPlural: "文章分类",
    searchable: ["name", "slug"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "slug", "is_active", "updated_at"],
    fields: [
      { name: "name", label: "分类名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_active", label: "启用", type: "boolean" }
    ]
  },
  article_tags: {
    table: "article_tags",
    label: "文章标签",
    labelPlural: "文章标签",
    searchable: ["name", "slug"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "slug", "updated_at"],
    fields: [
      { name: "name", label: "标签名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true }
    ]
  },
  pages: {
    table: "pages",
    label: "页面",
    labelPlural: "页面管理",
    searchable: ["title", "subtitle", "slug", "page_key"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    listColumns: ["title", "status", "page_key", "updated_at"],
    fields: [
      { name: "page_key", label: "页面标识", type: "text", required: true },
      { name: "title", label: "页面标题", type: "text", required: true },
      { name: "subtitle", label: "页面副标题", type: "text" },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "status", label: "状态", type: "select", options: articleStatusOptions },
      { name: "modules_json", label: "模块 JSON", type: "json" },
      { name: "body_html", label: "页面正文 HTML", type: "textarea" },
      { name: "seo_title", label: "SEO 标题", type: "text" },
      { name: "seo_description", label: "SEO 描述", type: "textarea" },
      { name: "indexable", label: "允许索引", type: "boolean" },
      { name: "scheduled_at", label: "定时发布时间", type: "datetime" }
    ]
  },
  homepage_sections: {
    table: "homepage_sections",
    label: "首页模块",
    labelPlural: "首页装修",
    searchable: ["title", "description", "section_key"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    listColumns: ["title", "section_type", "is_enabled", "updated_at"],
    fields: [
      { name: "section_key", label: "模块标识", type: "text", required: true },
      { name: "title", label: "标题", type: "text", required: true },
      { name: "description", label: "说明", type: "textarea" },
      { name: "section_type", label: "模块类型", type: "text", required: true },
      { name: "config_json", label: "配置 JSON", type: "json" },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_enabled", label: "启用", type: "boolean" },
      { name: "scheduled_at", label: "定时发布时间", type: "datetime" }
    ]
  },
  faqs: {
    table: "faqs",
    label: "FAQ",
    labelPlural: "FAQ 管理",
    searchable: ["question", "answer"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    listColumns: ["question", "is_public", "show_on_home", "updated_at"],
    fields: [
      { name: "question", label: "问题", type: "text", required: true },
      { name: "answer", label: "答案", type: "textarea", required: true },
      { name: "category_id", label: "FAQ 分类 ID", type: "text" },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_public", label: "公开", type: "boolean" },
      { name: "show_on_home", label: "首页展示", type: "boolean" }
    ]
  },
  faq_categories: {
    table: "faq_categories",
    label: "FAQ 分类",
    labelPlural: "FAQ 分类",
    searchable: ["name", "slug"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["name", "slug", "is_active", "updated_at"],
    fields: [
      { name: "name", label: "分类名称", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_active", label: "启用", type: "boolean" }
    ]
  },
  media_assets: {
    table: "media_assets",
    label: "媒体素材",
    labelPlural: "媒体素材库",
    searchable: ["file_name", "alt", "title", "description", "r2_key"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["file_name", "asset_group", "mime_type", "created_at"],
    fields: [
      { name: "file_name", label: "文件名", type: "text", required: true },
      { name: "r2_key", label: "R2 Key", type: "text", required: true },
      { name: "public_url", label: "公开 URL", type: "text" },
      { name: "file_type", label: "文件类型", type: "text", required: true },
      { name: "mime_type", label: "MIME", type: "text", required: true },
      { name: "file_size", label: "大小", type: "number" },
      { name: "alt", label: "alt", type: "text" },
      { name: "title", label: "标题", type: "text" },
      { name: "description", label: "描述", type: "textarea" },
      { name: "asset_group", label: "分组", type: "text" }
    ]
  },
  navigation_items: {
    table: "navigation_items",
    label: "导航",
    labelPlural: "导航管理",
    searchable: ["label", "href"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["label", "href", "is_visible", "updated_at"],
    fields: [
      { name: "label", label: "导航名称", type: "text", required: true },
      { name: "href", label: "链接", type: "text", required: true },
      { name: "page_type", label: "页面类型", type: "text" },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "open_in_new_tab", label: "新窗口打开", type: "boolean" },
      { name: "is_visible", label: "显示", type: "boolean" },
      { name: "show_desktop", label: "桌面端显示", type: "boolean" },
      { name: "show_mobile", label: "移动端显示", type: "boolean" }
    ]
  },
  footer_groups: {
    table: "footer_groups",
    label: "页脚分组",
    labelPlural: "页脚分组",
    searchable: ["title"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["title", "is_visible", "updated_at"],
    fields: [
      { name: "title", label: "分组标题", type: "text", required: true },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_visible", label: "显示", type: "boolean" }
    ]
  },
  footer_items: {
    table: "footer_items",
    label: "页脚链接",
    labelPlural: "页脚链接",
    searchable: ["label", "href", "content"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["label", "href", "is_visible", "updated_at"],
    fields: [
      { name: "group_id", label: "分组 ID", type: "text" },
      { name: "label", label: "名称", type: "text", required: true },
      { name: "href", label: "链接", type: "text" },
      { name: "content", label: "自定义文本", type: "textarea" },
      { name: "sort_order", label: "排序", type: "number" },
      { name: "is_visible", label: "显示", type: "boolean" }
    ]
  },
  redirects: {
    table: "redirects",
    label: "重定向",
    labelPlural: "重定向管理",
    searchable: ["source_path", "destination_url"],
    mutableRoles: ["super_admin", "editor"],
    listColumns: ["source_path", "destination_url", "status_code", "is_active"],
    fields: [
      { name: "source_path", label: "来源路径", type: "text", required: true },
      { name: "destination_url", label: "目标 URL", type: "text", required: true },
      { name: "status_code", label: "状态码", type: "select", options: [{ label: "301", value: "301" }, { label: "302", value: "302" }] },
      { name: "is_active", label: "启用", type: "boolean" }
    ]
  },
  site_settings: {
    table: "site_settings",
    primaryKey: "key",
    label: "站点设置",
    labelPlural: "站点设置",
    searchable: ["key", "setting_group"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin"],
    deleteRoles: ["super_admin"],
    listColumns: ["key", "setting_group", "updated_at"],
    fields: [
      { name: "key", label: "Key", type: "text", required: true },
      { name: "value_json", label: "值 JSON", type: "json", required: true },
      { name: "setting_group", label: "分组", type: "text" },
      { name: "is_sensitive", label: "高风险", type: "boolean" }
    ]
  },
  audit_logs: {
    table: "audit_logs",
    label: "操作日志",
    labelPlural: "操作日志",
    searchable: ["actor_email", "action", "entity_type", "summary"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin"],
    writeRoles: ["super_admin"],
    deleteRoles: [],
    listColumns: ["actor_email", "action", "entity_type", "created_at"],
    fields: []
  },
  publish_jobs: {
    table: "publish_jobs",
    label: "发布任务",
    labelPlural: "定时发布",
    searchable: ["entity_type", "entity_id", "status"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin", "reviewer"],
    writeRoles: [],
    deleteRoles: [],
    listColumns: ["entity_type", "entity_id", "status", "run_at"],
    fields: []
  },
  import_jobs: {
    table: "import_jobs",
    label: "导入任务",
    labelPlural: "导入任务",
    searchable: ["source_url", "source_product_id", "title_detected", "source_shop_name", "status"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin", "editor"],
    deleteRoles: ["super_admin"],
    listColumns: ["source_platform", "title_detected", "status", "authorized", "updated_at"],
    fields: [
      { name: "source_platform", label: "平台", type: "select", options: [{ label: "天猫/淘宝", value: "tmall" }, { label: "京东", value: "jd" }, { label: "未知", value: "unknown" }] },
      { name: "source_url", label: "商品链接", type: "text", required: true },
      { name: "source_product_id", label: "平台商品 ID", type: "text" },
      { name: "source_shop_name", label: "店铺名称", type: "text" },
      { name: "title_detected", label: "识别标题", type: "text" },
      { name: "status", label: "状态", type: "select", options: [
        { label: "草稿", value: "draft" },
        { label: "待读取", value: "pending_fetch" },
        { label: "已读取", value: "fetched" },
        { label: "待人工审核", value: "needs_review" },
        { label: "已导入", value: "imported" },
        { label: "失败", value: "failed" },
        { label: "已取消", value: "cancelled" }
      ] },
      { name: "authorized", label: "已确认授权", type: "boolean" },
      { name: "error_message", label: "错误信息", type: "textarea" },
      { name: "raw_metadata_json", label: "公开 metadata JSON", type: "json" },
      { name: "notes", label: "备注", type: "textarea" }
    ]
  },
  imported_product_sources: {
    table: "imported_product_sources",
    label: "商品来源绑定",
    labelPlural: "商品来源绑定",
    searchable: ["product_id", "source_url", "source_product_id", "source_title", "source_shop_name"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin", "editor"],
    deleteRoles: ["super_admin"],
    listColumns: ["platform", "source_title", "product_id", "updated_at"],
    fields: [
      { name: "product_id", label: "商品 ID", type: "text" },
      { name: "import_job_id", label: "导入任务 ID", type: "text" },
      { name: "platform", label: "平台", type: "select", options: [{ label: "天猫/淘宝", value: "tmall" }, { label: "京东", value: "jd" }] },
      { name: "source_url", label: "来源链接", type: "text", required: true },
      { name: "source_product_id", label: "平台商品 ID", type: "text" },
      { name: "source_title", label: "来源标题", type: "text" },
      { name: "source_shop_name", label: "来源店铺", type: "text" },
      { name: "tmall_url", label: "天猫链接", type: "text" },
      { name: "jd_url", label: "京东链接", type: "text" },
      { name: "last_checked_at", label: "最近检查时间", type: "datetime" }
    ]
  },
  imported_media_sources: {
    table: "imported_media_sources",
    label: "素材来源记录",
    labelPlural: "素材来源记录",
    searchable: ["media_id", "source_url", "source_page_url", "license_note"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin", "editor"],
    deleteRoles: ["super_admin"],
    listColumns: ["source_platform", "media_id", "authorized", "created_at"],
    fields: [
      { name: "media_id", label: "素材 ID", type: "text" },
      { name: "import_job_id", label: "导入任务 ID", type: "text" },
      { name: "source_url", label: "图片来源 URL", type: "text", required: true },
      { name: "source_platform", label: "来源平台", type: "select", options: [{ label: "天猫/淘宝", value: "tmall" }, { label: "京东", value: "jd" }, { label: "手动上传", value: "manual" }, { label: "未知", value: "unknown" }] },
      { name: "source_page_url", label: "来源页面 URL", type: "text" },
      { name: "authorized", label: "已确认授权", type: "boolean" },
      { name: "license_note", label: "授权说明", type: "textarea" },
      { name: "checksum", label: "Checksum", type: "text" }
    ]
  },
  seo_generation_jobs: {
    table: "seo_generation_jobs",
    label: "SEO/AI 生成任务",
    labelPlural: "SEO/AI 生成任务",
    searchable: ["target_type", "target_id", "generation_type", "status", "review_notes"],
    mutableRoles: ["super_admin", "editor", "reviewer"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin", "editor", "reviewer"],
    deleteRoles: ["super_admin"],
    listColumns: ["target_type", "generation_type", "status", "updated_at"],
    fields: [
      { name: "target_type", label: "目标类型", type: "select", options: [{ label: "商品", value: "product" }, { label: "文章", value: "article" }, { label: "FAQ", value: "faq" }, { label: "页面", value: "page" }] },
      { name: "target_id", label: "目标 ID", type: "text" },
      { name: "generation_type", label: "生成类型", type: "select", options: [
        { label: "商品详情", value: "product_description" },
        { label: "文章", value: "article" },
        { label: "SEO 标题", value: "seo_title" },
        { label: "SEO 描述", value: "seo_description" },
        { label: "FAQ", value: "faq" },
        { label: "结构化数据", value: "structured_data" },
        { label: "社媒摘要", value: "social_excerpt" }
      ] },
      { name: "prompt_version", label: "Prompt 版本", type: "text" },
      { name: "status", label: "状态", type: "select", options: [
        { label: "草稿", value: "draft" },
        { label: "待审核", value: "pending_review" },
        { label: "已通过", value: "approved" },
        { label: "已拒绝", value: "rejected" },
        { label: "已发布", value: "published" },
        { label: "失败", value: "failed" },
        { label: "已取消", value: "cancelled" }
      ] },
      { name: "input_snapshot_json", label: "输入快照 JSON", type: "json" },
      { name: "output_snapshot_json", label: "输出快照 JSON", type: "json" },
      { name: "review_notes", label: "审核备注", type: "textarea" }
    ]
  },
  seo_push_logs: {
    table: "seo_push_logs",
    label: "搜索引擎推送日志",
    labelPlural: "搜索引擎推送日志",
    searchable: ["url", "event_type", "provider", "status", "last_error"],
    mutableRoles: ["super_admin"],
    readRoles: ["super_admin", "editor", "reviewer", "viewer"],
    writeRoles: ["super_admin"],
    deleteRoles: [],
    listColumns: ["provider", "event_type", "status", "url", "created_at"],
    fields: [
      { name: "url", label: "URL", type: "text", required: true },
      { name: "event_type", label: "事件", type: "select", options: [{ label: "发布", value: "publish" }, { label: "更新", value: "update" }, { label: "下线", value: "offline" }, { label: "手动", value: "manual" }] },
      { name: "provider", label: "渠道", type: "select", options: [{ label: "IndexNow", value: "indexnow" }, { label: "Google 手动清单", value: "google_manual_list" }, { label: "百度手动清单", value: "baidu_manual_list" }, { label: "Bing 手动清单", value: "bing_manual_list" }] },
      { name: "status", label: "状态", type: "select", options: [{ label: "排队", value: "queued" }, { label: "跳过", value: "skipped" }, { label: "已发送", value: "sent" }, { label: "失败", value: "failed" }] },
      { name: "http_status", label: "HTTP 状态", type: "number" },
      { name: "response_text", label: "响应", type: "textarea" },
      { name: "retry_count", label: "重试次数", type: "number" },
      { name: "last_error", label: "最近错误", type: "textarea" }
    ]
  }
} satisfies Record<string, CmsResourceConfig>;

export function getResourceConfig(resource: string): CmsResourceConfig | undefined {
  return cmsResources[resource as keyof typeof cmsResources] as CmsResourceConfig | undefined;
}

export function readRolesForResource(config: CmsResourceConfig): CmsRole[] {
  return config.readRoles || ["super_admin", "editor", "reviewer", "viewer"];
}

export function writeRolesForResource(config: CmsResourceConfig): CmsRole[] {
  return config.writeRoles || config.mutableRoles;
}

export function deleteRolesForResource(config: CmsResourceConfig): CmsRole[] {
  return config.deleteRoles || ["super_admin"];
}

export const adminNavigation = [
  { group: "仪表盘", items: [{ label: "仪表盘", resource: "dashboard" }] },
  { group: "商品管理", items: [
    { label: "全部商品", resource: "products" },
    { label: "商品分类", resource: "categories" },
    { label: "产品系列", resource: "product_series" },
    { label: "商品标签", resource: "product_tags" }
  ] },
  { group: "内容管理", items: [
    { label: "全部文章", resource: "articles" },
    { label: "文章分类", resource: "article_categories" },
    { label: "文章标签", resource: "article_tags" },
    { label: "页面管理", resource: "pages" },
    { label: "FAQ 管理", resource: "faqs" }
  ] },
  { group: "媒体中心", items: [{ label: "全部素材", resource: "media_assets" }] },
  { group: "网站运营", items: [
    { label: "首页装修", resource: "homepage_sections" },
    { label: "导航管理", resource: "navigation_items" },
    { label: "SEO 与站点设置", resource: "site_settings" },
    { label: "重定向管理", resource: "redirects" }
  ] },
  { group: "系统", items: [
    { label: "管理员管理", resource: "admin_users" },
    { label: "角色管理", resource: "admin_roles" },
    { label: "操作日志", resource: "audit_logs" },
    { label: "导入导出与备份", resource: "backup" }
  ] }
];
