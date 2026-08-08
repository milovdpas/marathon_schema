import { describe, expect, it } from "vitest";
import { decideSync } from "@/lib/drive/sync-decision";

const remote = (modifiedTime: string, id = "file-1") => ({ id, modifiedTime });
const T1 = "2026-08-01T10:00:00.000Z";
const T2 = "2026-08-02T10:00:00.000Z";

describe("decideSync", () => {
  describe("no file on Drive yet", () => {
    it("creates one when there is a plan to upload", () => {
      expect(decideSync({ localModified: T1, hasPlan: true, remote: null })).toEqual({
        action: "create",
      });
    });

    it("creates nothing when there is no plan", () => {
      // An empty export would be a file that later looks like real data.
      expect(decideSync({ localModified: T1, hasPlan: false, remote: null })).toEqual({
        action: "skip",
      });
    });
  });

  describe("newest wins", () => {
    it("pulls when Drive is ahead", () => {
      expect(
        decideSync({ localModified: T1, hasPlan: true, remote: remote(T2) }),
      ).toEqual({ action: "pull", fileId: "file-1" });
    });

    it("pushes when local is ahead", () => {
      expect(
        decideSync({ localModified: T2, hasPlan: true, remote: remote(T1) }),
      ).toEqual({ action: "push", fileId: "file-1" });
    });

    it("just records the file id when the timestamps match", () => {
      expect(
        decideSync({ localModified: T1, hasPlan: true, remote: remote(T1) }),
      ).toEqual({ action: "adopt", fileId: "file-1" });
    });

    it("compares sub-second precision correctly", () => {
      // RFC 3339 is fixed-width, so a plain string compare is chronological.
      const a = "2026-08-01T10:00:00.001Z";
      const b = "2026-08-01T10:00:00.002Z";
      expect(decideSync({ localModified: a, hasPlan: true, remote: remote(b) }).action)
        .toBe("pull");
      expect(decideSync({ localModified: b, hasPlan: true, remote: remote(a) }).action)
        .toBe("push");
    });
  });

  describe("a fresh install never clobbers Drive", () => {
    it.each([["empty string", ""], ["null", null], ["undefined", undefined]])(
      "pulls when lastModified is %s",
      (_label, localModified) => {
        expect(
          decideSync({ localModified, hasPlan: false, remote: remote(T1) }),
        ).toEqual({ action: "pull", fileId: "file-1" });
      },
    );

    it("still pulls even if a plan was already seeded locally", () => {
      // The seeded example plan is not the user's training, and it has no
      // lastModified — Drive must win.
      expect(
        decideSync({ localModified: "", hasPlan: true, remote: remote(T1) }).action,
      ).toBe("pull");
    });
  });

  describe("never uploads an empty export over real data", () => {
    it("adopts instead of pushing when local is ahead but has no plan", () => {
      // Deleting the last plan stamps a fresh lastModified, then re-seeds
      // asynchronously. A reconcile in that window used to push "" to Drive.
      expect(
        decideSync({ localModified: T2, hasPlan: false, remote: remote(T1) }),
      ).toEqual({ action: "adopt", fileId: "file-1" });
    });

    it("still pulls in that window if Drive happens to be ahead", () => {
      expect(
        decideSync({ localModified: T1, hasPlan: false, remote: remote(T2) }).action,
      ).toBe("pull");
    });
  });

  it("carries the remote file id through every branch that has one", () => {
    for (const [local, hasPlan] of [
      [T1, true],
      [T2, true],
      [T2, false],
    ] as const) {
      const out = decideSync({ localModified: local, hasPlan, remote: remote(T1, "abc") });
      expect(out).toHaveProperty("fileId", "abc");
    }
  });
});
