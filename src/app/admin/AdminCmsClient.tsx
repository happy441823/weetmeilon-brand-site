"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

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

export const workflowManagedClientFields = new Set([
  "status",
  "published_at",
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

function readError(error: unknown) {
  return error instanceof Error ? error.message : "操作失败，请稍后重试。";
}

export function AdminCmsClient() {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [resource, setResource] = useState("dashboard");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [adminRoleState, setAdminRoleState] = useState<AdminRoleState | null>(null);
  const [isPending, startTransition] = useTransition();

  const config = resource !== "dashboard" && resource !== "backup" ? schema?.resources[resource] : null;

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
    const nextConfig = schema.resources[resource];
    setForm(Object.fromEntries((nextConfig?.fields || []).map((field) => [field.name, emptyValue(field)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, resource]);

  async function loadRows(target = resource) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/resource/${target}?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "读取失败。");
      setRows([]);
      return;
    }
    setRows(data.rows || []);
    if (data.dbReady === false) {
      setMessage("当前环境尚未绑定 CMS_DB，页面可预览但不能读取真实 D1 数据。");
    }
  }

  function resetForm() {
    if (!config) return;
    setSelected(null);
    setAdminRoleState(null);
    setForm(Object.fromEntries(config.fields.map((field) => [field.name, emptyValue(field)])));
  }

  function editRow(row: Record<string, unknown>) {
    setSelected(row);
    if (!config) return;
    setForm(Object.fromEntries(config.fields.map((field) => [field.name, row[field.name] ?? emptyValue(field)])));
    if (resource === "admin_users") {
      void loadAdminRoles(row, config);
    } else {
      setAdminRoleState(null);
    }
  }

  function setField(name: string, value: unknown) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    if (!config || resource === "dashboard" || resource === "backup") return;
    setMessage("");
    startTransition(async () => {
      try {
        const id = selected ? resourceItemKey(selected, config) : "";
        const url = selected ? `/api/admin/resource/${resource}/${encodeURIComponent(id)}` : `/api/admin/resource/${resource}`;
        const response = await fetch(url, {
          method: selected ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(buildAdminSavePayload(resource, form))
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
    <main className="min-h-screen bg-[#09000f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 bg-[#12031d] px-5 py-6">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">SWEETMEILON</p>
            <h1 className="mt-2 text-2xl font-black">品牌官网 CMS</h1>
            <p className="mt-3 text-sm leading-6 text-white/56">Preview 阶段仅连接开发 D1/R2，不触碰生产数据。</p>
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
                      onClick={() => setResource(item.resource)}
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
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`搜索${config.labelPlural}`}
                    className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none"
                  />
                  {statusOptions.length ? (
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-lg border border-white/12 bg-[#160722] px-3 text-sm outline-none">
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
                        {config.listColumns.map((column) => <th key={column} className="border-b border-white/10 px-3 py-3 font-black">{column}</th>)}
                        <th className="border-b border-white/10 px-3 py-3 font-black">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={resourceItemKey(row, config)} className="text-white/78">
                          {config.listColumns.map((column) => <td key={column} className="border-b border-white/8 px-3 py-3">{displayValue(row[column])}</td>)}
                          <td className="border-b border-white/8 px-3 py-3">
                            <button type="button" onClick={() => editRow(row)} className="rounded-full border border-mint-300/35 px-3 py-1 text-xs font-black text-mint-300 hover:bg-mint-300/10">编辑</button>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 ? (
                        <tr><td colSpan={config.listColumns.length + 1} className="px-3 py-10 text-center text-white/45">暂无数据。请先执行 D1 migration 和数据迁移脚本。</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black">{selected ? "编辑内容" : `新增${config.label}`}</h3>
                  <button type="button" onClick={resetForm} className="rounded-full border border-white/12 px-3 py-1 text-xs font-bold text-white/70 hover:bg-white/8">清空</button>
                </div>
                <div className="grid gap-3">
                  {config.fields.map((field) => (
                    <label key={field.name} className="grid gap-1.5">
                      <span className="text-xs font-black text-white/58">{field.label}{field.required ? " *" : ""}</span>
                      <FieldControl field={field} value={form[field.name]} onChange={(value) => setField(field.name, value)} />
                    </label>
                  ))}
                </div>
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
          <option value="product">product</option>
          <option value="article">article</option>
          <option value="page">page</option>
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
