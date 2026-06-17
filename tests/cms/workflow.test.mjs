import test from "node:test";
import assert from "node:assert/strict";
import {
  assertWorkflowAction,
  sanitizeCreatePayload,
  sanitizeUpdatePayload,
  workflowTransitions
} from "../../src/lib/cms/workflow.ts";

test("generic create does not allow arbitrary workflow fields", () => {
  assert.deepEqual(sanitizeCreatePayload("articles", { title: "Draft", status: "draft" }), { title: "Draft" });
  assert.throws(() => sanitizeCreatePayload("articles", { title: "Publish", status: "published" }), /工作流服务端管理/);
  assert.throws(() => sanitizeCreatePayload("products", { name: "A", published_by: "attacker" }), /published_by/);
});

test("generic update rejects status and publish metadata bypasses", () => {
  assert.deepEqual(sanitizeUpdatePayload({ title: "Updated" }), { title: "Updated" });
  assert.throws(() => sanitizeUpdatePayload({ status: "published" }), /status/);
  assert.throws(() => sanitizeUpdatePayload({ published_at: "2026-06-17T00:00:00.000Z" }), /published_at/);
  assert.throws(() => sanitizeUpdatePayload({ reviewed_by: "attacker" }), /reviewed_by/);
});

test("editor can submit review but cannot publish or offline content", () => {
  assert.equal(assertWorkflowAction({ resource: "articles", action: "submit_review", roles: ["editor"], currentStatus: "draft" }), "pending_review");
  assert.throws(() => assertWorkflowAction({ resource: "articles", action: "publish", roles: ["editor"], currentStatus: "pending_review" }), /权限/);
  assert.throws(() => assertWorkflowAction({ resource: "products", action: "offline", roles: ["editor"], currentStatus: "published" }), /权限/);
});

test("reviewer and super_admin can publish and offline workflow content", () => {
  assert.equal(assertWorkflowAction({ resource: "articles", action: "publish", roles: ["reviewer"], currentStatus: "pending_review" }), "published");
  assert.equal(assertWorkflowAction({ resource: "products", action: "offline", roles: ["reviewer"], currentStatus: "published" }), "offline");
  assert.equal(assertWorkflowAction({ resource: "pages", action: "archive", roles: ["super_admin"], currentStatus: "offline" }), "archived");
});

test("workflow transition table is explicit", () => {
  assert.deepEqual(Object.keys(workflowTransitions).sort(), ["archive", "cancel_schedule", "offline", "publish", "return_to_draft", "schedule", "set_coming_soon", "submit_review"]);
  assert.deepEqual(workflowTransitions.publish.roles, ["reviewer", "super_admin"]);
});

test("workflow validates from-to status, schedule time and product-only coming soon", () => {
  assert.throws(() => assertWorkflowAction({ resource: "articles", action: "publish", roles: ["reviewer"], currentStatus: "archived" }), /不能执行/);
  assert.throws(() => assertWorkflowAction({ resource: "articles", action: "schedule", roles: ["reviewer"], currentStatus: "pending_review", scheduledAt: "2020-01-01T00:00:00.000Z" }), /未来时间/);
  assert.equal(assertWorkflowAction({ resource: "articles", action: "schedule", roles: ["reviewer"], currentStatus: "pending_review", scheduledAt: "2999-01-01T00:00:00.000Z" }), "scheduled");
  assert.throws(() => assertWorkflowAction({ resource: "articles", action: "set_coming_soon", roles: ["reviewer"], currentStatus: "draft" }), /不支持此工作流动作/);
  assert.equal(assertWorkflowAction({ resource: "products", action: "set_coming_soon", roles: ["reviewer"], currentStatus: "draft" }), "coming_soon");
});
