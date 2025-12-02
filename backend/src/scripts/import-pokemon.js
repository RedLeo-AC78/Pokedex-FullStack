import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import {
  pokemon as pokemonTable,
  types as typesTable,
  pokemonTypes as pokemonTypesTable,
} from "../db/schema.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*async function fetchPokemonData(id) {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Erreur lors de la récupération du Pokémon ${id}`);
    return null;
  }

  const data = await response.json();

  return {
    id: data.id,
    name: data.name,
    sprite: data.sprites.other["official-artwork"].front_default,
    height: data.height,
    weight: data.weight,
    types: JSON.stringify(data.types.map((t) => t.type.name)),
  };
}*/

/*async function insertPokemon(pokemonData) {
  try {
    await db.insert(pokemon).values(pokemonData);
    console.log(`✔ Pokémon ajouté : ${pokemonData.name}`);
  } catch (error) {
    console.error("Erreur insertion:", error);
  }
}*/

async function clearTable() {
  console.log("Nettoyage des tables...");

  // Supprime la table pivot
  await db.delete(pokemonTypesTable);
  console.log("Table `pokemon_types` vidée.");

  // Supprime la table pokemon
  await db.delete(pokemonTable);
  console.log("Table 'pokemon' vidée.");

  // Supprime la table types
  await db.delete(typesTable);
  console.log("Table `types` vidée");
}

/*async function importAllPokemon() {
  for (let id = START_ID; id <= END_ID; id++) {
    const data = await fetchPokemonData(id);

    if (data) {
      await insertPokemon(data);
    }

    // petit délai pour éviter d'agresser la PokeAPI
    await new Promise((res) => setTimeout(res, 100));
  }

  console.log(" Import terminé !");
}*/

(async () => {
  console.log(" Début de l'import...");

  await clearTable(); // Vide la table
  await importAllPokemon(); // Lance l'import

  console.log(" Import complet !");
})();

async function fetchFullPokemonData(id) {
  const urlPokemon = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const urlSpecies = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  // 1) fetch pokemon/{id}
  const resPokemon = await fetch(urlPokemon);
  if (!resPokemon.ok) {
    console.error("Erreur fetch pokemon", id);
    return null;
  }
  const dataPokemon = await resPokemon.json();

  // 2) fetch pokemon-species/{id}
  const resSpecies = await fetch(urlSpecies);
  if (!resSpecies.ok) {
    console.error("Erreur fetch Species:", id);
    return null;
  }
  const dataSpecies = await resSpecies.json();

  return { dataPokemon, dataSpecies };
}

function extractLocalizedNames(dataSpecies) {
  let name_fr = null;
  let name_en = null;

  for (const entry of dataSpecies.names) {
    if (entry.language.name === "fr") name_fr = entry.name;
    if (entry.language.name === "en") name_en = entry.name;
  }

  return { name_fr, name_en };
}

function extractDescriptions(dataSpecies) {
  let description_fr = null;
  let description_en = null;

  for (const entry of dataSpecies.flavor_text_entries) {
    if (!description_fr && entry.language.name === "fr") {
      description_fr = entry.flavor_text.replace(/\n|\f/g, " ");
    }

    if (!description_en && entry.language.name === "en") {
      description_en = entry.flavor_text.replace(/\n|\f/g, " ");
    }

    if (description_fr && description_en) break;
  }

  return { description_fr, description_en };
}

function extractCategories(dataSpecies) {
  let category_fr = null;
  let category_en = null;

  for (const entry of dataSpecies.genera) {
    if (entry.language.name === "fr") {
      category_fr = entry.genus;
    }
    if (entry.language.name === "en") {
      category_en = entry.genus;
    }

    if (category_fr && category_en) break;
  }

  return { category_fr, category_en };
}

function extractSprites(dataPokemon) {
  return {
    sprite_normal:
      dataPokemon.sprites.other["official-artwork"]?.front_default || null,
    sprite_shiny:
      dataPokemon.sprites.other["official-artwork"]?.front_shiny || null,
    sprite_home: dataPokemon.sprites.other.home?.front_default || null,
    sprite_home_shiny: dataPokemon.sprites.other.home?.front_shiny || null,
  };
}

