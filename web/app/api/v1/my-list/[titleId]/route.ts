import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api-auth";
import { removeFromMyList } from "@/lib/my-list";

export const DELETE = apiRoute<{ titleId: string }>(async (_req, { session, params }) => {
  await removeFromMyList(session!.sub, params.titleId);
  return NextResponse.json({ ok: true });
}, { requireAuth: true });
