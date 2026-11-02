// Runs once before the suite: point at the test DB and apply migrations
export default async function setup() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/car_deal_tracker_test";

  const { runMigrations } = await import("../src/db/migrate.js");
  const { pool } = await import("../src/db/index.js");
  await runMigrations();
  await pool.end();
}
