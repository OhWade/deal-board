import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/car_deal_tracker_test";

export default defineConfig({
  test: {
    env: { NODE_ENV: "test", DATABASE_URL: TEST_DATABASE_URL },
    globalSetup: ["./tests/globalSetup.ts"],
    // Integration tests share one database, so run files one at a time
    fileParallelism: false,
  },
});
