import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const sqlite = new Database("pokedex.db");

// db = instance drizzle
export const db = drizzle(sqlite, { schema });
