import { getAllTypes } from "../services/types.service.js";

export async function handleGetTypes(req, res) {
  try {
    const data = await getAllTypes();
    res.json(data);
  } catch (error) {
    console.error("Erreur GET /types :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
