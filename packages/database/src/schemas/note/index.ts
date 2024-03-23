import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const order_detail = pgTable("note", {
  id: serial("id").primaryKey(),
  order_number: text("order_number"),
  stage: text("stage"),
  state:text('state'),
  note: text("note"),
  ...base_schema_columns,
});

