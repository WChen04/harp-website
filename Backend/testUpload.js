// testUpload.js
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";

const connectionString = process.env.AZURITE_CONNECTION_STRING ||
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNo==;" +
  "BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;";

const containerName = "uploads";

const upload = async () => {
  const service = BlobServiceClient.fromConnectionString(connectionString);
  const container = service.getContainerClient(containerName);
  const blobName = `test-${Date.now()}.txt`;

  const blob = container.getBlockBlobClient(blobName);
  const buffer = Buffer.from("Hello Azurite");

  await blob.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: "text/plain",
    },
  });

  console.log("✅ Upload complete:", blob.url);
};

upload().catch(console.error);
