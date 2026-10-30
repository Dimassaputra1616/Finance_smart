import { createHash, createHmac } from "crypto";

/**
 * Utilitas Object Storage S3 murni untuk Neon Bucket (`assets`).
 *
 * Menggunakan AWS Signature Version 4 bawaan Node.js `crypto` sehingga
 * tidak memerlukan paket dependensi eksternal (@aws-sdk/client-s3).
 * Kompatibel penuh dengan endpoint Neon Object Storage (`AWS_ENDPOINT_URL_S3`).
 */

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
}

export function getNeonStorageConfig(): S3Config | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const bucket = "assets";

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    endpoint: endpoint.replace(/\/+$/, ""),
    region,
    bucket,
  };
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function hmacHex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data, "utf8").digest("hex");
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmac("AWS4" + key, dateStamp);
  const kRegion = createHmac("sha256", kDate).update(regionName, "utf8").digest();
  const kService = createHmac("sha256", kRegion).update(serviceName, "utf8").digest();
  const kSigning = createHmac("sha256", kService).update("aws4_request", "utf8").digest();
  return kSigning;
}

/**
 * Unggah berkas ke Neon S3 Object Storage (`assets`).
 */
export async function uploadToNeonStorage(
  key: string,
  buffer: Buffer | Uint8Array,
  contentType: string = "application/octet-stream",
): Promise<boolean> {
  const config = getNeonStorageConfig();
  if (!config) return false;

  const bodyBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const cleanKey = key.replace(/^\/+/, "");
  const urlObj = new URL(`${config.endpoint}/${config.bucket}/${cleanKey}`);
  const host = urlObj.host;
  const canonicalUri = `/${config.bucket}/${cleanKey}`;
  const payloadHash = sha256(bodyBuffer);

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");

  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, config.region, "s3");
  const signature = hmacHex(signingKey, stringToSign);
  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(urlObj.toString(), {
      method: "PUT",
      headers: {
        "content-type": contentType,
        host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authHeader,
      },
      body: new Uint8Array(bodyBuffer),
    });
    return res.ok;
  } catch (error) {
    console.error("Gagal mengunggah berkas ke Neon Object Storage:", error);
    return false;
  }
}

/**
 * Ambil berkas dari Neon S3 Object Storage (`assets`).
 */
export async function readFromNeonStorage(key: string): Promise<Buffer | null> {
  const config = getNeonStorageConfig();
  if (!config) return null;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const cleanKey = key.replace(/^\/+/, "");
  const urlObj = new URL(`${config.endpoint}/${config.bucket}/${cleanKey}`);
  const host = urlObj.host;
  const canonicalUri = `/${config.bucket}/${cleanKey}`;
  const payloadHash = sha256("");

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = ["GET", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");

  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, config.region, "s3");
  const signature = hmacHex(signingKey, stringToSign);
  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const res = await fetch(urlObj.toString(), {
      method: "GET",
      headers: {
        host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        Authorization: authHeader,
      },
    });

    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Gagal membaca berkas dari Neon Object Storage:", error);
    return null;
  }
}
