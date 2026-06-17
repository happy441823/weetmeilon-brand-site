import test from "node:test";
import assert from "node:assert/strict";
import {
  assertWorkflowAction,
  sanitizeCreatePayload,
  sanitizeUpdatePayload,
  validateArticlePublish,
  validatePagePublish,
  validateProductPublish,
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

test("scheduled_at and publish_jobs are protected from generic writes", () => {
  assert.throws(() => sanitizeCreatePayload("products", { name: "A", scheduled_at: "2999-01-01T00:00:00.000Z" }), /scheduled_at/);
  assert.throws(() => sanitizeUpdatePayload({ scheduled_at: "2999-01-01T00:00:00.000Z" }), /scheduled_at/);
  assert.throws(() => sanitizeCreatePayload("publish_jobs", { entity_id: "attacker" }), /通用 CRUD 创建/);
  assert.throws(() => sanitizeUpdatePayload({ status: "pending" }, "publish_jobs"), /通用 CRUD 更新/);
});

test("scheduled content can leave schedule through offline or archive", () => {
  assert.equal(assertWorkflowAction({ resource: "products", action: "offline", roles: ["reviewer"], currentStatus: "scheduled" }), "offline");
  assert.equal(assertWorkflowAction({ resource: "products", action: "archive", roles: ["reviewer"], currentStatus: "scheduled" }), "archived");
});

test("publish quality validation rejects incomplete content", () => {
  assert.throws(() => validateProductPublish({ name: "P", slug: "p", summary: "s", body_html: "<p>x</p>", primary_category_id: "cat" }), /商品主图/);
  assert.doesNotThrow(() =>
    validateProductPublish({ name: "P", slug: "p", summary: "s", body_html: "<p>x</p>", primary_category_id: "cat", cover_media_id: "media_1" })
  );
  assert.throws(() => validateArticlePublish({ title: "A", slug: "a", excerpt: "e" }), /文章正文/);
  assert.doesNotThrow(() => validateArticlePublish({ title: "A", slug: "a", excerpt: "e", markdown_source: "# A" }));
  assert.throws(() => validatePagePublish({ title: "P", slug: "p" }), /页面正文/);
  assert.doesNotThrow(() => validatePagePublish({ title: "P", slug: "p", modules_json: "[]" }));
});
