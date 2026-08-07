import { describe, expect, it, vi } from "vitest";
import { driveErrorResponse, safeReturnTo } from "./api";

const ORIGIN = "https://app.example";
/** What the redirect will actually resolve to — the thing that matters. */
const resolved = (value: string | null | undefined) =>
  new URL(safeReturnTo(value, ORIGIN), ORIGIN).href;

describe("safeReturnTo", () => {
  it("keeps a same-origin path, with query and hash", () => {
    expect(safeReturnTo("/plan", ORIGIN)).toBe("/plan");
    expect(safeReturnTo("/settings?sync=ok#data", ORIGIN)).toBe(
      "/settings?sync=ok#data",
    );
  });

  it("reduces an absolute same-origin URL to its path", () => {
    expect(safeReturnTo(`${ORIGIN}/stats`, ORIGIN)).toBe("/stats");
  });

  it("falls back to / for anything missing", () => {
    expect(safeReturnTo(null, ORIGIN)).toBe("/");
    expect(safeReturnTo(undefined, ORIGIN)).toBe("/");
    expect(safeReturnTo("", ORIGIN)).toBe("/");
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["absolute http", "http://evil.com"],
    ["absolute https", "https://evil.com/path"],
    // The bypass a startsWith("//") check misses: the URL parser reads a
    // backslash as a slash, so this used to resolve to https://evil.com/.
    ["backslash authority", "/\\evil.com"],
    ["mixed slash authority", "/\\/evil.com"],
    ["backslash pair", "\\\\evil.com"],
    ["uppercase scheme", "HTTPS://evil.com"],
    ["scheme with whitespace", " https://evil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>alert(1)</script>"],
    ["userinfo trick", "https://app.example@evil.com"],
  ])("never leaves the origin: %s", (_label, value) => {
    expect(resolved(value)).toMatch(/^https:\/\/app\.example\//);
  });

  it("is not fooled by a lookalike host", () => {
    expect(resolved("https://app.example.evil.com/x")).toBe(`${ORIGIN}/`);
  });
});

describe("driveErrorResponse", () => {
  const named = (name: string) => {
    const e = new Error("boom");
    e.name = name;
    return e;
  };

  it("maps auth failures to 401 so the client offers Reconnect", async () => {
    for (const name of ["RefreshError", "DriveUnauthorizedError"]) {
      const res = driveErrorResponse(named(name));
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    }
  });

  it("maps anything else to 500 and logs it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = driveErrorResponse(new Error("disk on fire"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "server_error" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles a non-Error throw without crashing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = driveErrorResponse("just a string");
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
});
