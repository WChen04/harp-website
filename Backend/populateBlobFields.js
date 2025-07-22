import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = process.env.NODE_ENV === "production"
  ? path.resolve(__dirname, ".env.production")
  : path.resolve(__dirname, ".env.local");

dotenv.config({ path: envPath });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Convert a name to blob format: e.g. "Jonathan Sun" → "JonathanSun.png"
function generateBlobName(name) {
  return name.replace(/\s+/g, "") + ".png";
}

async function populateMissingBlobData() {
  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT id, name, blob_name, mime_type FROM team_members`);

    let updated = 0;

    for (const row of result.rows) {
      const { id, name, blob_name, mime_type } = row;

      const newBlobName = blob_name || generateBlobName(name);
      const newMimeType = mime_type || "image/png";

      if (blob_name !== newBlobName || mime_type !== newMimeType) {
        await client.query(
          `UPDATE team_members SET blob_name = $1, mime_type = $2 WHERE id = $3`,
          [newBlobName, newMimeType, id]
        );
        console.log(`✅ Updated member ${name} with blob: ${newBlobName}, mime: ${newMimeType}`);
        updated++;
      }
    }

    console.log(`\n✅ Finished updating ${updated} rows`);
  } catch (err) {
    console.error("❌ Error populating blob fields:", err.message);
  } finally {
    client.release();
  }
}

populateMissingBlobData();
