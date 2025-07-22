// Backend/services/azureStorage.js
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = process.env.NODE_ENV === "production"
  ? path.resolve(__dirname, ".env.production")
  : path.resolve(__dirname, ".env.local");

dotenv.config({ path: envPath });


const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const AZURE_ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME; // Add this to .env if not already
const VALID_CONTAINERS = ["articleimages", "profileimages", "aboutimages"];

if (!AZURE_CONNECTION_STRING || !AZURE_ACCOUNT_NAME) {
  throw new Error("Missing AZURE_CONNECTION_STRING or AZURE_ACCOUNT_NAME in environment variables.");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);

/**
 * Uploads a file to the specified Azure Blob container.
 */
export async function uploadFile(buffer, originalName, mimetype, containerName) {
  if (!VALID_CONTAINERS.includes(containerName)) {
    throw new Error(`Invalid container: ${containerName}`);
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobName = `${Date.now()}-${uuidv4()}-${originalName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: mimetype,
    },
  });

  console.log(`✅ Uploaded blob: ${blobName} to container: ${containerName}`);

  return {
    blobName,
    url: generateBlobUrl(blobName, containerName),
  };
}

/**
 * Deletes a file from the specified container.
 */
export async function deleteFile(blobName, containerName) {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const response = await blockBlobClient.deleteIfExists();
  return response.succeeded;
}

/**
 * Generates a public blob URL (use SAS tokens for private blobs).
 */
export function generateBlobUrl(blobName, containerName) {
  return `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;
}
