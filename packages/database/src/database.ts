import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { database } from "./config";

let client: Pool | null = null;

export const createDatabaseConnection = () => {
  if (!client) {
    client = new Pool({
      connectionString: database.url,
      ssl: true,
    });
  }

  return drizzle(client);
};

export const disconnectDatabase = async () => {
  if (client) {
    await client.end();
    client = null;
  }
};
