import { timestamp } from "drizzle-orm/pg-core";

export const base_schema_columns = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
};
