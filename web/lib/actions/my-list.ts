// web/lib/actions/my-list.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { removeFromMyList } from "@/lib/my-list";

export async function removeFromMyListAction(titleId: string): Promise<void> {
  const userId = await requireUserId();
  await removeFromMyList(userId, titleId);
  revalidatePath("/my-list");
}
