import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";
import { relations } from "drizzle-orm";

import { user_tokens } from "./user_token";

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  ...base_schema_columns,
});

export const user_relations = relations(user, ({ one, many }) => ({
  userToken: many(user_tokens),
}));