function extractStats(dataPokemon) {
  const stats = {
    hp: null,
    attack: null,
    defense: null,
    special_attack: null,
    special_defense: null,
    speed: null,
  };

  for (const entry of dataPokemon.stats) {
    const name = entry.stat.name; // ex: "special-attack"

    if (name === "hp") stats.hp = entry.base_stat;
    if (name === "attack") stats.attack = entry.base_stat;
    if (name === "defense") stats.defense = entry.base_stat;
    if (name === "special-attack") stats.special_attack = entry.base_stat;
    if (name === "special-defense") stats.special_defense = entry.base_stat;
    if (name === "speed") stats.speed = entry.base_stat;
  }

  return stats;
}

function extractTypeInfos(dataPokemon) {
  return dataPokemon.types.map((t) => {
    const url = t.type.url; // "https://pokeapi.co/api/v2/type/12/"
    const id = parseInt(url.split("/").slice(-2)[0]); // extrait "12"
    return { id, name_en: t.type.name };
  });
}

async function fetchTypeNames(typeId) {
  const url = `https://pokeapi.co/api/v2/type/${typeId}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Erreur fetch type", typeId);
    return null;
  }

  const data = await res.json();

  let name_fr = null;
  let name_en = null;

  for (const entry of data.names) {
    if (entry.language.name === "fr") name_fr = entry.name;
    if (entry.language.name === "en") name_en = entry.name;
  }

  return { id: typeId, name_en, name_fr };
}

async function buildPokemonObject(id) {
  const { dataPokemon, dataSpecies } = await fetchFullPokemonData(id);

  if (!dataPokemon || !dataSpecies) {
    console.error("Erreur lors du fetch complet:", id);
    return null;
  }

  // Extraction de chaque partie
  const { name_fr, name_en } = extractLocalizedNames(dataSpecies);
  const { description_fr, description_en } = extractDescriptions(dataSpecies);
  const { category_fr, category_en } = extractCategories(dataSpecies);
  const sprites = extractSprites(dataPokemon);
  const stats = extractStats(dataPokemon);

  // Types EN avec ID
  const typeInfos = extractTypeInfos(dataPokemon);

  // Récuperation des types en FR/EN (fetch /type/{id})
  const fullTypes = [];
  for (const t of typeInfos) {
    const typeData = await fetchTypeNames(t.id);
    if (typeData) fullTypes.push(typeData);
  }

  // Géneration (convertir "generation_i" => 1)
  const generationName = dataSpecies.generation.name; // "generation-i"
  const generation = Number(
    generationName.split("-")[1].replace("i", "1").replace("ii", "2")
  );

  // Construction de l'objet final Pokémon
  const pokemon = {
    id,
    name_fr,
    name_en,
    description_fr,
    description_en,
    category_fr,
    category_en,
    ...sprites,
    ...stats,
    height: dataPokemon.height,
    weight: dataPokemon.weight,
    generation,
  };

  return { pokemon, types: fullTypes };
}

async function insertPokemon(pokemon) {
  await db.insert(pokemonTable).values(pokemon);
}

async function insertTypeIfNeeded(type) {
  // type = { id, name_en, name_fr }

  // Vérifier si le type existe déja
  const existing = await db
    .select()
    .from(typesTable)
    .where(eq(typesTable.id, type.id));

  if (existing.length === 0) {
    console.log(`=> Nouveau type : ${type.name_en} (${type.id})`);

    await db.insert(typesTable).values(type);
  } else {
    console.log(`=> Type déjà présent : ${type.name_en} (${type.id})`);
  }
}

async function insertPokemonType(pokemonId, typeId) {
  await db.insert(pokemonTypesTable).values({
    pokemon_id: pokemonId,
    type_id: typeId,
  });
}

async function importAllPokemon() {
  for (let id = 1; id <= 386; id++) {
    console.log(`Import du pokémon ${id}...`);

    const full = await buildPokemonObject(id);
    if (!full) continue;

    const { pokemon, types } = full;

    // 1) insérer le pokemon
    await insertPokemon(pokemon);

    // 2) insérer les types (sans doublons)
    for (const t of types) {
      await insertTypeIfNeeded(t);
    }

    // 3) insérer les relations Pokémon <=> types
    for (const t of types) {
      const exists = await db
        .select()
        .from(typesTable)
        .where(eq(typesTable.id, t.id));

      if (exists.length === 0) {
        console.error(" Type inexistant:", t);
        continue;
      }

      await insertPokemonType(pokemon.id, t.id);
    }

    // Pause de 50 ms pour éviter de surcharger l'API
    await sleep(50);
  }

  console.log("Import terminé !");
}
