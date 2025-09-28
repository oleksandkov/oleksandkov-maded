import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGO_DB_NAME || "company_site";

let client;
let database;

export async function initDb() {
  if (database) {
    return database;
  }

  client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  database = client.db(mongoDbName);

  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database
      .collection("users_guest")
      .createIndex({ email: 1 }, { unique: true }),
    database.collection("projects").createIndex({ created_at: -1 }),
    database.collection("events").createIndex({ start_at: 1 }),
    database.collection("documents").createIndex({ created_at: -1 }),
    database.collection("dashboard_notes").createIndex({ updated_at: -1 }),
    database.collection("dashboard_codespaces").createIndex({ updated_at: -1 }),
    database
      .collection("users_guest")
      .createIndex({ verification_token: 1 }, { unique: true, sparse: true }),
    database.collection("users_guest").createIndex({ verified: 1 }),
  ]);

  console.log(`MongoDB connected to database: ${mongoDbName}`);
  return database;
}

export function getDb() {
  if (!database) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return database;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export function toObjectId(id) {
  if (!id) return null;

  if (id instanceof ObjectId) {
    return id;
  }

  if (typeof id === "string") {
    const trimmed = id.trim();
    if (!trimmed) {
      return null;
    }

    const hexMatch = trimmed.match(/^[a-f0-9]{24}$/i);
    if (hexMatch) {
      try {
        return new ObjectId(trimmed);
      } catch (err) {
        return null;
      }
    }

    const embeddedMatch = trimmed.match(
      /ObjectId\(\s*"?([a-f0-9]{24})"?\s*\)/i
    );
    if (embeddedMatch) {
      try {
        return new ObjectId(embeddedMatch[1]);
      } catch (err) {
        return null;
      }
    }
  }

  if (typeof id === "object") {
    if (id && typeof id.toHexString === "function") {
      try {
        return new ObjectId(id.toHexString());
      } catch (err) {
        return null;
      }
    }
    if (id && Object.prototype.hasOwnProperty.call(id, "_id")) {
      return toObjectId(id._id);
    }
  }

  try {
    return new ObjectId(id);
  } catch (err) {
    return null;
  }
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}

export { ObjectId };
