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
  assert.equal(assertWorkflowAction("articles", "submit_review", ["editor"]), "pending_review");
  assert.throws(() => assertWorkflowAction("articles", "publish", ["editor"]), /没有执行/);
  assert.throws(() => assertWorkflowAction("products", "offline", ["editor"]), /没有执行/);
});

test("reviewer and super_admin can publish and offline workflow content", () => {
  assert.equal(assertWorkflowAction("articles", "publish", ["reviewer"]), "published");
  assert.equal(assertWorkflowAction("products", "offline", ["reviewer"]), "offline");
  assert.equal(assertWorkflowAction("pages", "archive", ["super_admin"]), "archived");
});

test("workflow transition table is explicit", () => {
  assert.deepEqual(Object.keys(workflowTransitions).sort(), ["archive", "offline", "publish", "submit_review"]);
  assert.deepEqual(workflowTransitions.publish.roles, ["reviewer", "super_admin"]);
});
