import { Router } from "express";
import {
  getAllPokemon,
  getPokemonById,
  handleSearchPokemon,
  handleFilterByType,
  handleFilterByGeneration,
} from "../controllers/pokemon.controller.js";

const router = Router();

router.get("/", (req, res) => {
  if (req.query.search) {
    return handleSearchPokemon(req, res);
  }

  if (req.query.type) {
    return handleFilterByType(req, res);
  }

  if (req.query.generation) {
    return handleFilterByGeneration(req, res);
  }

  return getAllPokemon(req, res);
});

router.get("/:id", getPokemonById);

export default router;
