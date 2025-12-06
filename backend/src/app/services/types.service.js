import { db } from "../../db/index.js";
import { types } from "../../db/schema.js";
import { asc } from "drizzle-orm";

export async function getAllTypes() {
  return await db
    .select({
      id: types.id,
      name_fr: types.name_fr,
      name_en: types.name_en,
    })
    .from(types)
    .orderBy(asc(types.id));
}
