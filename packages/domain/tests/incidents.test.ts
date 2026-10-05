// Input contracts for incidents: the query params of GET /api/v1/incidents/nearby,
// the [id] of GET /api/v1/incidents/[id], and the AI ingest payload that creates
// an incident. Verifies ranges, defaults, and that bad input is rejected.
import { describe, it, expect } from "vitest";
import {
  ListNearbyIncidentsSchema,
  GetIncidentByIdSchema,
  CreateIncidentSchema,
} from "../src/zod_schemas/incidents";

describe("ListNearbyIncidentsSchema", () => {
  it("turns query-string values into numbers", () => {
    const result = ListNearbyIncidentsSchema.safeParse({ latitude: "40.71", longitude: "-74.00" });
    expect(result.success).toBe(true);
    expect(result.data?.latitude).toBe(40.71);
    expect(result.data?.longitude).toBe(-74);
  });

  it("fills in the default radius and limit", () => {
    const result = ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0" });
    expect(result.data?.radiusInMiles).toBe(10);
    expect(result.data?.limit).toBe(20);
  });

  it("rejects coordinates out of range", () => {
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "91", longitude: "0" }).success).toBe(false);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "-181" }).success).toBe(false);
  });

  it("rejects a missing or non-numeric location", () => {
    expect(ListNearbyIncidentsSchema.safeParse({}).success).toBe(false);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "abc", longitude: "0" }).success).toBe(false);
  });

  it("caps the radius at 50 miles and the limit at 100", () => {
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", radiusInMiles: "50" }).success).toBe(true);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", radiusInMiles: "51" }).success).toBe(false);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", limit: "100" }).success).toBe(true);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", limit: "101" }).success).toBe(false);
  });

  it("rejects a zero or fractional limit", () => {
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", limit: "0" }).success).toBe(false);
    expect(ListNearbyIncidentsSchema.safeParse({ latitude: "0", longitude: "0", limit: "2.5" }).success).toBe(false);
  });
});

describe("GetIncidentByIdSchema", () => {
  it("accepts a cuid", () => {
    expect(GetIncidentByIdSchema.safeParse({ id: "clx0000000000000000000000" }).success).toBe(true);
  });

  it("rejects ids that are not cuids", () => {
    expect(GetIncidentByIdSchema.safeParse({ id: "abc" }).success).toBe(false);
    expect(GetIncidentByIdSchema.safeParse({ id: "" }).success).toBe(false);
    expect(GetIncidentByIdSchema.safeParse({ id: "undefined" }).success).toBe(false);
  });
});

describe("CreateIncidentSchema", () => {
  const valid = {
    title: "Structure fire",
    category: "FIRE",
    severity: "HIGH",
    latitude: 40.71,
    longitude: -74.0,
  };

  it("accepts a valid incident and defaults the radius to 5 miles", () => {
    const result = CreateIncidentSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.radiusInMiles).toBe(5);
  });

  it("rejects a category or severity that is not in the enum", () => {
    expect(CreateIncidentSchema.safeParse({ ...valid, category: "ALIENS" }).success).toBe(false);
    expect(CreateIncidentSchema.safeParse({ ...valid, severity: "EXTREME" }).success).toBe(false);
  });

  it("rejects coordinates sent as strings", () => {
    expect(CreateIncidentSchema.safeParse({ ...valid, latitude: "40.71" }).success).toBe(false);
  });

  it("rejects an empty title or one over 100 characters", () => {
    expect(CreateIncidentSchema.safeParse({ ...valid, title: "   " }).success).toBe(false);
    expect(CreateIncidentSchema.safeParse({ ...valid, title: "a".repeat(101) }).success).toBe(false);
  });

  it("treats an empty or whitespace-only message as absent", () => {
    const result = CreateIncidentSchema.safeParse({ ...valid, message: "   " });
    expect(result.success).toBe(true);
    expect(result.data?.message).toBeUndefined();
  });
});
