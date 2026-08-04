// web/lib/actions/my-list.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { addToMyList, removeFromMyList } from "@/lib/my-list";

export async function addToMyListAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const titleId = String(formData.get("titleId") ?? "");
  if (!titleId) return;

  await addToMyList(userId, titleId);
  revalidatePath("/my-list");
}

export async function removeFromMyListAction(titleId: string): Promise<void> {
  const userId = await requireUserId();
  await removeFromMyList(userId, titleId);
  revalidatePath("/my-list");
}
