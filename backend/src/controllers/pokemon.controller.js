import { db } from "../db/index.js";
import { pokemon } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function getAllPokemons(req, res) {
  try {
    const result = await db.select().from(pokemon).all();
    res.json(result);
  } catch (error) {
    console.error("Erreur getAllPokemons:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function getPokemonById(req, res) {
  const id = Number(req.params.id);

  try {
    const result = await db
      .select()
      .from(pokemon)
      .where(eq(pokemon.id, id))
      .get();

    if (!result) {
      return res.status(404).json({ error: "Pokémon introuvable" });
    }
    res.json(result);
  } catch (error) {
    console.error("Erreur getPokemonById:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
