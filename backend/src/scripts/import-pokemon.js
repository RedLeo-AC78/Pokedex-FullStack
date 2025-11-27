import { db } from "../db/index.js";
import { pokemon } from "../db/schema.js";

const START_ID = 1; // Pokémon #1 Début GEN 1
const END_ID = 386; // Pokémon #386 Fin GEN 3

async function fetchPokemonData(id) {
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
}

async function insertPokemon(pokemonData) {
  try {
    await db.insert(pokemon).values(pokemonData);
    console.log(`✔ Pokémon ajouté : ${pokemonData.name}`);
  } catch (error) {
    console.error("Erreur insertion:", error);
  }
}

async function clearTable() {
  await db.delete(pokemon);
  console.log("Table 'pokemon' vidée.");
}

async function importAllPokemon() {
  for (let id = START_ID; id <= END_ID; id++) {
    const data = await fetchPokemonData(id);

    if (data) {
      await insertPokemon(data);
    }

    // petit délai pour éviter d'agresser la PokeAPI
    await new Promise((res) => setTimeout(res, 100));
  }

  console.log(" Import terminé !");
}

(async () => {
  console.log(" Début de l'import...");

  await clearTable(); // Vide la table
  await importAllPokemon(); // Lance l'import massif

  console.log(" Import complet !");
})();
