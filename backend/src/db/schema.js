import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Table Pokemon

export const pokemon = sqliteTable("pokemon", {
  id: integer("id").primaryKey(),

  name_fr: text("name_fr").notNull(),
  name_en: text("name_en").notNull(),

  description_fr: text("description_fr"),
  description_en: text("description_en"),

  category_fr: text("category_fr"),
  category_en: text("category_en"),

  sprite_normal: text("sprite_normal"),
  sprite_shiny: text("sprite_shiny"),
  sprite_home: text("sprite_home"),
  sprite_home_shiny: text("sprite_home_shiny"),

  hp: integer("hp"),
  attack: integer("attack"),
  defense: integer("defense"),
  special_attack: integer("special_attack"),
  special_defense: integer("special_defense"),
  speed: integer("speed"),

  height: integer("height"),
  weight: integer("weight"),

  generation: integer("generation"),
});

// Table Types
export const types = sqliteTable("types", {
  id: integer("id").primaryKey(),
  name_fr: text("name_fr").notNull(),
  name_en: text("name_en").notNull(),
});

// Table relation Pokemon_Type
export const pokemonTypes = sqliteTable("pokemon_types", {
  pokemon_id: integer("pokemon_id")
    .notNull()
    .references(() => pokemon.id),

  type_id: integer("type_id")
    .notNull()
    .references(() => types.id),
});
