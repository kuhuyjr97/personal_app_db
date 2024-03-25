import { boolean, pgTable, serial, text,integer, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const money = pgTable("money", {
  id: serial("id").primaryKey(),

  ...base_schema_columns,
});

