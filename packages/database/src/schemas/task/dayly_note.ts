import {
  boolean,
  pgTable,
  serial,
  text,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const daily_note = pgTable("daily_note", {
  id: serial("id").primaryKey(),
  note: text("type"),
  ...base_schema_columns,
});
