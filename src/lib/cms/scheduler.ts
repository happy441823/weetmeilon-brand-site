type SchedulerDb = D1Database;

export type PublishJobRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  attempts: number;
};

export type SchedulerResult = {
  picked: number;
  locked: number;
  completed: number;
  failed: number;
  retried: number;
};

const publishableTables: Record<string, { table: string; actorField: string }> = {
  products: { table: "products", actorField: "published_by" },
  articles: { table: "articles", actorField: "last_published_by" },
  pages: { table: "pages", actorField: "published_by" }
};

function quote(name: string) {
  return `"${name.replace(/"/g, "")}"`;
}

function changedRows(result: D1Result<unknown>) {
  return Number((result.meta as { changes?: number } | undefined)?.changes || 0);
}

async function completeJob(db: SchedulerDb, id: string, now: string) {
  await db
    .prepare("UPDATE publish_jobs SET status = 'completed', last_error = NULL, updated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
}

async function failJob(db: SchedulerDb, job: PublishJobRow, error: unknown, now: string, maxAttempts: number) {
  const message = error instanceof Error ? error.message : String(error);
  const nextStatus = job.attempts + 1 >= maxAttempts ? "failed" : "pending";
  await db
    .prepare("UPDATE publish_jobs SET status = ?, last_error = ?, updated_at = ? WHERE id = ?")
    .bind(nextStatus, message.slice(0, 500), now, job.id)
    .run();
  return nextStatus;
}

async function lockJob(db: SchedulerDb, id: string, now: string) {
  const result = await db
    .prepare("UPDATE publish_jobs SET status = 'running', attempts = attempts + 1, updated_at = ? WHERE id = ? AND status = 'pending'")
    .bind(now, id)
    .run();
  return changedRows(result) === 1;
}

async function publishEntity(db: SchedulerDb, job: PublishJobRow, now: string) {
  if (job.action !== "publish") {
    throw new Error(`Unsupported scheduled action: ${job.action}`);
  }

  const target = publishableTables[job.entity_type];
  if (!target) {
    throw new Error(`Unsupported publish entity type: ${job.entity_type}`);
  }

  const fields =
    job.entity_type === "articles"
      ? `status = 'published', published_at = ?, first_published_at = COALESCE(first_published_at, ?), ${quote(target.actorField)} = COALESCE(${quote(target.actorField)}, 'scheduled_job'), updated_at = ?`
      : `status = 'published', published_at = ?, ${quote(target.actorField)} = COALESCE(${quote(target.actorField)}, 'scheduled_job'), updated_at = ?`;
  const values = job.entity_type === "articles" ? [now, now, now, job.entity_id] : [now, now, job.entity_id];

  const result = await db.prepare(`UPDATE ${quote(target.table)} SET ${fields} WHERE id = ?`).bind(...values).run();
  if (changedRows(result) !== 1) {
    throw new Error(`Scheduled target not found: ${job.entity_type}/${job.entity_id}`);
  }
}

export async function runDuePublishJobs(db: SchedulerDb, options: { now?: Date; limit?: number; maxAttempts?: number } = {}): Promise<SchedulerResult> {
  const now = (options.now || new Date()).toISOString();
  const limit = Math.min(Math.max(options.limit || 20, 1), 100);
  const maxAttempts = Math.min(Math.max(options.maxAttempts || 3, 1), 10);
  const jobs = await db
    .prepare("SELECT id, entity_type, entity_id, action, attempts FROM publish_jobs WHERE status = 'pending' AND run_at <= ? ORDER BY run_at ASC LIMIT ?")
    .bind(now, limit)
    .all<PublishJobRow>();

  const result: SchedulerResult = { picked: jobs.results.length, locked: 0, completed: 0, failed: 0, retried: 0 };
  for (const job of jobs.results) {
    try {
      const locked = await lockJob(db, job.id, now);
      if (!locked) {
        continue;
      }
      result.locked += 1;
      await publishEntity(db, job, now);
      await completeJob(db, job.id, now);
      result.completed += 1;
    } catch (error) {
      const nextStatus = await failJob(db, job, error, now, maxAttempts);
      if (nextStatus === "failed") result.failed += 1;
      else result.retried += 1;
    }
  }

  return result;
}

export async function scheduled(event: ScheduledController, env: { CMS_DB?: SchedulerDb }, ctx: ExecutionContext) {
  if (!env.CMS_DB) {
    return;
  }
  ctx.waitUntil(runDuePublishJobs(env.CMS_DB, { now: new Date(event.scheduledTime) }));
}
