import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { database } from "./config";

const client = postgres(database.url, {
  max: 1,
  ssl: "require",
});
const db = drizzle(client);

const main = async () => {
  try {
    await db.execute(sql`DROP SCHEMA drizzle CASCADE;`);

    setTimeout(() => {
      console.log("10 seconds have passed");
    }, 10000);

    await db.execute(sql`DROP SCHEMA public CASCADE;`);

    await db.execute(sql`CREATE SCHEMA public;`);
    await client.end();
  } catch (error) {
    console.log(error);
  } finally {
    process.exit(0);
  }
};

main();
