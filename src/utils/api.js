/**
 * Lê o arquivo local de Pokédex via fetch (carrega só uma vez).
 */
let cachedPokedex = null;
import { isBoss } from "./boss";

async function loadPokedex() {
  if (cachedPokedex) return cachedPokedex;
  const res = await fetch("/pokedex.json");
  if (!res.ok) throw new Error("Falha ao carregar pokedex.json");
  const data = await res.json();
  cachedPokedex = data.pokedex;
  return cachedPokedex;
}

/**
 * Retorna todos os Pokémon (usa sprites locais).
 */
export async function getFirstGenPokemons() {
  const pokedex = await loadPokedex();
  console.log(pokedex)
  return pokedex?.map((p) => ({
    ...p,
    boss: isBoss(p),
    sprite: `/sprites/static/${p.id}.png`,
    animated: `/sprites/gif/${p.id}.gif`,
  }));
}

// Retorna todos os Pokémons disponíveis no pokedex.json (Gens 1–3 neste projeto)
export async function getAllPokemons() {
  const pokedex = await loadPokedex();
  return pokedex?.map((p) => ({
    ...p,
    boss: isBoss(p),
    sprite: `/sprites/static/${p.id}.png`,
    animated: `/sprites/gif/${p.id}.gif`,
  }));
}

/**
 * Retorna os dados de um Pokémon específico.
 */
export async function getPokemon(nameOrId) {
  const pokedex = await loadPokedex();
  const key = String(nameOrId).toLowerCase();
  const found =
    pokedex.find(
      (p) => p.name.toLowerCase() === key || String(p.id) === key
    ) || null;
  if (!found) return null;

  return {
    ...found,
    boss: isBoss(found),
    sprite: `/sprites/static/${found.id}.png`,
    animated: `/sprites/gif/${found.id}.gif`,
  };
}

/**
 * Retorna os dados de um golpe (nome, tipo, poder, precisão, etc.)
 */
export async function getMove(nameOrId) {
  const pokedex = await loadPokedex();
  const key = String(nameOrId).toLowerCase();

  for (const p of pokedex) {
    const move = (p.moves || []).find(
      (m) =>
        (m.name && m.name.toLowerCase() === key) ||
        (typeof m === "string" && m.toLowerCase() === key)
    );
    if (move)
      return typeof move === "string"
        ? { name: move, display: move.replace(/-/g, " "), type: "normal" }
        : move;
  }

  // Fallback genérico
  return {
    name: key,
    display: key.replace(/-/g, " "),
    power: 40,
    accuracy: 95,
    type: "normal",
    effects: [],
    pp: 35,
  };
}
