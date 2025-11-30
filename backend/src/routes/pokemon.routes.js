import { Router } from "express";
import {
  getAllPokemons,
  getPokemonById,
} from "../controllers/pokemon.controller.js";

const router = Router();

router.get("/", getAllPokemons);
router.get("/:id", getPokemonById);

export default router;
