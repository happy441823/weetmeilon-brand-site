import test from "node:test";
import assert from "node:assert/strict";
import { runDuePublishJobs } from "../../src/lib/cms/scheduler.ts";

class SchedulerD1 {
  constructor(jobs) {
    this.jobs = jobs;
    this.entities = new Map();
    this.errors = new Map();
  }

  prepare(sql) {
    const db = this;
    return {
      values: [],
      bind(...values) {
        this.values = values;
        return this;
      },
      async all() {
        if (/FROM publish_jobs WHERE status = 'pending'/.test(sql)) {
          return { results: db.jobs.filter((job) => job.status === "pending" && job.run_at <= this.values[0]), success: true, meta: {} };
        }
        throw new Error(`Unexpected all SQL: ${sql}`);
      },
      async run() {
        if (/SET status = 'running'/.test(sql)) {
          const job = db.jobs.find((item) => item.id === this.values[1] && item.status === "pending");
          if (job) {
            job.status = "running";
            job.attempts += 1;
          }
          return { success: true, meta: { changes: job ? 1 : 0 } };
        }
        if (/UPDATE "articles" SET/.test(sql) || /UPDATE "products" SET/.test(sql) || /UPDATE "pages" SET/.test(sql)) {
          db.entities.set(this.values.at(-1), { sql, values: this.values });
          return { success: true, meta: { changes: 1 } };
        }
        if (/SET status = 'completed'/.test(sql)) {
          const job = db.jobs.find((item) => item.id === this.values[1]);
          job.status = "completed";
          job.last_error = null;
          return { success: true, meta: { changes: 1 } };
        }
        if (/SET status = 'failed'/.test(sql)) {
          const job = db.jobs.find((item) => item.id === this.values[2]);
          job.status = "failed";
          job.last_error = this.values[0];
          db.errors.set(job.id, job.last_error);
          return { success: true, meta: { changes: 1 } };
        }
        throw new Error(`Unexpected run SQL: ${sql}`);
      }
    };
  }
}

test("scheduled publish jobs publish due content and complete the job", async () => {
  const db = new SchedulerD1([
    { id: "job-1", entity_type: "articles", entity_id: "article-1", action: "publish", attempts: 0, status: "pending", run_at: "2026-06-17T00:00:00.000Z" }
  ]);

  const result = await runDuePublishJobs(db, { now: new Date("2026-06-17T00:01:00.000Z") });
  assert.deepEqual(result, { picked: 1, completed: 1, failed: 0 });
  assert.equal(db.jobs[0].status, "completed");
  assert.equal(db.jobs[0].attempts, 1);
  assert.equal(db.entities.get("article-1").values[0], "2026-06-17T00:01:00.000Z");
});

test("scheduled publish jobs record failures and last_error", async () => {
  const db = new SchedulerD1([
    { id: "job-2", entity_type: "unknown", entity_id: "x", action: "publish", attempts: 0, status: "pending", run_at: "2026-06-17T00:00:00.000Z" }
  ]);

  const result = await runDuePublishJobs(db, { now: new Date("2026-06-17T00:01:00.000Z") });
  assert.deepEqual(result, { picked: 1, completed: 0, failed: 1 });
  assert.equal(db.jobs[0].status, "failed");
  assert.match(db.jobs[0].last_error, /Unsupported publish entity type/);
});
