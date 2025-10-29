import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const INPUT = path.resolve("./public/data/pokedex_with_moves.json");
const OUTPUT = path.resolve("./public/data/pokedex_full_dataset.json");
const CACHE_DIR = path.resolve("./scripts/cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ========== FUNÇÕES BASE DE API ========== //
async function safeFetch(url, cacheKey) {
  const cacheFile = path.join(CACHE_DIR, cacheKey + ".json");
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    fs.writeFileSync(cacheFile, JSON.stringify(data));
    await delay(120);
    return data;
  } catch (err) {
    console.error("Erro ao buscar:", url, err.message);
    return null;
  }
}

// ========== FUNÇÕES DE EXTRAÇÃO ========== //
async function getPokemonDetails(idOrName) {
  const data = await safeFetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`, `pokemon_${idOrName}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    base_experience: data.base_experience,
    types: data.types.map((t) => t.type.name),
    stats: Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat])),
    abilities: data.abilities.map((a) => ({
      name: a.ability.name,
      hidden: a.is_hidden,
    })),
    sprites: {
      front: `/sprites/statics/${data.id}.png`,
      animated: `/sprites/gif/${data.id}.gif`,
    },
  };
}

async function getSpeciesData(name) {
  const data = await safeFetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`, `species_${name}`);
  if (!data) return {};

  const evoChainUrl = data.evolution_chain?.url;
  let evoStage = 1;
  let evolvesFrom = data.evolves_from_species?.name || null;

  if (evoChainUrl) {
    const evoChain = await safeFetch(evoChainUrl, `chain_${data.id}`);
    const chain = evoChain?.chain;
    function findStage(node, target, stage = 1) {
      if (node.species.name === target) return stage;
      for (const next of node.evolves_to || []) {
        const found = findStage(next, target, stage + 1);
        if (found) return found;
      }
      return null;
    }
    evoStage = findStage(chain, name, 1) || 1;
  }

  const flavor = (data.flavor_text_entries || []).find((f) => f.language.name === "en")?.flavor_text || null;

  return { evolutionStage: evoStage, evolves_from: evolvesFrom, flavor_text: flavor };
}

async function getMoveData(moveName) {
  const key = `move_${moveName}`;
  const data = await safeFetch(`https://pokeapi.co/api/v2/move/${moveName}`, key);
  if (!data) return {
    name: moveName,
    type: "normal",
    damage_class: "physical",
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
    effect: null
  };

  const effect =
    data.meta?.ailment?.name !== "none"
      ? { type: data.meta.ailment.name, chance: data.meta.ailment_chance || 0 }
      : null;

  return {
    name: data.name,
    type: data.type.name,
    damage_class: data.damage_class.name,
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    priority: data.priority,
    effect,
    meta: {
      crit_rate: data.meta?.crit_rate ?? 0,
      drain: data.meta?.drain ?? 0,
      healing: data.meta?.healing ?? 0,
      min_hits: data.meta?.min_hits,
      max_hits: data.meta?.max_hits,
    },
  };
}

async function getTypeChart() {
  const types = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
    "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  const chart = {};
  for (const t of types) {
    const data = await safeFetch(`https://pokeapi.co/api/v2/type/${t}`, `type_${t}`);
    if (!data) continue;
    chart[t] = {
      double_damage_to: data.damage_relations.double_damage_to.map((x) => x.name),
      half_damage_to: data.damage_relations.half_damage_to.map((x) => x.name),
      no_damage_to: data.damage_relations.no_damage_to.map((x) => x.name),
      double_damage_from: data.damage_relations.double_damage_from.map((x) => x.name),
      half_damage_from: data.damage_relations.half_damage_from.map((x) => x.name),
      no_damage_from: data.damage_relations.no_damage_from.map((x) => x.name),
    };
    await delay(120);
  }
  return chart;
}

// ========== SCRIPT PRINCIPAL ========== //
async function main() {
  const base = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const full = [];

  console.log("🔹 Gerando dataset completo...");

  for (const [i, mon] of base.entries()) {
    console.log(`→ ${i + 1}/${base.length} ${mon.name}`);
    const details = await getPokemonDetails(mon.id || mon.name);
    const species = await getSpeciesData(mon.name);

    const moveData = [];
    for (const mv of mon.moves || []) {
      const moveName = typeof mv === "string" ? mv : mv.name;
      const md = await getMoveData(moveName);
      moveData.push(md);
      await delay(80);
    }

    full.push({
      ...mon,
      ...details,
      ...species,
      moves: moveData,
    });
  }

  console.log("📘 Gerando tabela de tipos...");
  const typeChart = await getTypeChart();

  const output = { pokedex: full, type_chart: typeChart };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");
  console.log(`✅ Dataset completo salvo em ${OUTPUT}`);
}

main();
