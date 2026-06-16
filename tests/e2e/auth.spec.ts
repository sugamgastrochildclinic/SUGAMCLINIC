import { test, expect } from "@playwright/test";

/**
 * Middleware + auth gate smoke tests. These assert the security boundary the
 * middleware enforces: admin pages redirect to /login, admin APIs return 401
 * JSON (never an HTML redirect) for unauthenticated callers.
 */

test.describe("admin page protection", () => {
  test("unauthenticated /admin redirects to /login with callbackUrl", async ({ page }) => {
    const res = await page.goto("/admin");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("callbackUrl");
    expect(res?.status()).toBeLessThan(400);
  });

  test("unauthenticated nested admin page redirects to /login", async ({ page }) => {
    await page.goto("/admin/appointments");
    expect(page.url()).toContain("/login");
  });
});

test.describe("admin API protection", () => {
  test("GET /api/setup → 401 JSON when unauthenticated", async ({ request }) => {
    const res = await request.get("/api/setup");
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("POST /api/admin/migrate-patients → 401 when unauthenticated", async ({ request }) => {
    const res = await request.post("/api/admin/migrate-patients");
    expect(res.status()).toBe(401);
  });

  test("PUT /api/settings → 401 when unauthenticated", async ({ request }) => {
    const res = await request.put("/api/settings", { data: { clinicName: "Hacked" } });
    expect(res.status()).toBe(401);
  });
});

test.describe("public endpoints stay reachable", () => {
  test("GET /api/services returns 200", async ({ request }) => {
    const res = await request.get("/api/services");
    expect(res.status()).toBe(200);
  });
});

test.describe("input validation", () => {
  test("appointment booking rejects an invalid doctor id", async ({ request }) => {
    const res = await request.post("/api/appointments", {
      data: { name: "T", phone: "1234567", email: "a@b.com", date: "2099-01-01", time: "10:00 AM", doctor: "not-an-id", visitReason: "x" },
    });
    expect(res.status()).toBe(400);
  });
});
