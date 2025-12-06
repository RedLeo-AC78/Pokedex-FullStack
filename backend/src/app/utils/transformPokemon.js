export function transformSinglePokemon(p, lang = "fr") {
  return {
    id: p.id,
    name: lang === "en" ? p.name_en : p.name_fr,
    sprite_normal: p.sprite_normal,
    sprite_shiny: p.sprite_shiny,
  };
}

export function transformPokemonResponse(data, lang = "fr") {
  if (Array.isArray(data)) {
    return data.map((p) => transformSinglePokemon(p, lang));
  }

  return transformSinglePokemon(data, lang);
}

export function transformPokemonDetails(pokemonData, typesData, lang = "fr") {
  const name = lang === "en" ? pokemonData.name_en : pokemonData.name_fr;

  const description =
    lang === "en" ? pokemonData.description_en : pokemonData.description_fr;

  const category =
    lang === "en" ? pokemonData.category_en : pokemonData.category_fr;

  const types = typesData.map((t) => (lang === "en" ? t.name_en : t.name_fr));

  return {
    id: pokemonData.id,
    name,
    description,
    category,
    types,
    stats: {
      hp: pokemonData.hp,
      attack: pokemonData.attack,
      defense: pokemonData.defense,
      special_attack: pokemonData.special_attack,
      special_defense: pokemonData.special_defense,
      speed: pokemonData.speed,
    },
    sprites: {
      normal: pokemonData.sprite_normal,
      shiny: pokemonData.sprite_shiny,
      home: pokemonData.sprite_home,
      home_shiny: pokemonData.sprite_home_shiny,
    },
    height: pokemonData.height,
    weight: pokemonData.weight,
    generation: pokemonData.generation,
  };
}
