import { relations } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

import { user } from "./index";

import { base_schema_columns } from "@/schemas/base_schemas";
export const user_tokens = pgTable("user_tokens", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text('token'),
  ...base_schema_columns,
});

export const user_token_relations = relations(
  user_tokens,
  ({ one }) => ({
    user: one(user, {
      fields: [user_tokens.userId],
      references: [user.id],
    })
  })
);
