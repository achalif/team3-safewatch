// Request-body contract for POST /api/v1/alerts (SOS trigger). Verifies that
// CreateAlertSchema accepts only in-range coordinates and an optional message,
// matching docs/specs/alerts/trigger-sos.md.
import { describe, it, expect } from "vitest";
import { CreateAlertSchema } from "../src/zod_schemas/alerts";

describe("CreateAlertSchema", () => {
  it("accepts valid coordinates with no message", () => {
    const result = CreateAlertSchema.safeParse({ latitude: 40.7128, longitude: -74.006 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ latitude: 40.7128, longitude: -74.006 });
  });

  it("accepts the boundary values", () => {
    expect(CreateAlertSchema.safeParse({ latitude: 90, longitude: 180 }).success).toBe(true);
    expect(CreateAlertSchema.safeParse({ latitude: -90, longitude: -180 }).success).toBe(true);
  });

  it("rejects latitude outside -90 to 90", () => {
    expect(CreateAlertSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
    expect(CreateAlertSchema.safeParse({ latitude: -91, longitude: 0 }).success).toBe(false);
  });

  it("rejects longitude outside -180 to 180", () => {
    expect(CreateAlertSchema.safeParse({ latitude: 0, longitude: 181 }).success).toBe(false);
    expect(CreateAlertSchema.safeParse({ latitude: 0, longitude: -181 }).success).toBe(false);
  });

  it("rejects a missing coordinate", () => {
    expect(CreateAlertSchema.safeParse({ latitude: 40.7128 }).success).toBe(false);
    expect(CreateAlertSchema.safeParse({ longitude: -74.006 }).success).toBe(false);
  });

  it("rejects coordinates that are not numbers", () => {
    expect(CreateAlertSchema.safeParse({ latitude: "40.7128", longitude: -74.006 }).success).toBe(false);
    expect(CreateAlertSchema.safeParse({ latitude: null, longitude: -74.006 }).success).toBe(false);
  });

  it("trims the message", () => {
    const result = CreateAlertSchema.safeParse({ latitude: 0, longitude: 0, message: "  help  " });
    expect(result.data?.message).toBe("help");
  });

  it("treats an empty or whitespace-only message as absent", () => {
    const empty = CreateAlertSchema.safeParse({ latitude: 0, longitude: 0, message: "" });
    const spaces = CreateAlertSchema.safeParse({ latitude: 0, longitude: 0, message: "   " });
    expect(empty.success).toBe(true);
    expect(spaces.success).toBe(true);
    expect(empty.data?.message).toBeUndefined();
    expect(spaces.data?.message).toBeUndefined();
  });

  it("accepts a 500-character message and rejects 501", () => {
    const ok = { latitude: 0, longitude: 0, message: "a".repeat(500) };
    const tooLong = { latitude: 0, longitude: 0, message: "a".repeat(501) };
    expect(CreateAlertSchema.safeParse(ok).success).toBe(true);
    expect(CreateAlertSchema.safeParse(tooLong).success).toBe(false);
  });

  it("drops fields the client is not allowed to send", () => {
    const result = CreateAlertSchema.safeParse({
      latitude: 0,
      longitude: 0,
      userId: "someone-else",
      severity: "INFO",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ latitude: 0, longitude: 0 });
  });
});
