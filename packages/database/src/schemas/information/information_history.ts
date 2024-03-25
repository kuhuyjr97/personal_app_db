import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";
import { relations } from "drizzle-orm";

import { information } from "./index";

export const information_history = pgTable("information_history", {
  id: serial("id").primaryKey(),
  informationId: integer("information_id")
  .notNull()
  .references(() => information.id, { onDelete: "cascade" }),
  state: text("state"),
  note: text("note"),
  ...base_schema_columns,
});

export const information_history_relations = relations(
  information_history,
  ({ one }) => ({
    information: one(information, {
      fields: [information_history.informationId],
      references: [information.id],
    })
  })
);


