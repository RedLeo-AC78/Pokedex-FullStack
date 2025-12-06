import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.use("/pokemons", pokemonRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
