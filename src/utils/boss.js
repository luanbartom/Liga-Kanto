// Lista de Pokémon "Boss" (lendários/mítico) das 3 primeiras gerações
// IDs conforme pokedex.json
export const BOSS_IDS = new Set([
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // deoxys-normal = 386
]);

export function isBossId(id) {
  const n = Number(id);
  return BOSS_IDS.has(n);
}

export function isBossName(name = "") {
  const key = String(name).toLowerCase();
  return [
    // Gen 1
    "articuno", "zapdos", "moltres", "mewtwo", "mew",
    // Gen 2
    "raikou", "entei", "suicune", "lugia", "ho-oh", "celebi",
    // Gen 3 (inclui forma base de Deoxys)
    "regirock", "regice", "registeel", "latias", "latios",
    "kyogre", "groudon", "rayquaza", "jirachi", "deoxys-normal"
  ].includes(key);
}

export function isBoss(p) {
  if (!p) return false;
  return isBossId(p.id) || isBossName(p.name);
}

