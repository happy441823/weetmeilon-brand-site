import test from "node:test";
import assert from "node:assert/strict";
import { adminErrorResponse } from "../../src/lib/cms/auth.ts";

async function readError(response) {
  const body = await response.json();
  return { status: response.status, error: body.error };
}

test("admin error response returns actionable JSON format errors", async () => {
  const result = await readError(adminErrorResponse(new SyntaxError("Unexpected token h in JSON at position 1")));

  assert.equal(result.status, 400);
  assert.match(result.error, /JSON 字段格式不正确/);
});

test("admin error response returns safe unknown error message", async () => {
  const result = await readError(adminErrorResponse(new Error("D1_ERROR: no such column: hero_media_id token=secret-value")));

  assert.equal(result.status, 500);
  assert.match(result.error, /后台保存失败/);
  assert.match(result.error, /D1_ERROR/);
  assert.doesNotMatch(result.error, /secret-value/);
});
