import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the DB layer entirely — this is a unit test of the route's query-building
// logic, not an integration test against a real Postgres instance.
const findManyMock = vi.fn().mockResolvedValue([]);
vi.mock("@/db", () => ({
  db: { query: { checkouts: { findMany: (...args: unknown[]) => findManyMock(...args) } } },
}));

// Spy on isNull/isNotNull so we can assert which branch the route actually took,
// without depending on the shape of Drizzle's internal SQL representation.
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    isNull: vi.fn(actual.isNull),
    isNotNull: vi.fn(actual.isNotNull),
  };
});

import { GET } from "./route";
import { isNull, isNotNull } from "drizzle-orm";

describe("GET /api/checkouts", () => {
  beforeEach(() => {
    findManyMock.mockClear();
    vi.mocked(isNull).mockClear();
    vi.mocked(isNotNull).mockClear();
  });

  it("without ?history, returns only active checkouts (returnedAt IS NULL)", async () => {
    const req = new NextRequest("http://localhost/api/checkouts");
    await GET(req);

    expect(isNull).toHaveBeenCalled();
    expect(isNotNull).not.toHaveBeenCalled();
  });

  it("with ?history=true, returns only returned checkouts (returnedAt IS NOT NULL) — regression test for the bug where this used to return everything", async () => {
    const req = new NextRequest("http://localhost/api/checkouts?history=true");
    await GET(req);

    expect(isNotNull).toHaveBeenCalled();
    expect(isNull).not.toHaveBeenCalled();
  });
});
