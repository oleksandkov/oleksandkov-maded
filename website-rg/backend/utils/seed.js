import bcrypt from "bcryptjs";
import { closeDb, getCollection, initDb } from "../db.js";

async function seed() {
  let exitCode = 0;
  try {
    await initDb();

    const admins = [
      {
        email: "oleksandr.kov.dm@gmail.com",
        password: "admin1",
        name: "Oleksandr",
        surname: "Kovalenko",
      },
      {
        email: "admin2@company.local",
        password: "admin2",
        name: "Kateryna",
        surname: "Sydorenko",
      },
      {
        email: "admin3@company.local",
        password: "admin3",
        name: "Andrii",
        surname: "Melnyk",
      },
    ];

    const usersCollection = getCollection("users");

    for (const { email, password, name, surname } of admins) {
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await usersCollection.findOne({
          email: normalizedEmail,
        });

        if (existingUser) {
          console.log("Admin user already exists:", email);
          continue;
        }

        const hash = bcrypt.hashSync(password, 10);
        const now = new Date();
        const fullName =
          [name, surname].filter((part) => part && part.length).join(" ") ||
          null;
        const result = await usersCollection.insertOne({
          email: normalizedEmail,
          password_hash: hash,
          role: "admin",
          name: name || null,
          surname: surname || null,
          full_name: fullName,
          created_at: now,
        });

        console.log(
          "Seeded admin user:",
          email,
          "password:",
          password,
          "id:",
          result.insertedId.toString()
        );
      } catch (err) {
        if (err?.code === 11000) {
          console.log("Admin user already exists:", email);
        } else {
          console.error("Failed to insert admin", email, err);
        }
      }
    }

    console.log("Seeding completed successfully");
  } catch (err) {
    exitCode = 1;
    console.error("Seeding failed:", err);
  } finally {
    await closeDb().catch((err) => {
      console.error("Failed to close MongoDB connection", err);
    });
    process.exit(exitCode);
  }
}

seed();
