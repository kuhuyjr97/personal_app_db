import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
  code: text("code").notNull().unique(),
  password: text("password"),
  position: text("position"),
  role: text("role"),
  ...base_schema_columns,
});

