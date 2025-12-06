import express from "express";
import cors from "cors";

import pokemonRouter from "./app/routes/pokemon.routes.js";
import router from "./app/routes/index.js";

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Middlewares avant les routes
app.use(cors());
app.use(express.json());

// Routes
app.use("/pokemon", pokemonRouter);
app.use("/", router);

export default app;
