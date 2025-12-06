import {
  fetchAllPokemon,
  fetchPokemonById,
  fetchPokemonByType,
  fetchPokemonByGeneration,
} from "../services/pokemon.service.js";
import { searchPokemon } from "../services/pokemon.service.js";

export async function getAllPokemon(req, res) {
  try {
    const { lang } = req.query;
    const pokemon = await fetchAllPokemon(lang);
    res.json(pokemon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getPokemonById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { lang } = req.query; // Récupération de la langue

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const pokemon = await fetchPokemonById(id, lang); // Transmition de la langue

    if (!pokemon) {
      return res.status(404).json({ error: "Pokemon introuvable" });
    }

    res.json(pokemon);
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function handleSearchPokemon(req, res) {
  try {
    const { search, lang } = req.query;

    const result = await searchPokemon(search, lang);

    res.json(result);
  } catch (err) {
    console.error("Erreur recherche Pokémon :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function handleFilterByType(req, res) {
  try {
    const { type, lang } = req.query;

    const pokemons = await fetchPokemonByType(type, lang);

    res.json(pokemons);
  } catch (err) {
    console.error("Erreur filtre par type :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function handleFilterByGeneration(req, res) {
  try {
    const { generation, lang } = req.query;

    const result = await fetchPokemonByGeneration(generation, lang);
    res.json(result);
  } catch (err) {
    console.error("Erreur filtre génération:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
