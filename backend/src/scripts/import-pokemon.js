import { db } from "../db/index.js";
import { pokemon, types, pokemonTypes } from "../db/schema.js";

const START_ID = 1; // Début Gen 1
const END_ID = 386; // Fin Gen 3
const MAX_TYPE_ID = 18; // Types classiques (1..18)

/**
 * Petite pause pour éviter le rate limit PokeAPI
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrapper fetch JSON avec gestion d’erreur
 */
async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`❌ Fetch error ${res.status} for ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`❌ Network error for ${url}:`, err);
    return null;
  }
}

/**
 * Récupère les noms FR / EN depuis /pokemon-species/{id}
 */
function extractNames(species) {
  let name_fr = null;
  let name_en = null;

  for (const entry of species.names ?? []) {
    if (!name_fr && entry.language?.name === "fr") {
      name_fr = entry.name;
    }
    if (!name_en && entry.language?.name === "en") {
      name_en = entry.name;
    }
    if (name_fr && name_en) break;
  }

  return { name_fr, name_en };
}

/**
 * Récupère les descriptions FR / EN (flavor_text_entries)
 */
function extractDescriptions(species) {
  let description_fr = null;
  let description_en = null;

  for (const entry of species.flavor_text_entries ?? []) {
    if (entry.language?.name === "fr" && !description_fr) {
      description_fr = entry.flavor_text.replace(/\n|\f/g, " ");
    }
    if (entry.language?.name === "en" && !description_en) {
      description_en = entry.flavor_text.replace(/\n|\f/g, " ");
    }
    if (description_fr && description_en) break;
  }

  return { description_fr, description_en };
}

/**
 * Récupère les catégories FR / EN (genera)
 */
function extractCategories(species) {
  let category_fr = null;
  let category_en = null;

  for (const entry of species.genera ?? []) {
    if (entry.language?.name === "fr" && !category_fr) {
      category_fr = entry.genus;
    }
    if (entry.language?.name === "en" && !category_en) {
      category_en = entry.genus;
    }
    if (category_fr && category_en) break;
  }

  return { category_fr, category_en };
}

/**
 * Récupère la génération (1, 2, 3, etc.)
 */
function extractGeneration(species) {
  const url = species?.generation?.url;
  if (!url) return null;

  const segments = url.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const gen = parseInt(last, 10);

  return Number.isNaN(gen) ? null : gen;
}

/**
 * Récupère les stats de base
 */
function extractStats(pokemonData) {
  const stats = {
    hp: null,
    attack: null,
    defense: null,
    special_attack: null,
    special_defense: null,
    speed: null,
  };

  for (const s of pokemonData.stats ?? []) {
    const name = s.stat?.name;
    const value = s.base_stat ?? null;

    switch (name) {
      case "hp":
        stats.hp = value;
        break;
      case "attack":
        stats.attack = value;
        break;
      case "defense":
        stats.defense = value;
        break;
      case "special-attack":
        stats.special_attack = value;
        break;
      case "special-defense":
        stats.special_defense = value;
        break;
      case "speed":
        stats.speed = value;
        break;
      default:
        break;
    }
  }

  return stats;
}

/**
 * Récupère les sprites (normal / shiny / home / home_shiny)
 */
function extractSprites(pokemonData) {
  const sprites = pokemonData.sprites ?? {};

  const home = sprites.other?.home ?? {};

  return {
    sprite_normal: sprites.front_default ?? null,
    sprite_shiny: sprites.front_shiny ?? null,
    sprite_home: home.front_default ?? null,
    sprite_home_shiny: home.front_shiny ?? null,
  };
}

/**
 * Nettoyage des tables
 */
async function clearTables() {
  console.log("🧹 Nettoyage des tables pokemon_types, pokemon, types...");
  await db.delete(pokemonTypes);
  await db.delete(pokemon);
  await db.delete(types);
}

/**
 * Import des types (1..18)
 */
async function importTypes() {
  console.log("📥 Import des types (1..18)...");

  for (let id = 1; id <= MAX_TYPE_ID; id++) {
    const url = `https://pokeapi.co/api/v2/type/${id}`;
    const data = await fetchJson(url);
    if (!data) {
      console.error(`❌ Impossible de récupérer le type #${id}`);
      continue;
    }

    let name_fr = null;
    let name_en = null;

    for (const entry of data.names ?? []) {
      if (!name_fr && entry.language?.name === "fr") {
        name_fr = entry.name;
      }
      if (!name_en && entry.language?.name === "en") {
        name_en = entry.name;
      }
      if (name_fr && name_en) break;
    }

    // fallback
    if (!name_en) name_en = data.name ?? `type-${id}`;
    if (!name_fr) name_fr = name_en;

    await db.insert(types).values({
      id,
      name_fr,
      name_en,
    });

    console.log(`✅ Type #${id} : ${name_en} / ${name_fr}`);
    await sleep(80);
  }

  console.log("✅ Import des types terminé.");
}

/**
 * Import d'un Pokémon complet (pokemon + species + pivot types)
 */
async function importSinglePokemon(id) {
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  const [pokemonData, speciesData] = await Promise.all([
    fetchJson(pokemonUrl),
    fetchJson(speciesUrl),
  ]);

  if (!pokemonData || !speciesData) {
    console.error(`❌ Skip pokemon #${id} (donnée manquante)`);
    return;
  }

  const { name_fr, name_en } = extractNames(speciesData);
  const { description_fr, description_en } = extractDescriptions(speciesData);
  const { category_fr, category_en } = extractCategories(speciesData);
  const generation = extractGeneration(speciesData);
  const stats = extractStats(pokemonData);
  const sprites = extractSprites(pokemonData);

  const row = {
    id: pokemonData.id,
    name_fr: name_fr ?? pokemonData.name,
    name_en: name_en ?? pokemonData.name,
    description_fr,
    description_en,
    category_fr,
    category_en,
    sprite_normal: sprites.sprite_normal,
    sprite_shiny: sprites.sprite_shiny,
    sprite_home: sprites.sprite_home,
    sprite_home_shiny: sprites.sprite_home_shiny,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    special_attack: stats.special_attack,
    special_defense: stats.special_defense,
    speed: stats.speed,
    height: pokemonData.height ?? null,
    weight: pokemonData.weight ?? null,
    generation,
  };

  // Insert du Pokémon
  await db.insert(pokemon).values(row);

  // Insert des relations types
  for (const t of pokemonData.types ?? []) {
    const typeUrl = t.type?.url;
    if (!typeUrl) continue;

    const segments = typeUrl.split("/").filter(Boolean);
    const typeIdStr = segments[segments.length - 1];
    const typeId = parseInt(typeIdStr, 10);

    if (Number.isNaN(typeId)) continue;

    await db.insert(pokemonTypes).values({
      pokemon_id: pokemonData.id,
      type_id: typeId,
    });
  }

  console.log(
    `✅ Pokémon #${id} importé : ${row.name_en} / ${row.name_fr} (Gen ${generation})`
  );
}

/**
 * Import de tous les Pokémon (1..386)
 */
async function importAllPokemon() {
  console.log(`📥 Import des Pokémon #${START_ID} à #${END_ID}...`);

  for (let id = START_ID; id <= END_ID; id++) {
    await importSinglePokemon(id);
    await sleep(100);
  }

  console.log("✅ Import des Pokémon terminé.");
}

/**
 * Script principal
 */
(async () => {
  console.log("🚀 Début de l'import complet...");

  await clearTables();
  await importTypes();
  await importAllPokemon();

  console.log("🏁 Import COMPLET terminé !");
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
