import { boolean, pgTable, serial, text,integer, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const task = pgTable("task", {
  id: serial("id").primaryKey(),
  name: text("name"),
  episodeTotal: integer("episode_total"),
  episodeLeft: integer("episode_left"),
  note: text("note"),
  days: integer("name"),
  isDone: text("is_done"),
  ...base_schema_columns,
});

