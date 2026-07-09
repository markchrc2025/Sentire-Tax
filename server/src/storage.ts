// storage.ts — COR file storage on S3-compatible object storage
// (Sliplane Object Storage). Objects live at "<owner_id>/<taxpayer_id>",
// mirroring the layout the Supabase 'cor' bucket used.

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

export const COR_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const COR_ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

const s3 = new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: { accessKeyId: env.s3AccessKeyId, secretAccessKey: env.s3SecretAccessKey },
  forcePathStyle: true, // S3-compatible providers generally need path-style
});

export const corKey = (ownerId: string, taxpayerId: string): string => `${ownerId}/${taxpayerId}`;

export async function putCor(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({ Bucket: env.s3Bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function corSignedUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }), { expiresIn: 3600 });
}

export async function deleteCor(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
}
