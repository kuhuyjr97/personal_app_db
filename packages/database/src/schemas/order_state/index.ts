import { boolean, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const order_state = pgTable("order_state", {
  id: serial("id").primaryKey(),
  order_number: text("order_number"),
  name: text("name"),
  amount: text("amount"),
  stage: text("stage"),
  state: text("state"),
  ok_amount: text("ok_amount"),
  ng_amount: text("ng_amount"),
  ng_times: text("ng_times"),
  fix_times: text("fix_times"),
  content: text("content"),
  reason: text("reason"),
  detail: text("detail"),
  solution: text("solution"),
  conclusion: text("conclusion"),
  note: text("note"),
  evaluation: text("evaluation"),
  confirmed_person1: text("confirmed_person1"),
  confirmed_person2: text("confirmed_person2"),
  confirmed_person3: text("confirmed_person3"),
  in_confirmed: text("in_confirmed"),
  approved_person: text("approved_person"),
  is_recieved: text('is_recieved'),
  ...base_schema_columns,
});

