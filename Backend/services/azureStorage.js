// Backend/services/azureStorage.js
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const AZURITE_CONNECTION_STRING = process.env.AZURITE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNo" +  // default dev key
  "BlobEndpoint=http://azurite:10000/devstoreaccount1;";

const containerName = "uploads"; // make sure this exists or handle creation

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURITE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainerExists() {
  console.log("Checking if container exists!");
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create();
    console.log(`🪣 Created container "${containerName}"`);
  }
  console.log("Container Exists");
}

export async function uploadFile(buffer, originalName, mimetype) {
  console.log("📤 Uploading to Azurite...");

  await ensureContainerExists();

  console.log("Hi");
  const blobName = `${Date.now()}-${originalName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.log("Uploading Data");
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: mimetype,
    },
  });

  console.log(`✅ Uploaded blob: ${blobName}`);

  return {
    blobName,
    url: blockBlobClient.url,
  };
}


export async function deleteFile(blobName) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const response = await blockBlobClient.deleteIfExists();
  return response.succeeded;
}

export function generateBlobUrl(blobName) {
  // For Azurite, blobs are accessible without SAS
  return `http://127.0.0.1:10000/devstoreaccount1/${containerName}/${blobName}`;
}
