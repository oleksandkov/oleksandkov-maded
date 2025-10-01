import fs from "fs/promises";
import path from "path";

async function ensureDirectory(relativePath) {
  const directory = path.join(process.cwd(), relativePath);
  await fs.mkdir(directory, { recursive: true });
}

async function main() {
  const frontendDir = path.join(process.cwd(), "frontend");
  const stats = await fs.stat(frontendDir).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    throw new Error(
      "Missing frontend assets directory. Expected to find ./frontend."
    );
  }

  await ensureDirectory("uploads");
  await ensureDirectory(path.join("uploads", "articles"));
  await ensureDirectory(path.join("uploads", "podcasts"));
  await ensureDirectory(path.join("uploads", "projects"));

  console.log("Build step completed. Static directories are ready.");
}

main().catch((error) => {
  console.error("Build step failed", error);
  process.exit(1);
});
