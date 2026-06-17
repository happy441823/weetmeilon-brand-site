#!/usr/bin/env node
import { spawn } from "node:child_process";

const port = Number(process.env.E2E_PORT || 3217);
const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await wait(500);
  }
  throw new Error("Next server did not start in time.");
}

async function expectStatus(path, status = 200) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== status) {
    throw new Error(`${path} expected ${status}, got ${response.status}`);
  }
  return response;
}

async function expectNoindex(path, status = 200) {
  const response = await expectStatus(path, status);
  const robots = response.headers.get("x-robots-tag") || "";
  const cache = response.headers.get("cache-control") || "";
  if (!/noindex/i.test(robots)) {
    throw new Error(`${path} must return x-robots-tag noindex`);
  }
  if (!/no-store/i.test(cache)) {
    throw new Error(`${path} must return cache-control no-store`);
  }
}

async function main() {
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    env: { ...process.env, PORT: String(port), CMS_PUBLIC_D1_READS: "false" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const logs = [];
  server.stdout.on("data", (chunk) => logs.push(String(chunk)));
  server.stderr.on("data", (chunk) => logs.push(String(chunk)));

  try {
    await waitForServer();
    await expectStatus("/");
    await expectStatus("/products");
    await expectStatus("/products/native-skin-silicone-soft");
    await expectStatus("/articles");
    await expectStatus("/articles/native-skin-silicone-meaning");
    await expectStatus("/faq");
    await expectStatus("/brand");
    await expectStatus("/guide");
    await expectStatus("/sitemap.xml");
    await expectStatus("/robots.txt");
    await expectStatus("/articles/how-to-choose-three-products", 404);

    await expectNoindex("/admin");
    await expectNoindex("/admin/products");
    await expectNoindex("/admin/articles");
    await expectNoindex("/admin/pages");
    await expectNoindex("/admin/homepage");
    await expectNoindex("/admin/faqs");
    await expectNoindex("/admin/navigation");
    await expectNoindex("/admin/footer");
    await expectNoindex("/api/admin/schema", 401);

    console.log("E2E smoke passed");
  } finally {
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      server.kill("SIGTERM");
    }
    await wait(300);
    if (process.env.E2E_DEBUG === "true") {
      console.log(logs.join(""));
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
