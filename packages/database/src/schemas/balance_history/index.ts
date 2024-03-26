import {
  boolean,
  pgTable,
  serial,
  text,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { base_schema_columns } from "@/schemas/base_schemas";

export const balance_history = pgTable("balance_history", {
  id: serial("id").primaryKey(),
  currentAmount: integer("current_amount"),
  expense: integer("expense"),
  income: integer("income"),
  type: text("type"),
  category: text("category"),
  amount: integer("amount"),
  note: text("note"),
  ...base_schema_columns,
});
