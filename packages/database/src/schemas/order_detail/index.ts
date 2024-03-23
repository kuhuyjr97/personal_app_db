import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const order_detail = pgTable("order_detail", {
  id: serial("id").primaryKey(),
  order_number: text("order_number").unique(),
  name: text("name"),
  user_id: text("user_id"),
  amount: text("amount"),
  detail: text("detail"),
  note: text("note"),
  priority: text('priority'),
  recieved_day: text("recieved_day"),
  material: text("material"),
  xlbm: text("xlbm"),
  condition: text("condition"),
  surface_type: text("surface_type"),
  deadline: text("deadline"),
  typed_person: text("typed_person"),
  is_finished: text("is_finished"),
  confirmed_person: text("confirmed_person"),
  img_url: text("img_url"),
  file_id: text("file_id"),
  ...base_schema_columns,
});

