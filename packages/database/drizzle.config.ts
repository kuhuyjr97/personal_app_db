import type { Config } from "drizzle-kit";

import { database } from "./src/config";

export default {
  schema: "./src/schemas/*",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: database.url + `?sslmode=require`,
  },
} satisfies Config;
