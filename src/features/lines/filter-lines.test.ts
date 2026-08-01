import { describe, expect, it } from "vitest";
import type { Line } from "@/lib/domain/types";
import { filterLinesByTitle } from "./filter-lines";

function line(partial: Partial<Line> & Pick<Line, "id" | "title">): Line {
  return {
    ownerId: "user-1",
    description: null,
    color: "#336699",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    eventCount: 0,
    ...partial,
  };
}

describe("filterLinesByTitle", () => {
  const lines = [
    line({ id: "1", title: "Cardiology" }),
    line({ id: "2", title: "Dental care" }),
    line({ id: "3", title: "Cardiology follow-up" }),
  ];

  it("returns all lines when the query is empty or whitespace", () => {
    expect(filterLinesByTitle(lines, "")).toEqual(lines);
    expect(filterLinesByTitle(lines, "   ")).toEqual(lines);
  });

  it("filters case-insensitively by title substring", () => {
    expect(filterLinesByTitle(lines, "cardio").map((l) => l.id)).toEqual(["1", "3"]);
    expect(filterLinesByTitle(lines, "DENTAL").map((l) => l.id)).toEqual(["2"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterLinesByTitle(lines, "orthopedics")).toEqual([]);
  });
});
