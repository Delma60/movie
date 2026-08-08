// Object storage over the S3-compatible backend. All projects share one
// physical bucket; objects are namespaced by `${projectId}/${bucket}/`.
import {
  S3Client, ListObjectsV2Command, PutObjectCommand,
  DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const BUCKET = process.env.STORAGE_BUCKET!;

const globalForS3 = globalThis as unknown as { _s3?: S3Client };

export const s3 =
  globalForS3._s3 ??
  new S3Client({
    endpoint: process.env.MINIO_PUBLIC_ENDPOINT || `https://${process.env.MINIO_ENDPOINT}`,
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
  });

if (process.env.NODE_ENV !== "production") globalForS3._s3 = s3;

const prefix = (projectId: string, bucket: string) => `${projectId}/${bucket}/`;
const objectKey = (projectId: string, bucket: string, name: string) =>
  `${prefix(projectId, bucket)}${name}`;

export interface StoredObject {
  name: string;
  size: number;
  lastModified: string | null;
}

export async function listObjects(projectId: string, bucket: string): Promise<StoredObject[]> {
  const p = prefix(projectId, bucket);
  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: p }));
  return (out.Contents ?? [])
    .filter((o) => o.Key && o.Key !== p) // skip the folder placeholder
    .map((o) => ({
      name: o.Key!.slice(p.length),
      size: o.Size ?? 0,
      lastModified: o.LastModified?.toISOString() ?? null,
    }));
}

export async function putObject(
  projectId: string,
  bucket: string,
  name: string,
  body: Uint8Array,
  contentType?: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey(projectId, bucket, name),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function getPublicObjectUrl(projectId: string, bucket: string, name: string): string {
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
  if (!publicEndpoint) {
    throw new Error(
      "[velvet] MINIO_PUBLIC_ENDPOINT or MINIO_ENDPOINT is required to build public object URLs.",
    );
  }
  const baseUrl = publicEndpoint.replace(/\/+$/, "");
  return `${baseUrl}/${BUCKET}/${encodeURIComponent(projectId)}/${encodeURIComponent(bucket)}/${encodeURIComponent(name)}`;
}

export async function uploadObject(
  projectId: string,
  bucket: string,
  name: string,
  file: File,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  await putObject(projectId, bucket, name, bytes, file.type || "application/octet-stream");
  return getPublicObjectUrl(projectId, bucket, name);
}

export async function removeObject(projectId: string, bucket: string, name: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey(projectId, bucket, name) }));
}

/** Delete every object under a logical bucket (used when the bucket is removed). */
export async function emptyBucket(projectId: string, bucket: string): Promise<void> {
  const objects = await listObjects(projectId, bucket);
  if (objects.length === 0) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objects.map((o) => ({ Key: objectKey(projectId, bucket, o.name) })) },
    }),
  );
}

/** Short-lived signed download URL. */
export async function signedDownloadUrl(
  projectId: string,
  bucket: string,
  name: string,
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: objectKey(projectId, bucket, name) }),
    { expiresIn: 300 },
  );
}

/**
 * Derives the storage key back out of a URL previously built by
 * getPublicObjectUrl() (`${endpoint}/${BUCKET}/${projectId}/${bucket}/${name}`)
 * and returns a freshly-signed URL for it. Lets existing DB rows — which
 * store the old-style "public" URL — keep working unchanged even though the
 * bucket is actually Private; no backfill needed.
 *
 * expiresIn defaults to 6h rather than the 300s used elsewhere, since a
 * <video> tag reuses the same URL for every Range request over the whole
 * playback session — a short-lived URL would break mid-playback on
 * anything longer than a few minutes.
 */
export async function signedPlaybackUrl(
  storedUrl: string,
  expiresIn = 6 * 60 * 60,
): Promise<string | null> {
  let key: string;
  try {
    const url = new URL(storedUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] !== BUCKET) return null;
    key = segments.slice(1).map(decodeURIComponent).join("/");
  } catch {
    return null;
  }

  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  );
}
