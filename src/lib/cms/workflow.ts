import type { CmsResource, CmsRole } from "./schema";

export type WorkflowStatus = "draft" | "pending_review" | "scheduled" | "coming_soon" | "published" | "offline" | "archived";
export type WorkflowAction = "submit_review" | "return_to_draft" | "schedule" | "cancel_schedule" | "set_coming_soon" | "publish" | "offline" | "archive";

export const workflowResources = new Set<CmsResource>(["products", "articles", "pages"]);

export const workflowManagedFields = new Set([
  "status",
  "published_at",
  "scheduled_at",
  "published_by",
  "reviewed_by",
  "first_published_at",
  "last_published_by"
]);

export const workflowInternalResources = new Set(["publish_jobs"]);

export type WorkflowTransition = {
  from: WorkflowStatus[];
  to: WorkflowStatus;
  roles: CmsRole[];
  resources?: CmsResource[];
  requiresFutureRunAt?: boolean;
};

export const workflowTransitions: Record<WorkflowAction, WorkflowTransition> = {
  submit_review: { from: ["draft", "offline"], to: "pending_review", roles: ["editor", "reviewer", "super_admin"] },
  return_to_draft: { from: ["pending_review", "scheduled", "offline"], to: "draft", roles: ["editor", "reviewer", "super_admin"] },
  schedule: { from: ["pending_review"], to: "scheduled", roles: ["reviewer", "super_admin"], requiresFutureRunAt: true },
  cancel_schedule: { from: ["scheduled"], to: "draft", roles: ["reviewer", "super_admin"] },
  set_coming_soon: { from: ["draft", "pending_review", "offline"], to: "coming_soon", roles: ["reviewer", "super_admin"], resources: ["products"] },
  publish: { from: ["pending_review", "scheduled"], to: "published", roles: ["reviewer", "super_admin"] },
  offline: { from: ["scheduled", "published", "coming_soon"], to: "offline", roles: ["reviewer", "super_admin"] },
  archive: { from: ["draft", "pending_review", "scheduled", "offline"], to: "archived", roles: ["reviewer", "super_admin"] }
};

export class WorkflowError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export function isWorkflowResource(resource: string): resource is CmsResource {
  return workflowResources.has(resource as CmsResource);
}

export function findWorkflowField(input: Record<string, unknown>) {
  return Object.keys(input).find((key) => workflowManagedFields.has(key));
}

export function sanitizeCreatePayload(resource: string, input: Record<string, unknown>) {
  if (workflowInternalResources.has(resource)) {
    throw new WorkflowError("该资源只能由工作流服务写入，不能通过通用 CRUD 创建。", 403);
  }
  if (!isWorkflowResource(resource)) {
    return input;
  }
  const blocked = findWorkflowField(input);
  if (!blocked) {
    return input;
  }
  if (isWorkflowResource(resource) && blocked === "status" && input.status === "draft") {
    const { status: _status, ...rest } = input;
    return rest;
  }
  throw new WorkflowError(`字段 ${blocked} 由工作流服务端管理，不能通过通用创建接口写入。`, 400);
}

export function sanitizeUpdatePayload(input: Record<string, unknown>, resource = "products") {
  if (workflowInternalResources.has(resource)) {
    throw new WorkflowError("该资源只能由工作流服务写入，不能通过通用 CRUD 更新。", 403);
  }
  if (!isWorkflowResource(resource)) {
    return input;
  }
  const blocked = findWorkflowField(input);
  if (blocked) {
    throw new WorkflowError(`字段 ${blocked} 由工作流服务端管理，不能通过通用更新接口写入。`, 400);
  }
  return input;
}

function requireText(row: Record<string, unknown>, field: string, label: string) {
  if (!String(row[field] || "").trim()) {
    throw new WorkflowError(`${label}不能为空，不能发布。`, 400);
  }
}

