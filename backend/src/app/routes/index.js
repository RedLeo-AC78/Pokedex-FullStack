import { Router } from "express";
import pokemonRouter from "./pokemon.routes.js";
import typesRouter from "./types.routes.js";

const router = Router();

router.use("/pokemon", pokemonRouter);
router.use("/types", typesRouter);

export default router;
