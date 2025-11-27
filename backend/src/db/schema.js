import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Table Pokemon

export const pokemon = sqliteTable("pokemon", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  sprite: text("sprite"),
  height: integer("height"),
  weight: integer("weight"),
  types: text("types"), // liste des types sous forme de string JSON
});