export function validateProductPublish(row: Record<string, unknown> | null | undefined) {
  if (!row) throw new WorkflowError("商品不存在，不能发布。", 404);
  requireText(row, "name", "商品名称");
  requireText(row, "slug", "商品 slug");
  requireText(row, "summary", "商品摘要");
  requireText(row, "body_html", "商品完整介绍");
  requireText(row, "primary_category_id", "商品一级分类");
  requireText(row, "cover_media_id", "商品主图");
}

export function validateArticlePublish(row: Record<string, unknown> | null | undefined) {
  if (!row) throw new WorkflowError("文章不存在，不能发布。", 404);
  requireText(row, "title", "文章标题");
  requireText(row, "slug", "文章 slug");
  requireText(row, "excerpt", "文章摘要");
  if (!String(row.body_html || "").trim() && !String(row.markdown_source || "").trim() && !String(row.content_blocks_json || "").trim()) {
    throw new WorkflowError("文章正文不能为空，不能发布。", 400);
  }
}

export function validatePagePublish(row: Record<string, unknown> | null | undefined) {
  if (!row) throw new WorkflowError("页面不存在，不能发布。", 404);
  requireText(row, "title", "页面标题");
  requireText(row, "slug", "页面 slug");
  if (!String(row.body_html || "").trim() && !String(row.modules_json || "").trim()) {
    throw new WorkflowError("页面正文或模块不能为空，不能发布。", 400);
  }
}

export function validatePublishQuality(resource: string, row: Record<string, unknown> | null | undefined) {
  if (resource === "products") return validateProductPublish(row);
  if (resource === "articles") return validateArticlePublish(row);
  if (resource === "pages") return validatePagePublish(row);
  throw new WorkflowError("该资源不支持发布校验。", 400);
}

function hasText(value: unknown) {
  return String(value || "").trim().length > 0;
}

export function buildProductPublishVisibilityPatch(row: Record<string, unknown> | null | undefined) {
  const hasTmallUrl = hasText(row?.tmall_url);
  const hasJdUrl = hasText(row?.jd_url);
  const patch: Record<string, unknown> = {
    visible_catalog: 1,
    indexable: 1
  };

  if (hasTmallUrl) {
    patch.tmall_enabled = 1;
  }
  if (hasJdUrl) {
    patch.jd_enabled = 1;
  }
  if (hasTmallUrl || hasJdUrl) {
    patch.buy_button_enabled = 1;
  }

  return patch;
}

export function canUseWorkflowAction(roles: CmsRole[], action: WorkflowAction) {
  const allowed = workflowTransitions[action].roles;
  return roles.includes("super_admin") || allowed.some((role) => roles.includes(role));
}

export function assertWorkflowAction(input: {
  resource: string;
  action: string;
  roles: CmsRole[];
  currentStatus: string;
  scheduledAt?: string | null;
}) {
  if (!isWorkflowResource(input.resource)) {
    throw new WorkflowError("该资源不支持发布工作流。", 400);
  }
  if (!(input.action in workflowTransitions)) {
    throw new WorkflowError("未知工作流动作。", 400);
  }

  const action = input.action as WorkflowAction;
  const transition = workflowTransitions[action];
  if (transition.resources && !transition.resources.includes(input.resource as CmsResource)) {
    throw new WorkflowError("该资源不支持此工作流动作。", 400);
  }
  if (!canUseWorkflowAction(input.roles, action)) {
    throw new WorkflowError("当前角色没有执行该工作流动作的权限。", 403);
  }
  if (!transition.from.includes(input.currentStatus as WorkflowStatus)) {
    throw new WorkflowError(`当前状态 ${input.currentStatus} 不能执行 ${action}。`, 409);
  }
  if (transition.requiresFutureRunAt) {
    const runAt = Date.parse(String(input.scheduledAt || ""));
    if (!Number.isFinite(runAt) || runAt <= Date.now()) {
      throw new WorkflowError("定时发布时间必须是未来时间。", 400);
    }
  }

  return transition.to;
}
