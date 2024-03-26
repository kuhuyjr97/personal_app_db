import { boolean, pgTable, serial, text,integer, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const daily_job = pgTable("daily_job", {
  id: serial("id").primaryKey(),
  type: text("type"),
  where: text("where"),
  name: text("name"),
  amount: integer("amount"),
  ...base_schema_columns,
});

