import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Cloudflare R2 uses the S3-compatible API
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
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
