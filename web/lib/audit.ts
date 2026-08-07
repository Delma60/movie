"use server";

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditAction =
  | "title.created"
  | "title.updated"
  | "title.status_changed"
  | "episode.created"
  | "episode.updated"
  | "episode.deleted"
  | "episode.reordered"
  | "episode.video_attached"
  | "video.attached"
  | "video.status_changed"
  | "ad.created"
  | "ad.active_toggled"
  | "subscription.created"
  | "subscription.status_changed"
  | "user.role_changed";

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

interface LogAdminActionInput {
  actor: AuditActor;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAdminAction({
  actor,
  action,
  targetType,
  targetId = null,
  targetLabel = null,
  metadata = null,
}: LogAdminActionInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action,
      targetType,
      targetId,
      targetLabel,
      metadata,
    });
  } catch (err) {
    // Never throw from logging — it should not block the originating action.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write audit log:", err);
  }
}
