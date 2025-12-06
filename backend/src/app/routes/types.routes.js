import { Router } from "express";
import { handleGetTypes } from "../controllers/types.controller.js";

const router = Router();

router.get("/", handleGetTypes);

export default router;
