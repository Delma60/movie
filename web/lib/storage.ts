import { db, storageBuckets, type StorageBucket } from "@/lib/db";
import { and, eq, asc } from "drizzle-orm";
import { emptyBucket } from "@/lib/s3";

const BUCKET_NAME = /^[a-z0-9][a-z0-9-]{1,62}$/;

export async function listBuckets(projectId: string): Promise<StorageBucket[]> {
  return db
    .select()
    .from(storageBuckets)
    .where(eq(storageBuckets.projectId, projectId))
    .orderBy(asc(storageBuckets.name));
}

export async function getBucket(projectId: string, bucketId: string): Promise<StorageBucket | null> {
  const [b] = await db
    .select()
    .from(storageBuckets)
    .where(and(eq(storageBuckets.id, bucketId), eq(storageBuckets.projectId, projectId)))
    .limit(1);
  return b ?? null;
}

export async function createBucket(
  projectId: string,
  name: string,
  isPublic: boolean,
): Promise<StorageBucket> {
  const clean = name.trim().toLowerCase();
  if (!BUCKET_NAME.test(clean)) {
    throw new Error("Bucket name must be lowercase letters, numbers and hyphens (2–63 chars).");
  }
  const [bucket] = await db
    .insert(storageBuckets)
    .values({ projectId, name: clean, public: isPublic })
    .returning();
  return bucket;
}

export async function deleteBucket(projectId: string, bucketId: string): Promise<void> {
  const bucket = await getBucket(projectId, bucketId);
  if (!bucket) return;
  await emptyBucket(projectId, bucket.name);
  await db.delete(storageBuckets).where(eq(storageBuckets.id, bucketId));
}
