import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const region = requiredEnv("DO_SPACES_REGION");
const endpoint = requiredEnv("DO_SPACES_ENDPOINT");
const bucket = requiredEnv("DO_SPACES_BUCKET");

export const spacesClient = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: requiredEnv("DO_SPACES_KEY"),
    secretAccessKey: requiredEnv("DO_SPACES_SECRET"),
  },
});

export async function uploadToSpaces(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: "private",
  });
  await spacesClient.send(command);
}

export function getSpacesBucket() {
  return bucket;
}

export function getSpacesFileUrl(key: string) {
  const cdnEndpoint =
    process.env.DO_SPACES_CDN_ENDPOINT ||
    `https://${bucket}.${region}.digitaloceanspaces.com`;
  return `${cdnEndpoint.replace(/\/$/, "")}/${key}`;
}

export async function getSpacesSignedUrl(key: string, expiresInSeconds = 300) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(spacesClient, command, { expiresIn: expiresInSeconds });
}


