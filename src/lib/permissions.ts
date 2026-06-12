import type { Role, ActionType, Status } from "./types";

/**
 * Whether a role may perform an action. This mirrors the Supabase Row-Level
 * Security policy exactly: moderators and admins can act on content; only
 * admins can ban a user. The DB enforces the same rules, so this is the
 * client-side guard for showing/hiding controls — not the only line of defense.
 */
export function can(role: Role | null | undefined, action: ActionType): boolean {
  if (!role) return false;
  if (action === "ban") return role === "admin";
  return role === "moderator" || role === "admin";
}

/** The status an item moves to after a given action. */
export const ACTION_RESULT: Record<ActionType, Status> = {
  approve: "approved",
  remove: "removed",
  escalate: "escalated",
  ban: "removed",
};

export const ACTION_LABELS: Record<ActionType, string> = {
  approve: "Approve",
  remove: "Remove",
  escalate: "Escalate",
  ban: "Ban user",
};
