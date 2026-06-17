import type { CmsResource, CmsRole } from "./schema";

export type WorkflowStatus = "draft" | "pending_review" | "scheduled" | "published" | "offline" | "archived";
export type WorkflowAction = "submit_review" | "publish" | "offline" | "archive";

export const workflowResources = new Set<CmsResource>(["products", "articles", "pages"]);

export const workflowManagedFields = new Set([
  "status",
  "published_at",
  "published_by",
  "reviewed_by",
  "first_published_at",
  "last_published_by"
]);

export const workflowTransitions: Record<WorkflowAction, { status: WorkflowStatus; roles: CmsRole[] }> = {
  submit_review: { status: "pending_review", roles: ["editor", "reviewer", "super_admin"] },
  publish: { status: "published", roles: ["reviewer", "super_admin"] },
  offline: { status: "offline", roles: ["reviewer", "super_admin"] },
  archive: { status: "archived", roles: ["reviewer", "super_admin"] }
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

export function assertWorkflowAction(resource: string, action: string, roles: CmsRole[]) {
  if (!isWorkflowResource(resource)) {
    throw new WorkflowError("该资源不支持发布工作流。", 400);
  }
  if (!(action in workflowTransitions)) {
    throw new WorkflowError("未知工作流动作。", 400);
  }

  const workflowAction = action as WorkflowAction;
  if (!canUseWorkflowAction(roles, workflowAction)) {
    throw new WorkflowError("当前角色没有执行该工作流动作的权限。", 403);
  }

  return workflowTransitions[workflowAction].status;
}
