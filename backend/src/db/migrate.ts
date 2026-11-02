import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { db, pool } from "./index.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}

// Run directly: `npm run db:migrate`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => console.log("Migrations applied"))
    .catch((err) => {
      console.error("Migration failed", err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
