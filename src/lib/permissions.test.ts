import { describe, it, expect } from "vitest";
import { can } from "./permissions";
import type { ActionType } from "./types";

const ALL: ActionType[] = ["approve", "remove", "escalate", "ban"];

describe("can()", () => {
  it("a viewer cannot perform any action", () => {
    for (const action of ALL) expect(can("viewer", action)).toBe(false);
  });

  it("a moderator can approve/remove/escalate but cannot ban", () => {
    expect(can("moderator", "approve")).toBe(true);
    expect(can("moderator", "remove")).toBe(true);
    expect(can("moderator", "escalate")).toBe(true);
    expect(can("moderator", "ban")).toBe(false);
  });

  it("an admin can perform every action, including ban", () => {
    for (const action of ALL) expect(can("admin", action)).toBe(true);
  });

  it("a missing role can never act", () => {
    expect(can(null, "approve")).toBe(false);
    expect(can(undefined, "ban")).toBe(false);
  });
});
