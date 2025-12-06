import {
  transformPokemonResponse,
  transformPokemonDetails,
} from "../utils/transformPokemon.js";
import { db } from "../../db/index.js";
import { pokemon, types, pokemonTypes } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { sql, like } from "drizzle-orm";

export async function fetchAllPokemon(lang = "fr") {
  const result = await db.select().from(pokemon).limit(50);
  return transformPokemonResponse(result, lang);
}

export async function fetchPokemonById(id, lang = "fr") {
  //Récupère les infos Pokémon
  const result = await db.select().from(pokemon).where(eq(pokemon.id, id));

  if (result.length === 0) return null;

  const p = result[0];

  // Récupère les types
  const resultTypes = await db
    .select({
      id: types.id,
      name_fr: types.name_fr,
      name_en: types.name_en,
    })
    .from(types)
    .innerJoin(pokemonTypes, eq(types.id, pokemonTypes.type_id))
    .where(eq(pokemonTypes.pokemon_id, id));

  // p = pokemonData - resultTypes = typesData
  return transformPokemonDetails(p, resultTypes, lang);
}

export async function searchPokemon(term, lang = "fr") {
  if (!term || term.trim() === "") {
    return await fetchAllPokemon(lang);
  }

  const search = term.toLowerCase();

  const column = lang === "en" ? pokemon.name_en : pokemon.name_fr;

  const result = await db
    .select()
    .from(pokemon)
    .where(like(sql`lower(${column})`, `%${search}%`));

  return transformPokemonResponse(result, lang);
}

export async function fetchPokemonByType(typeName, lang = "fr") {
  if (!typeName || typeName.trim() === "") {
    return await fetchAllPokemon(lang);
  }

  const typeColumn = lang === "en" ? types.name_en : types.name_fr;

  const typeRows = await db
    .select({ id: types.id })
    .from(types)
    .where(sql`lower(${typeColumn}) = ${typeName.toLowerCase()}`);

  if (typeRows.length === 0) {
    return [];
  }

  const typeId = typeRows[0].id;

  const pokemons = await db
    .select({
      id: pokemon.id,
      name_fr: pokemon.name_fr,
      name_en: pokemon.name_en,
      sprite_normal: pokemon.sprite_normal,
      sprite_shiny: pokemon.sprite_shiny,
    })
    .from(pokemon)
    .innerJoin(pokemonTypes, eq(pokemon.id, pokemonTypes.pokemon_id))
    .where(eq(pokemonTypes.type_id, typeId));

  return transformPokemonResponse(pokemons, lang);
}

export async function fetchPokemonByGeneration(gen, lang = "fr") {
  const generation = parseInt(gen);
  if (isNaN(generation)) return [];

  const result = await db
    .select()
    .from(pokemon)
    .where(eq(pokemon.generation, generation));

  return transformPokemonResponse(result, lang);
}
