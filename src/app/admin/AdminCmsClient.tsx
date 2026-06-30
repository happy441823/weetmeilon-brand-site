"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "json" | "select" | "datetime";
  required?: boolean;
  options?: { label: string; value: string }[];
};

type ResourceConfig = {
  primaryKey?: string;
  label: string;
  labelPlural: string;
  fields: Field[];
  listColumns: string[];
};

type SchemaResponse = {
  resources: Record<string, ResourceConfig>;
  navigation: { group: string; items: { label: string; resource: string }[] }[];
};

type DashboardResponse = {
  dbReady: boolean;
  cards: { label: string; value: number }[];
  pending: { label: string; value: number }[];
  recent: Record<string, unknown>[];
};

type AdminRoleState = {
  roles: string[];
  assignableRoles: string[];
  user?: Record<string, unknown>;
};

type ProductLookupOption = {
  id: string;
  name: string;
  level?: string;
  parent_id?: string;
  is_active?: boolean | number;
};

const preferredResources = [
  "products",
  "articles",
  "pages",
  "homepage_sections",
  "faqs",
  "media_assets",
  "navigation_items",
  "redirects",
  "site_settings",
  "publish_jobs",
  "audit_logs"
];

const adminBuildLabel = "CMS Production v2026.06.20";

export const workflowManagedClientFields = new Set([
  "status",
  "published_at",
  "scheduled_at",
  "published_by",
  "reviewed_by",
  "first_published_at",
  "last_published_by"
]);

export const workflowClientResources = new Set(["products", "articles", "pages"]);

export function resourcePrimaryKey(config?: Pick<ResourceConfig, "primaryKey"> | null) {
  return config?.primaryKey || "id";
}

export function resourceItemKey(row: Record<string, unknown>, config?: Pick<ResourceConfig, "primaryKey"> | null) {
  const key = resourcePrimaryKey(config);
  return String(row[key] ?? row.id ?? "");
}

export function buildAdminSavePayload(resource: string, form: Record<string, unknown>) {
  if (!workflowClientResources.has(resource)) {
    return { ...form };
  }
  return Object.fromEntries(Object.entries(form).filter(([key]) => !workflowManagedClientFields.has(key)));
}

export function pickDirtyAdminFields(form: Record<string, unknown>, dirtyFields: Iterable<string>) {
  return Object.fromEntries(Array.from(dirtyFields).filter((key) => Object.hasOwn(form, key)).map((key) => [key, form[key]]));
}

function parseJsonValue(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

export function normalizeStringArrayJson(value: unknown) {
  try {
    const parsed = parseJsonValue(value);
    if (parsed == null) return [];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => String(item ?? ""));
  } catch {
    return null;
  }
}

export function normalizeSpecRowsJson(value: unknown) {
  try {
    const parsed = parseJsonValue(value);
    if (parsed == null) return [];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const row = item as Record<string, unknown>;
        return {
          label: String(row.label ?? ""),
          value: String(row.value ?? "")
        };
      }
      return { label: "", value: String(item ?? "") };
    });
  } catch {
    return null;
  }
}

export function stringifyAdminJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export const productStructuredJsonFieldLabels: Record<string, string> = {
  highlights_json: "产品亮点",
  concerns_json: "用户关注",
  gallery_json: "商品图集",
  specifications_json: "规格说明"
};

export function getAdminJsonFieldError(resource: string, name: string, value: unknown) {
  if (resource !== "products" || !(name in productStructuredJsonFieldLabels)) return "";
  const label = productStructuredJsonFieldLabels[name];
  if (name === "specifications_json") {
    return normalizeSpecRowsJson(value) == null ? `${label}格式不正确：请使用规格名和规格值，或检查 JSON 数组。` : "";
  }
  return normalizeStringArrayJson(value) == null ? `${label}格式不正确：请使用每行一条内容，或检查 JSON 数组。` : "";
}

export function getAdminJsonFormError(resource: string, form: Record<string, unknown>) {
  for (const name of Object.keys(productStructuredJsonFieldLabels)) {
    if (!Object.hasOwn(form, name)) continue;
    const error = getAdminJsonFieldError(resource, name, form[name]);
    if (error) return error;
  }
  return "";
}

export function getAdminSlugFieldError(resource: string, form: Record<string, unknown>) {
  if (resource !== "products" || !Object.hasOwn(form, "slug")) return "";
  const slug = String(form.slug || "").trim();
  if (!slug) return "Slug cannot be empty. Use lowercase letters, numbers, and hyphens.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug format is invalid. Use lowercase letters, numbers, and hyphens, for example automatic-cup-974064324737.";
  }
  return "";
}

const adminPathResources = [
  { path: "/admin/products", resource: "products" },
  { path: "/admin/articles", resource: "articles" },
  { path: "/admin/pages", resource: "pages" },
  { path: "/admin/homepage", resource: "homepage_sections" },
  { path: "/admin/faqs", resource: "faqs" },
  { path: "/admin/navigation", resource: "navigation_items" },
  { path: "/admin/footer", resource: "footer_items" },
  { path: "/admin/imports", resource: "import_jobs" },
  { path: "/admin/seo/indexing", resource: "seo_push_logs" }
];

const adminResourcePaths = new Map(adminPathResources.map((item) => [item.resource, item.path]));

export function resourceFromAdminPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/admin";
  return adminPathResources.find((item) => normalized === item.path || normalized.startsWith(`${item.path}/`))?.resource;
}

function emptyValue(field: Field) {
  if (field.type === "boolean") return false;
  if (field.type === "number") return 0;
  if (field.type === "json") return field.name.endsWith("_json") ? "[]" : "{}";
  return "";
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "未填写";
  if (typeof value === "number" && (value === 0 || value === 1)) return value === 1 ? "是" : "否";
  return String(value);
}

const thumbnailResources = new Set(["products", "media_assets"]);
const defaultAdminPageSize = 20;

function resourceHasThumbnail(resource: string) {
  return thumbnailResources.has(resource);
}

function rowThumbnailUrl(resource: string, row?: Record<string, unknown> | null) {
  if (!row) return "";
  if (resource === "products") return String(row._thumbnail_url || "");
  if (resource === "media_assets") return String(row.public_url || "");
  return "";
}

function rowThumbnailAlt(row?: Record<string, unknown> | null) {
  if (!row) return "";
  return String(row._thumbnail_alt || row.alt || row.title || row.name || row.file_name || "CMS image");
}

