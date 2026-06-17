import type { CmsResource, CmsRole } from "./schema";

export type WorkflowStatus = "draft" | "pending_review" | "scheduled" | "coming_soon" | "published" | "offline" | "archived";
export type WorkflowAction = "submit_review" | "return_to_draft" | "schedule" | "cancel_schedule" | "set_coming_soon" | "publish" | "offline" | "archive";

export const workflowResources = new Set<CmsResource>(["products", "articles", "pages"]);

export const workflowManagedFields = new Set([
  "status",
  "published_at",
  "published_by",
  "reviewed_by",
  "first_published_at",
  "last_published_by"
]);

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
  offline: { from: ["published", "coming_soon"], to: "offline", roles: ["reviewer", "super_admin"] },
  archive: { from: ["draft", "pending_review", "offline"], to: "archived", roles: ["reviewer", "super_admin"] }
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

export function sanitizeUpdatePayload(input: Record<string, unknown>) {
  const blocked = findWorkflowField(input);
  if (blocked) {
    throw new WorkflowError(`字段 ${blocked} 由工作流服务端管理，不能通过通用更新接口写入。`, 400);
  }
  return input;
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
