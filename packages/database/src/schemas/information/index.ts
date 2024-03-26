import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

import { information_history } from "./information_history";
import { relations } from "drizzle-orm";

export const information = pgTable("information", {
  id: serial("id").primaryKey(),
  type: text("type"),
  user_name: text("user_name"),
  hash:text('hash'),
  purpose: text("purpose"),
  note: text("note"),
  ...base_schema_columns,
});

export const information_relations = relations(information, ({ one, many }) => ({
  informationHistory: many(information_history),
}));
