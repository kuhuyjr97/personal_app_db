import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { database } from "./config";

// FIXME: https://orm.drizzle.team/kit-docs/commands#prototype--push

const client = postgres(database.url, {
  max: 1,
  ssl: "require",
});
const db = drizzle(client);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    await client.end();
  } catch (error) {
    console.log(error);
  } finally {
    process.exit(0);
  }
};

main();
