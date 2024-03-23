import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";


import { base_schema_columns } from "@/schemas/base_schemas";
export const user_tokens = pgTable("user_tokens", {
    id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name"),
  site_code: text('site_code'),
  token: text("token").notNull(),
  ...base_schema_columns,
});