function isImageRow(row?: Record<string, unknown> | null) {
  if (!row) return false;
  const mime = String(row.mime_type || "");
  const url = String(row.public_url || row._thumbnail_url || "");
  return mime.startsWith("image/") || /\.(avif|gif|jpe?g|png|webp|svg)(\?|#|$)/i.test(url);
}

export function getAdminPagination(totalRows: number, page: number, pageSize = defaultAdminPageSize) {
  const normalizedPageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(totalRows / normalizedPageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * normalizedPageSize;
  const endIndex = totalRows === 0 ? 0 : Math.min(startIndex + normalizedPageSize, totalRows);

  return {
    currentPage,
    pageCount,
    startIndex,
    endIndex,
    pageSize: normalizedPageSize
  };
}

function AdminThumbnail({ url, alt, size = "sm", muted = false }: { url: string; alt: string; size?: "sm" | "lg"; muted?: boolean }) {
  const boxClass = size === "lg" ? "h-40 w-full" : "h-16 w-16";
  if (!url) {
    return (
      <div className={`${boxClass} grid place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-black uppercase tracking-[0.14em] text-white/34`}>
        No image
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`${boxClass} group block overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]`}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover transition group-hover:scale-105 ${muted ? "opacity-60" : ""}`}
      />
    </a>
  );
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export function AdminCmsClient({ initialResource = "dashboard", initialItemId = "" }: { initialResource?: string; initialItemId?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathResource = resourceFromAdminPath(pathname || "");
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [resource, setResource] = useState(pathResource || initialResource);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultAdminPageSize);
  const [message, setMessage] = useState("");
  const [adminRoleState, setAdminRoleState] = useState<AdminRoleState | null>(null);
  const [isPending, startTransition] = useTransition();

  const config = resource !== "dashboard" && resource !== "backup" ? schema?.resources[resource] : null;
  const pagination = useMemo(() => getAdminPagination(totalRows, page, pageSize), [page, pageSize, totalRows]);
  const visibleRows = rows;

  useEffect(() => {
    const nextResource = resourceFromAdminPath(pathname || "");
    if (nextResource) {
      setResource(nextResource);
    }
  }, [pathname]);

  useEffect(() => {
    async function loadSchema() {
      const [schemaResponse, dashboardResponse] = await Promise.all([
        fetch("/api/admin/schema", { cache: "no-store" }),
        fetch("/api/admin/dashboard", { cache: "no-store" })
      ]);
      if (!schemaResponse.ok) {
        setMessage("无法读取后台配置。请确认 Cloudflare Access 和 CMS_DB。");
        return;
      }
      setSchema(await schemaResponse.json());
      setDashboard(await dashboardResponse.json());
    }
    void loadSchema();
  }, []);

  useEffect(() => {
    if (!schema || resource === "dashboard" || resource === "backup") return;
    void loadRows(resource);
    setSelected(null);
    setPage(1);
    setDirtyFields(new Set());
    const nextConfig = schema.resources[resource];
    setForm(Object.fromEntries((nextConfig?.fields || []).map((field) => [field.name, emptyValue(field)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, resource]);

  useEffect(() => {
    if (page !== pagination.currentPage) {
      setPage(pagination.currentPage);
    }
  }, [page, pagination.currentPage]);

  useEffect(() => {
    if (!schema || resource === "dashboard" || resource === "backup") return;
    void loadRows(resource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    if (!schema || !initialItemId || resource === "dashboard" || resource === "backup") return;
    const activeConfig = schema.resources[resource];
    if (!activeConfig) return;
    async function loadInitialItem() {
      const response = await fetch(`/api/admin/resource/${resource}/${encodeURIComponent(initialItemId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "无法读取指定内容。");
        return;
      }
      editRow(data.item);
    }
    void loadInitialItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, initialItemId, resource]);

  async function loadRows(target = resource) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const response = await fetch(`/api/admin/resource/${target}?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "读取失败。");
      setRows([]);
      setTotalRows(0);
      return;
    }
    setRows(data.rows || []);
    setTotalRows(Number(data.total || 0));
    if (data.dbReady === false) {
      setMessage("当前环境尚未绑定 CMS_DB，页面可预览但不能读取真实 D1 数据。");
    }
  }

  function resetForm() {
    if (!config) return;
    setSelected(null);
    setAdminRoleState(null);
    setDirtyFields(new Set());
    setForm(Object.fromEntries(config.fields.map((field) => [field.name, emptyValue(field)])));
  }

  function editRow(row: Record<string, unknown>) {
    setSelected(row);
    if (!config) return;
    setDirtyFields(new Set());
    setForm(Object.fromEntries(config.fields.map((field) => [field.name, row[field.name] ?? emptyValue(field)])));
    if (resource === "admin_users") {
      void loadAdminRoles(row, config);
    } else {
      setAdminRoleState(null);
    }
  }

  function setField(name: string, value: unknown) {
    setForm((current) => ({ ...current, [name]: value }));
    setDirtyFields((current) => new Set(current).add(name));
  }

  function selectResource(nextResource: string) {
    setResource(nextResource);
    const nextPath = adminResourcePaths.get(nextResource);
    if (nextPath && nextPath !== (pathname || "").replace(/\/+$/, "")) {
      router.push(nextPath);
    }
  }

  async function save() {
    if (!config || resource === "dashboard" || resource === "backup") return;
    setMessage("");
    startTransition(async () => {
      try {
        const id = selected ? resourceItemKey(selected, config) : "";
        const url = selected ? `/api/admin/resource/${resource}/${encodeURIComponent(id)}` : `/api/admin/resource/${resource}`;
        const payloadSource = selected ? pickDirtyAdminFields(form, dirtyFields) : form;
        if (selected && Object.keys(payloadSource).length === 0) {
          setMessage("没有需要保存的修改。");
          return;
        }
        const slugError = getAdminSlugFieldError(resource, payloadSource);
        if (slugError) {
          setMessage(slugError);
          return;
        }
        const jsonError = getAdminJsonFormError(resource, payloadSource);
        if (jsonError) {
          setMessage(jsonError);
          return;
        }
        const response = await fetch(url, {
          method: selected ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(buildAdminSavePayload(resource, payloadSource))
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "保存失败。");
        setMessage(selected ? "已保存修改。" : "已新增内容。");
        await loadRows();
        editRow(data.item);
      } catch (error) {
        setMessage(readError(error));
      }
    });
  }

  async function workflow(action: "submit_review" | "return_to_draft" | "schedule" | "cancel_schedule" | "set_coming_soon" | "publish" | "offline" | "archive") {
    if (!selected || !config) return;
    setMessage("");
    startTransition(async () => {
      try {
        const id = resourceItemKey(selected, config);
        const body: Record<string, unknown> = { _action: action };
        if (action === "schedule") {
          const scheduledAt = window.prompt("请输入定时发布时间 ISO，例如 2026-06-18T10:00:00.000Z");
          if (!scheduledAt) return;
          body.scheduled_at = scheduledAt;
        }
        const response = await fetch(`/api/admin/resource/${resource}/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "状态操作失败。");
        setMessage(action === "publish" ? "已发布。" : action === "offline" ? "已下线。" : "已提交审核。");
        await loadRows();
        editRow(data.item);
      } catch (error) {
        setMessage(readError(error));
      }
    });
  }

  async function remove() {
    if (!selected || !config) return;
    const name = String(selected.name || selected.title || selected.question || selected.id);
    const confirmed = window.prompt(`删除不可撤销。请输入内容名称确认：${name}`) === name;
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const id = resourceItemKey(selected, config);
        const response = await fetch(`/api/admin/resource/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "删除失败。");
        setMessage("已删除。");
        resetForm();
        await loadRows();
      } catch (error) {
        setMessage(readError(error));
      }
    });
  }

  async function loadAdminRoles(row = selected, activeConfig = config) {
    if (!row || !activeConfig) return;
    const id = resourceItemKey(row, activeConfig);
    const response = await fetch(`/api/admin/admin-users/${encodeURIComponent(id)}/roles`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "读取管理员角色失败。");
      return;
    }
    setAdminRoleState(data);
  }

  async function mutateAdminRole(role: string, method: "POST" | "DELETE") {
    if (!selected || !config) return;
    const id = resourceItemKey(selected, config);
    const url =
      method === "POST"
        ? `/api/admin/admin-users/${encodeURIComponent(id)}/roles`
        : `/api/admin/admin-users/${encodeURIComponent(id)}/roles?role=${encodeURIComponent(role)}`;
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "POST" ? JSON.stringify({ role }) : undefined
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "管理员角色操作失败。");
      return;
    }
    setAdminRoleState(data);
    await loadRows();
  }

  async function setAdminActive(isActive: boolean) {
    if (!selected || !config) return;
    const id = resourceItemKey(selected, config);
    const response = await fetch(`/api/admin/admin-users/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: isActive })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "管理员状态操作失败。");
      return;
    }
    setAdminRoleState(data);
    await loadRows();
  }

  const statusOptions = useMemo(() => config?.fields.find((field) => field.name === "status")?.options || [], [config]);

  return (
    <main data-admin-shell className="min-h-screen bg-[#09000f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[#12031d] px-5 py-6">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">SWEETMEILON</p>
            <h1 className="mt-2 text-2xl font-black">品牌官网 CMS</h1>
            <p className="mt-3 text-sm leading-6 text-white/56">Production 后台已连接正式 CMS 资源，受 Cloudflare Access 保护。</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-mint-300/80">{adminBuildLabel}</p>
          </div>
          <nav className="grid gap-6">
            {(schema?.navigation || []).map((group) => (
              <section key={group.group}>
                <p className="mb-2 text-xs font-bold text-white/38">{group.group}</p>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.resource}
                      type="button"
                      onClick={() => selectResource(item.resource)}
                      className={`rounded-lg px-3 py-2 text-left text-sm font-bold transition ${
                        resource === item.resource ? "bg-mint-300 text-[#12031d]" : "text-white/70 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-5 py-6 md:px-8">
          <header className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold text-mint-300">Cloudflare Access 保护路径：/admin/* 与 /api/admin/*</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/36">{adminBuildLabel}</p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">{resource === "dashboard" ? "仪表盘" : resource === "backup" ? "导入导出与备份" : config?.labelPlural}</h2>
            </div>
            <a href="/" target="_blank" className="rounded-full border border-white/14 px-4 py-2 text-sm font-black text-white/76 hover:bg-white/8">
              预览官网
            </a>
          </header>

          {message ? (
            <div className="mb-5 rounded-xl border border-mint-300/30 bg-mint-300/10 px-4 py-3 text-sm font-bold text-mint-200">
              {message}
            </div>
          ) : null}

          {resource === "dashboard" ? <DashboardView dashboard={dashboard} /> : null}
          {resource === "backup" ? <BackupRestoreView /> : null}

          {config ? (
            <>
            {resource === "media_assets" ? <MediaUploadPanel onUploaded={() => void loadRows("media_assets")} /> : null}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder={`搜索${config.labelPlural}`}
                    className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none"
                  />
                  {statusOptions.length ? (
                    <select
                      value={status}
                      onChange={(event) => {
                        setStatus(event.target.value);
                        setPage(1);
                      }}
                      className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none"
                    >
                      <option value="">全部状态</option>
                      {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : null}
                  <button type="button" onClick={() => void loadRows()} className="h-11 rounded-lg bg-white/10 px-4 text-sm font-black hover:bg-white/14">刷新</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="text-white/48">
                        {resourceHasThumbnail(resource) ? <th className="border-b border-white/10 px-3 py-3 font-black">图片</th> : null}
                        {config.listColumns.map((column) => <th key={column} className="border-b border-white/10 px-3 py-3 font-black">{column}</th>)}
                        <th className="border-b border-white/10 px-3 py-3 font-black">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => (
                        <tr key={resourceItemKey(row, config)} className="text-white/78">
                          {resourceHasThumbnail(resource) ? (
                            <td className="border-b border-white/8 px-3 py-3 align-middle">
                              {isImageRow(row) || resource === "products" ? (
                                <AdminThumbnail url={rowThumbnailUrl(resource, row)} alt={rowThumbnailAlt(row)} />
                              ) : (
                                <div className="grid h-16 w-16 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-black uppercase text-white/34">
                                  File
                                </div>
                              )}
                            </td>
                          ) : null}
                          {config.listColumns.map((column) => <td key={column} className="border-b border-white/8 px-3 py-3">{displayValue(row[column])}</td>)}
                          <td className="border-b border-white/8 px-3 py-3">
                            <button type="button" onClick={() => editRow(row)} className="rounded-full border border-mint-300/35 px-3 py-1 text-xs font-black text-mint-300 hover:bg-mint-300/10">编辑</button>
                          </td>
                        </tr>
                      ))}
                      {visibleRows.length === 0 ? (
                        <tr><td colSpan={config.listColumns.length + (resourceHasThumbnail(resource) ? 2 : 1)} className="px-3 py-10 text-center text-white/45">暂无数据。请先执行 D1 migration 和数据迁移脚本。</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                {totalRows > 0 ? (
                  <div className="mt-4 flex flex-col gap-3 border-t border-white/8 pt-4 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
                    <div>
                      显示 {pagination.startIndex + 1}-{pagination.endIndex} 条，共 {totalRows} 条
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2">
                        <span>每页</span>
                        <select
                          value={pageSize}
                          onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                          }}
                          className="h-9 rounded-lg border border-white/12 bg-[#160722] px-2 text-sm font-bold text-white outline-none"
                        >
                          {[10, 20, 50].map((size) => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        className="h-9 rounded-lg border border-white/12 px-3 text-xs font-black text-white/78 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        上一页
                      </button>
                      <span className="min-w-20 text-center text-xs font-black text-white/58">
                        {pagination.currentPage} / {pagination.pageCount}
                      </span>
                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.pageCount}
                        onClick={() => setPage((value) => Math.min(pagination.pageCount, value + 1))}
                        className="h-9 rounded-lg border border-white/12 px-3 text-xs font-black text-white/78 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black">{selected ? "编辑内容" : `新增${config.label}`}</h3>
                  <button type="button" onClick={resetForm} className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/70 hover:bg-white/8">清空</button>
                </div>
                {resource === "products" ? (
                  <ProductEditorPanel form={form} fields={config.fields} setField={setField} thumbnailUrl={rowThumbnailUrl(resource, selected)} thumbnailAlt={rowThumbnailAlt(selected)} />
                ) : resource === "articles" ? (
                  <ArticleEditorPanel form={form} fields={config.fields} setField={setField} />
                ) : resource === "pages" || resource === "homepage_sections" ? (
                  <ModuleEditorPanel resource={resource} form={form} fields={config.fields} setField={setField} />
                ) : (
                  <div className="grid gap-3">
                    {resource === "media_assets" ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-mint-300">Image Preview</p>
                        {isImageRow(selected || form) ? (
                          <AdminThumbnail url={rowThumbnailUrl(resource, selected || form)} alt={rowThumbnailAlt(selected || form)} size="lg" />
                        ) : (
                          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-6 text-sm text-white/45">当前素材不是图片，或还没有公开 URL。</div>
                        )}
                      </div>
                    ) : null}
                    {config.fields.map((field) => (
                      <label key={field.name} className="grid gap-1.5">
                        <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
                        <FieldControl field={field} value={form[field.name]} onChange={(value) => setField(field.name, value)} />
                      </label>
                    ))}
                  </div>
                )}
                <div className="mt-5 grid gap-2">
                  <button type="button" disabled={isPending} onClick={save} className="h-11 rounded-lg bg-mint-gradient px-4 text-sm font-black text-[#12031d] disabled:opacity-60">保存</button>
                  {selected && resource === "admin_users" ? (
                    <AdminRolesPanel
                      state={adminRoleState}
                      onAssign={(role) => void mutateAdminRole(role, "POST")}
                      onRemove={(role) => void mutateAdminRole(role, "DELETE")}
                      onSetActive={(isActive) => void setAdminActive(isActive)}
                    />
                  ) : null}                  {selected && ["products", "articles", "pages"].includes(resource) ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => workflow("submit_review")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">提交审核</button>
                      <button type="button" onClick={() => workflow("return_to_draft")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">退回草稿</button>
                      <button type="button" onClick={() => workflow("schedule")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">定时发布</button>
                      <button type="button" onClick={() => workflow("cancel_schedule")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">取消定时</button>
                      {resource === "products" ? <button type="button" onClick={() => workflow("set_coming_soon")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">即将上新</button> : null}
                      <button type="button" onClick={() => workflow("publish")} className="rounded-lg border border-mint-300/35 px-2 py-2 text-xs font-bold text-mint-300">发布</button>
                      <button type="button" onClick={() => workflow("offline")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">下线</button>
                      <button type="button" onClick={() => workflow("archive")} className="rounded-lg border border-white/12 px-2 py-2 text-xs font-bold">归档</button>
                    </div>
                  ) : null}
                  {selected ? <button type="button" onClick={remove} className="rounded-lg border border-red-300/30 px-4 py-2 text-sm font-black text-red-200">删除</button> : null}
                </div>
              </aside>
            </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function FieldControl({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  const base = "rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60";
  if (field.type === "textarea" || field.type === "json") {
    return <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} rows={field.type === "json" ? 5 : 4} className={`${base} py-2 leading-6`} />;
  }
  if (field.type === "boolean") {
    return (
      <select value={value ? "1" : "0"} onChange={(event) => onChange(event.target.value === "1")} className={`${base} h-10`}>
        <option value="1">是</option>
        <option value="0">否</option>
      </select>
    );
  }
  if (field.type === "select") {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={`${base} h-10`}>
        <option value="">请选择</option>
        {(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  return <input value={String(value ?? "")} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text"} className={`${base} h-10`} />;
}

function JsonEditorShell({ field, children }: { field: Field; children: ReactNode }) {
  return (
    <label key={field.name} className="grid gap-1.5">
      <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function StringArrayJsonEditor({
  field,
  value,
  onChange,
  previewImages = false
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  previewImages?: boolean;
}) {
  const items = normalizeStringArrayJson(value);
  const base = "rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60";
  if (!items) {
    return (
      <JsonEditorShell field={field}>
        <div className="grid gap-2">
          <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">当前 JSON 不是数组格式，已切换为原始编辑。</div>
          <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} rows={5} className={`${base} py-2 leading-6`} />
        </div>
      </JsonEditorShell>
    );
  }
  const write = (nextItems: string[]) => onChange(stringifyAdminJson(nextItems));
  return (
    <JsonEditorShell field={field}>
      <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
        {items.length ? items.map((item, index) => (
          <div key={`${field.name}-${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
            <div className="flex gap-2">
              {previewImages && item ? <AdminThumbnail url={item} alt={`${field.label} ${index + 1}`} /> : null}
              <input
                value={item}
                onChange={(event) => write(items.map((current, currentIndex) => (currentIndex === index ? event.target.value : current)))}
                className={`${base} h-10 min-w-0 flex-1`}
                placeholder={previewImages ? "图片 URL" : "填写一条内容"}
              />
            </div>
            <button type="button" onClick={() => write(items.filter((_, currentIndex) => currentIndex !== index))} className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/68 hover:bg-white/8">
              删除
            </button>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-white/12 px-3 py-4 text-center text-xs font-bold text-white/42">暂无内容，点击下方添加。</div>
        )}
        <button type="button" onClick={() => write([...items, ""])} className="rounded-lg bg-mint-300 px-3 py-2 text-xs font-black text-[#12031d]">
          添加一项
        </button>
      </div>
    </JsonEditorShell>
  );
}

function SpecRowsJsonEditor({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  const rows = normalizeSpecRowsJson(value);
  const base = "rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60";
  if (!rows) {
    return (
      <JsonEditorShell field={field}>
        <div className="grid gap-2">
          <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">当前 JSON 不是规格数组，已切换为原始编辑。</div>
          <textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} rows={5} className={`${base} py-2 leading-6`} />
        </div>
      </JsonEditorShell>
    );
  }
  const write = (nextRows: { label: string; value: string }[]) => onChange(stringifyAdminJson(nextRows));
  return (
    <JsonEditorShell field={field}>
      <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
        {rows.length ? rows.map((row, index) => (
          <div key={`${field.name}-${index}`} className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
            <input
              value={row.label}
              onChange={(event) => write(rows.map((current, currentIndex) => (currentIndex === index ? { ...current, label: event.target.value } : current)))}
              className={`${base} h-10`}
              placeholder="规格名，如 材质"
            />
            <input
              value={row.value}
              onChange={(event) => write(rows.map((current, currentIndex) => (currentIndex === index ? { ...current, value: event.target.value } : current)))}
              className={`${base} h-10`}
              placeholder="规格值"
            />
            <button type="button" onClick={() => write(rows.filter((_, currentIndex) => currentIndex !== index))} className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/68 hover:bg-white/8">
              删除
            </button>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-white/12 px-3 py-4 text-center text-xs font-bold text-white/42">暂无规格，点击下方添加。</div>
        )}
        <button type="button" onClick={() => write([...rows, { label: "", value: "" }])} className="rounded-lg bg-mint-300 px-3 py-2 text-xs font-black text-[#12031d]">
          添加规格
        </button>
      </div>
    </JsonEditorShell>
  );
}

function fieldByName(fields: Field[], name: string) {
  return fields.find((field) => field.name === name);
}

function optionLabel(option?: ProductLookupOption, fallback = "") {
  if (!option) return fallback;
  const inactive = option.is_active === 0 || option.is_active === false ? "（已停用）" : "";
  return `${option.name}${inactive}`;
}

function ensureCurrentOption(options: ProductLookupOption[], allOptions: ProductLookupOption[], currentId: string) {
  if (!currentId || options.some((option) => option.id === currentId)) {
    return options;
  }
  const current = allOptions.find((option) => option.id === currentId);
  return current ? [current, ...options] : [{ id: currentId, name: `当前值：${currentId}`, is_active: false }, ...options];
}

function ProductEditorPanel({
  form,
  fields,
  setField,
  thumbnailUrl,
  thumbnailAlt
}: {
  form: Record<string, unknown>;
  fields: Field[];
  setField: (name: string, value: unknown) => void;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
}) {
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const [contentMode, setContentMode] = useState<"quick" | "copy" | "media" | "seo">("quick");
  const [lookups, setLookups] = useState<{ categories: ProductLookupOption[]; series: ProductLookupOption[] }>({ categories: [], series: [] });
  const [lookupMessage, setLookupMessage] = useState("");

  useEffect(() => {
    const key = `sweetmeilon_product_draft_${String(form.slug || "new")}`;
    window.localStorage.setItem(key, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLookups() {
      try {
        const [categoriesResponse, seriesResponse] = await Promise.all([
          fetch("/api/admin/resource/categories?pageSize=100", { cache: "no-store" }),
          fetch("/api/admin/resource/product_series?pageSize=100", { cache: "no-store" })
        ]);
        if (!categoriesResponse.ok || !seriesResponse.ok) {
          throw new Error("无法读取分类或系列选项。");
        }
        const [categoriesData, seriesData] = await Promise.all([categoriesResponse.json(), seriesResponse.json()]);
        if (!cancelled) {
          setLookups({
            categories: (categoriesData.rows || []) as ProductLookupOption[],
            series: (seriesData.rows || []) as ProductLookupOption[]
          });
          setLookupMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setLookupMessage(readError(error));
        }
      }
    }
    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  function renderField(name: string) {
    const field = fieldByName(fields, name);
    if (!field) return null;
    if (name === "primary_category_id") {
      return renderLookupField(field, primaryCategoryOptions, "请选择一级分类", (value) => {
        setField(name, value);
        const currentSubcategory = String(form.subcategory_id || "");
        const currentSubcategoryOption = lookups.categories.find((category) => category.id === currentSubcategory);
        if (currentSubcategoryOption?.parent_id && currentSubcategoryOption.parent_id !== value) {
          setField("subcategory_id", "");
        }
      });
    }
    if (name === "subcategory_id") {
      return renderLookupField(field, subcategoryOptions, "请选择二级分类");
    }
    if (name === "series_id") {
      return renderLookupField(field, seriesOptions, "请选择产品系列");
    }
    if (["highlights_json", "concerns_json"].includes(name)) {
      return <StringArrayJsonEditor key={name} field={field} value={form[name]} onChange={(value) => setField(name, value)} />;
    }
    if (name === "gallery_json") {
      return <StringArrayJsonEditor key={name} field={field} value={form[name]} onChange={(value) => setField(name, value)} previewImages />;
    }
    if (name === "specifications_json") {
      return <SpecRowsJsonEditor key={name} field={field} value={form[name]} onChange={(value) => setField(name, value)} />;
    }
    return (
      <label key={name} className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
        <FieldControl field={field} value={form[name]} onChange={(value) => setField(name, value)} />
      </label>
    );
  }

  function renderGroup(names: string[], columns = "md:grid-cols-2") {
    return <div className={`grid gap-3 ${columns}`}>{names.map((name) => renderField(name))}</div>;
  }

  const title = String(form.name || "未命名商品");
  const summary = String(form.summary || form.subtitle || "商品摘要会显示在产品中心和详情页。");
  const slug = String(form.slug || "");
  const publicPath = slug ? `/products/${slug}` : "/products";
  const activeCategoryId = String(form.primary_category_id || "");
  const activeCategories = lookups.categories.filter((category) => category.is_active !== 0);
  const activeSeries = lookups.series.filter((series) => series.is_active !== 0);
  const primaryCategories = activeCategories.filter((category) => category.level === "primary");
  const secondaryCategories = activeCategories.filter((category) => category.level === "secondary");
  const primaryCategoryOptions = ensureCurrentOption(primaryCategories, lookups.categories, activeCategoryId);
  const subcategoryOptions = ensureCurrentOption(
    secondaryCategories.filter((category) => !activeCategoryId || category.parent_id === activeCategoryId),
    lookups.categories,
    String(form.subcategory_id || "")
  );
  const seriesOptions = ensureCurrentOption(activeSeries, lookups.series, String(form.series_id || ""));
  const selectedPrimaryLabel = optionLabel(lookups.categories.find((category) => category.id === activeCategoryId), "产品");
  const selectedSubcategoryLabel = optionLabel(lookups.categories.find((category) => category.id === String(form.subcategory_id || "")), "");

  function renderLookupField(field: Field, options: ProductLookupOption[], placeholder: string, onChange?: (value: string) => void) {
    return (
      <label key={field.name} className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">{field.label.replace(" ID", "")}{field.required ? " *" : ""}</span>
        <select
          value={String(form[field.name] || "")}
          onChange={(event) => (onChange || ((value) => setField(field.name, value)))(event.target.value)}
          className="h-10 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Product Editor</p>
          <a href={publicPath} target="_blank" className="rounded-full border border-white/12 px-3 py-1 text-xs font-black text-white/70 hover:bg-white/8">
            官网预览
          </a>
        </div>
        <p className="text-sm leading-6 text-white/56">先填写名称、Slug 和状态；其余常用上架项在“快速上架”里完成，复杂字段放在后面的标签。</p>
        {renderGroup(["name", "short_name"])}
        {renderGroup(["slug", "subtitle"])}
        {renderGroup(["status", "sort_order"], "md:grid-cols-2")}
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setContentMode("quick")}
            className={`rounded-full px-3 py-1 text-xs font-black ${contentMode === "quick" ? "bg-mint-300 text-[#12031d]" : "border border-white/12 text-white/68"}`}
          >
            快速上架
          </button>
          {[
            ["copy", "内容"],
            ["media", "图片"],
            ["seo", "SEO"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentMode(value as "copy" | "media" | "seo")}
              className={`rounded-full px-3 py-1 text-xs font-black ${contentMode === value ? "bg-mint-300 text-[#12031d]" : "border border-white/12 text-white/68"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {contentMode === "quick" ? (
          <div className="grid gap-3">
            <div className="rounded-lg border border-mint-300/20 bg-mint-300/8 px-3 py-2 text-xs font-bold leading-6 text-mint-100">
              最少填写：商品名称、Slug、分类、摘要、购买链接和开关。需要完整详情时再切到“内容 / 图片 / SEO”。
            </div>
            {lookupMessage ? <div className="rounded-lg border border-red-300/25 bg-red-300/10 px-3 py-2 text-xs font-bold text-red-100">{lookupMessage}</div> : null}
            {renderGroup(["primary_category_id", "subcategory_id", "series_id"], "md:grid-cols-3")}
            {renderField("summary")}
            {renderGroup(["tmall_url", "jd_url"], "md:grid-cols-2")}
            {renderGroup(["tmall_enabled", "jd_enabled", "buy_button_enabled"], "md:grid-cols-3")}
            {renderGroup(["featured", "visible_home", "visible_catalog", "indexable"], "md:grid-cols-4")}
          </div>
        ) : null}

        {contentMode === "copy" ? (
          <div className="grid gap-3">
            {renderField("body_html")}
            {renderGroup(["highlights_json", "concerns_json"], "md:grid-cols-2")}
            {renderGroup(["material_notes", "specifications_json"], "md:grid-cols-2")}
            {renderGroup(["package_list", "care_notes"], "md:grid-cols-2")}
            {renderGroup(["storage_notes", "privacy_notes"], "md:grid-cols-2")}
            {renderGroup(["usage_tips", "compliance_notes"], "md:grid-cols-2")}
          </div>
        ) : null}

        {contentMode === "media" ? (
          <div className="grid gap-3">
            {renderGroup(["cover_media_id", "hero_media_id", "og_media_id"], "md:grid-cols-3")}
            {renderField("gallery_json")}
            {renderField("image_alt")}
          </div>
        ) : null}

        {contentMode === "seo" ? (
          <div className="grid gap-3">
            {renderGroup(["tmall_url", "jd_url"], "md:grid-cols-2")}
            {renderGroup(["tmall_enabled", "jd_enabled", "links_verified"], "md:grid-cols-3")}
            {renderGroup(["buy_button_enabled", "featured", "visible_home", "visible_catalog"], "md:grid-cols-4")}
            {renderField("seo_title")}
            {renderField("seo_description")}
            {renderGroup(["canonical_url", "indexable"], "md:grid-cols-2")}
            {renderField("scheduled_at")}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Preview</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview("desktop")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "desktop" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>桌面</button>
            <button type="button" onClick={() => setPreview("mobile")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "mobile" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>手机</button>
          </div>
        </div>
        <article className={`rounded-xl border border-white/10 bg-[#100019] p-4 ${preview === "mobile" ? "max-w-[320px]" : ""}`}>
          {thumbnailUrl ? (
            <div className="mb-4">
              <AdminThumbnail url={thumbnailUrl} alt={thumbnailAlt || title} size="lg" />
            </div>
          ) : null}
          <p className="text-xs font-black text-mint-300">
            {[selectedPrimaryLabel, selectedSubcategoryLabel].filter(Boolean).join(" / ") || "产品"}
          </p>
          <h4 className="mt-2 text-xl font-black text-white">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-white/60">{summary}</p>
          <div className="mt-4 grid gap-2 text-xs text-white/52">
            <p>状态：{String(form.status || "draft")}</p>
            <p>天猫：{form.tmall_enabled ? "启用" : "关闭"} / 京东：{form.jd_enabled ? "启用" : "关闭"}</p>
            <p>购买按钮：{form.buy_button_enabled ? "显示" : "隐藏"}</p>
          </div>
        </article>
      </section>
    </div>
  );
}

function ArticleEditorPanel({
  form,
  fields,
  setField
}: {
  form: Record<string, unknown>;
  fields: Field[];
  setField: (name: string, value: unknown) => void;
}) {
  const [mode, setMode] = useState<"rich" | "markdown" | "blocks">("rich");
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const baseField = "rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60";

  useEffect(() => {
    const key = `sweetmeilon_article_draft_${String(form.slug || "new")}`;
    window.localStorage.setItem(key, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const contentField = mode === "rich" ? "body_html" : mode === "markdown" ? "markdown_source" : "content_blocks_json";
  const contentLabel = mode === "rich" ? "富文本 HTML" : mode === "markdown" ? "Markdown 源码" : "结构化内容块 JSON";

  function renderSmallField(name: string) {
    const field = fieldByName(fields, name);
    if (!field) return null;
    return (
      <label key={name} className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
        <FieldControl field={field} value={form[name]} onChange={(value) => setField(name, value)} />
      </label>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Article Editor</p>
        {renderSmallField("title")}
        {renderSmallField("subtitle")}
        <div className="grid gap-3 md:grid-cols-2">
          {renderSmallField("slug")}
          {renderSmallField("author")}
        </div>
        {renderSmallField("excerpt")}
        <div className="grid gap-3 md:grid-cols-2">
          {renderSmallField("category_id")}
          {renderSmallField("cover_media_id")}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {renderSmallField("featured")}
          {renderSmallField("pinned")}
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["rich", "富文本"],
            ["markdown", "Markdown"],
            ["blocks", "内容块"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as "rich" | "markdown" | "blocks")}
              className={`rounded-full px-3 py-1 text-xs font-black ${mode === value ? "bg-mint-300 text-[#12031d]" : "border border-white/12 text-white/68"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/58">{contentLabel}</span>
          <textarea
            value={String(form[contentField] ?? "")}
            onChange={(event) => setField(contentField, event.target.value)}
            rows={mode === "blocks" ? 10 : 12}
            className={`${baseField} py-2 leading-6`}
          />
        </label>
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">SEO</p>
        {renderSmallField("seo_title")}
        {renderSmallField("seo_description")}
        {renderSmallField("canonical_url")}
        <div className="grid gap-3 md:grid-cols-2">
          {renderSmallField("og_media_id")}
          {renderSmallField("keywords_json")}
        </div>
        {renderSmallField("indexable")}
        {renderSmallField("scheduled_at")}
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Preview</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview("desktop")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "desktop" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>桌面</button>
            <button type="button" onClick={() => setPreview("mobile")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "mobile" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>手机</button>
          </div>
        </div>
        <article className={`rounded-xl border border-white/10 bg-[#100019] p-4 ${preview === "mobile" ? "max-w-[320px]" : ""}`}>
          <p className="text-xs font-black text-mint-300">{String(form.category_id || "文章")}</p>
          <h4 className="mt-2 text-xl font-black text-white">{String(form.title || "未命名文章")}</h4>
          <p className="mt-2 text-sm leading-6 text-white/60">{String(form.excerpt || "摘要会显示在文章列表和分享描述中。")}</p>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-6 text-white/58">
            {String(form.body_html || form.markdown_source || form.content_blocks_json || "正文预览将在公开文章页保留标题、段落、列表、引用、表格、图片、链接和 CTA。").slice(0, 420)}
          </div>
        </article>
      </section>
    </div>
  );
}

function ModuleEditorPanel({
  resource,
  form,
  fields,
  setField
}: {
  resource: string;
  form: Record<string, unknown>;
  fields: Field[];
  setField: (name: string, value: unknown) => void;
}) {
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");
  const baseField = "rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60";
  const isHomepage = resource === "homepage_sections";
  const jsonField = isHomepage ? "config_json" : "modules_json";
  const bodyField = isHomepage ? "" : "body_html";

  function renderSmallField(name: string) {
    const field = fieldByName(fields, name);
    if (!field) return null;
    return (
      <label key={name} className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
        <FieldControl field={field} value={form[name]} onChange={(value) => setField(name, value)} />
      </label>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">{isHomepage ? "Homepage Module" : "Page Builder"}</p>
        {isHomepage ? (
          <>
            {renderSmallField("section_key")}
            {renderSmallField("section_type")}
          </>
        ) : (
          <>
            {renderSmallField("page_key")}
            {renderSmallField("slug")}
          </>
        )}
        {renderSmallField("title")}
        {renderSmallField("subtitle")}
        {renderSmallField("description")}
        <div className="grid gap-3 md:grid-cols-2">
          {renderSmallField("sort_order")}
          {renderSmallField(isHomepage ? "is_enabled" : "indexable")}
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">{isHomepage ? "模块配置 JSON" : "页面模块 JSON"}</p>
        <textarea
          value={String(form[jsonField] ?? (isHomepage ? "{}" : "[]"))}
          onChange={(event) => setField(jsonField, event.target.value)}
          rows={12}
          className={`${baseField} py-2 leading-6`}
        />
        {bodyField ? (
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-white/58">页面正文 HTML</span>
            <textarea
              value={String(form[bodyField] ?? "")}
              onChange={(event) => setField(bodyField, event.target.value)}
              rows={8}
              className={`${baseField} py-2 leading-6`}
            />
          </label>
        ) : null}
      </section>

      {!isHomepage ? (
        <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">SEO</p>
          {renderSmallField("seo_title")}
          {renderSmallField("seo_description")}
        </section>
      ) : null}

      <section className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-mint-300">Preview</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview("desktop")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "desktop" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>桌面</button>
            <button type="button" onClick={() => setPreview("mobile")} className={`rounded-full px-3 py-1 text-xs font-black ${preview === "mobile" ? "bg-white text-[#12031d]" : "border border-white/12 text-white/68"}`}>手机</button>
          </div>
        </div>
        <article className={`rounded-xl border border-white/10 bg-[#100019] p-4 ${preview === "mobile" ? "max-w-[320px]" : ""}`}>
          <p className="text-xs font-black text-mint-300">{isHomepage ? String(form.section_type || "homepage") : String(form.page_key || "page")}</p>
          <h4 className="mt-2 text-xl font-black text-white">{String(form.title || "未命名模块")}</h4>
          <p className="mt-2 text-sm leading-6 text-white/60">{String(form.subtitle || form.description || form.seo_description || "预览用于检查标题、说明和模块配置的大致呈现。")}</p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-white/50">
            {String(form[jsonField] || (isHomepage ? "{}" : "[]")).slice(0, 900)}
          </pre>
        </article>
      </section>
    </div>
  );
}

function AdminRolesPanel({
  state,
  onAssign,
  onRemove,
  onSetActive
}: {
  state: AdminRoleState | null;
  onAssign: (role: string) => void;
  onRemove: (role: string) => void;
  onSetActive: (isActive: boolean) => void;
}) {
  if (!state) {
    return <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-white/56">正在读取管理员角色...</div>;
  }
  const roles = new Set(state.roles);
  const isActive = Number(state.user?.is_active ?? 1) === 1;
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div>
        <p className="text-xs font-black text-white/58">管理员角色</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.assignableRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => (roles.has(role) ? onRemove(role) : onAssign(role))}
              className={`rounded-full px-3 py-1 text-xs font-black ${roles.has(role) ? "bg-mint-300 text-[#12031d]" : "border border-white/12 text-white/68"}`}
            >
              {roles.has(role) ? `移除 ${role}` : `分配 ${role}`}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSetActive(!isActive)}
        className="rounded-lg border border-white/12 px-3 py-2 text-xs font-black text-white/75 hover:bg-white/8"
      >
        {isActive ? "禁用管理员" : "恢复管理员"}
      </button>
    </section>
  );
}

function DashboardView({ dashboard }: { dashboard: DashboardResponse | null }) {
  if (!dashboard) return <p className="text-white/60">后台加载中...</p>;
  return (
    <div className="grid gap-6">
      {!dashboard.dbReady ? <div className="rounded-xl border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-100">尚未绑定开发 D1。请按文档创建 D1 并执行 migration。</div> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <p className="text-sm text-white/54">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-mint-300">{card.value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
          <h3 className="text-lg font-black">待处理事项</h3>
          <div className="mt-4 grid gap-2">
            {dashboard.pending.map((item) => (
              <div key={item.label} className="flex justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                <span className="text-white/70">{item.label}</span>
                <strong className="text-mint-300">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
          <h3 className="text-lg font-black">最近操作</h3>
          <div className="mt-4 grid gap-2">
            {dashboard.recent.length ? dashboard.recent.map((item, index) => (
              <div key={index} className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white/68">
                {displayValue(item.actor_email)} / {displayValue(item.action)} / {displayValue(item.entity_type)}
              </div>
            )) : <p className="text-sm text-white/45">暂无审计日志。</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function BackupView() {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
      <h3 className="text-xl font-black">导入导出与备份</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
        当前已实现全量 JSON 备份导出。导入需要先验证、预览、人工确认再写入，正式导入入口请在开发 D1 完成演练后开启。
      </p>
      <a href="/api/admin/backup" className="mt-5 inline-flex rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-[#12031d]">
        导出全量备份
      </a>
    </section>
  );
}

function BackupRestoreView() {
  const [backupText, setBackupText] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function readBackupFile(file: File | null) {
    if (!file) return;
    setBackupText(await file.text());
  }

  async function submitRestore(nextConfirm = "") {
    setResult("");
    setIsBusy(true);
    try {
      const backup = JSON.parse(backupText);
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ backup, confirm: nextConfirm })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "备份处理失败。");
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-5">
      <div>
        <h3 className="text-xl font-black">导入导出与备份</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
          备份恢复只用于开发 D1 或 Preview D1。先预览恢复计划，确认表数量、R2 对象清单和覆盖范围后，再输入确认口令执行。
        </p>
      </div>
      <a href="/api/admin/backup" className="inline-flex w-fit rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-[#12031d]">
        导出全量备份 JSON
      </a>
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <label className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
          <span className="font-black text-white/72">选择备份 JSON</span>
          <input type="file" accept="application/json,.json" onChange={(event) => void readBackupFile(event.target.files?.[0] || null)} className="text-xs text-white/64" />
        </label>
        <textarea
          value={backupText}
          onChange={(event) => setBackupText(event.target.value)}
          rows={8}
          placeholder="粘贴 sweetmeilon-cms-backup JSON"
          className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm text-white outline-none focus:border-mint-300/60"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="恢复确认口令：RESTORE_TO_DEV_D1"
          className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none focus:border-mint-300/60"
        />
        <button type="button" disabled={isBusy || !backupText} onClick={() => void submitRestore()} className="h-11 rounded-lg border border-white/12 px-4 text-sm font-black text-white/76 disabled:opacity-50">
          预览恢复计划
        </button>
        <button type="button" disabled={isBusy || confirm !== "RESTORE_TO_DEV_D1"} onClick={() => void submitRestore(confirm)} className="h-11 rounded-lg border border-red-300/35 px-4 text-sm font-black text-red-100 disabled:opacity-50">
          恢复到开发 D1
        </button>
      </div>
      {result ? <pre className="max-h-[420px] overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-5 text-white/70">{result}</pre> : null}
    </section>
  );
}

function MediaUploadPanel({ onUploaded }: { onUploaded: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [group, setGroup] = useState("brand");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function upload() {
    if (!files?.length) return;
    setMessage("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("group", group);
      Array.from(files).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败。");
      setMessage(`已上传 ${data.assets?.length || 0} 个素材。`);
      onUploaded();
    } catch (error) {
      setMessage(readError(error));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-4 md:grid-cols-[1fr_180px_auto]">
      <label className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">上传图片到开发 R2</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          className="rounded-lg border border-white/12 bg-[#160722] px-3 py-2 text-sm text-white/70"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-black text-white/58">素材分组</span>
        <select value={group} onChange={(event) => setGroup(event.target.value)} className="h-10 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm text-white outline-none">
          <option value="brand">brand</option>
          <option value="products">products</option>
          <option value="articles">articles</option>
          <option value="pages">pages</option>
          <option value="homepage">homepage</option>
          <option value="faq">faq</option>
        </select>
      </label>
      <div className="grid content-end gap-1">
        <button type="button" disabled={isUploading || !files?.length} onClick={() => void upload()} className="h-10 rounded-lg bg-mint-gradient px-4 text-sm font-black text-[#12031d] disabled:opacity-50">
          上传素材
        </button>
        {message ? <p className="text-xs font-bold text-mint-200">{message}</p> : null}
      </div>
    </section>
  );
}
