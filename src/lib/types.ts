export type Role = "viewer" | "moderator" | "admin";
export type ActionType = "approve" | "remove" | "escalate" | "ban";
export type Status = "pending" | "approved" | "removed" | "escalated";
export type Severity = "low" | "medium" | "high";
export type ContentType = "post" | "comment" | "profile";

export interface FlaggedItem {
  id: string;
  content: string;
  content_type: ContentType;
  author: string | null;
  reason: string;
  reporter: string | null;
  severity: Severity;
  status: Status;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ModerationAction {
  id: string;
  item_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  action: ActionType;
  note: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
}
