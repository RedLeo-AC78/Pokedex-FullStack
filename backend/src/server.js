import express from "express";
import pokemonRoutes from "./routes/pokemon.routes.js";

const app = express();
const PORT = 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/pokemons", pokemonRoutes);

app.listen(PORT, () => {
  console.log("Backend running on http://localhost:${PORT}");
});
