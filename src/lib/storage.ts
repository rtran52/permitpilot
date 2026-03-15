import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Cloudflare R2 uses the S3-compatible API.
// forcePathStyle puts the bucket name in the URL path instead of the subdomain:
//   virtual-hosted (broken): https://<bucket>.<account>.r2.cloudflarestorage.com/key
//   path-style (correct):    https://<account>.r2.cloudflarestorage.com/<bucket>/key
// Multi-level subdomains on *.r2.cloudflarestorage.com cause ERR_SSL_VERSION_OR_CIPHER_MISMATCH.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  // AWS SDK v3 ≥ 3.477 adds CRC32 checksums to PutObject by default.
  // R2 does not implement this AWS extension and rejects those requests.
  // "WHEN_REQUIRED" restores pre-3.477 behaviour: checksums only when
  // the operation explicitly requires them.
  requestChecksumCalculation: "WHEN_REQUIRED",
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export function buildFileKey(caseId: string, docType: string, filename: string) {
  const ext = filename.split(".").pop() ?? "bin";
  return `cases/${caseId}/${docType}/${randomUUID()}.${ext}`;
}

export async function generatePresignedUploadUrl(fileKey: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });
  // 15-minute window for the upload
  const url = await getSignedUrl(r2, command, { expiresIn: 900 });
  return url;
}

export function getPublicUrl(fileKey: string) {
  return `${PUBLIC_URL}/${fileKey}`;
}
