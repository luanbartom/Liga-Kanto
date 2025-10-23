import axios from "axios";

export const pokeAPI = axios.create({
  baseURL: "https://pokeapi.co/api/v2/",
});
// Cache simples em memória para detalhes de golpes
const MOVE_DETAIL_CACHE = new Map();

// Hints de poder para evitar chamadas extras à API em telas de listagem
// (valores aproximados apenas para ordenação progressiva)
const MOVE_POWER_HINTS = {
  tackle: 40,
  scratch: 40,
  bind: 15,
  cut: 50,
  "vine-whip": 45,
  "razor-leaf": 55,
  "leaf-blade": 90,
  "solar-beam": 120,
  "mega-drain": 40,
  "giga-drain": 75,
  "leech-life": 80,
  ember: 40,
  flamethrower: 90,
  "fire-blast": 110,
  "fire-punch": 75,
  "ice-beam": 90,
  blizzard: 110,
  "thunder-shock": 40,
  thunderbolt: 90,
  thunder: 110,
  "thunder-punch": 75,
  surf: 90,
  "hydro-pump": 110,
  "water-gun": 40,
  "bubble-beam": 65,
  "wing-attack": 60,
  gust: 40,
  "aerial-ace": 60,
  earthquake: 100,
  dig: 80,
  "karate-chop": 50,
  "seismic-toss": 0,
  "brick-break": 75,
  bite: 60,
  crunch: 80,
  "shadow-ball": 80,
  "rock-slide": 75,
};

// Preferred moves by type (Gen 1 friendly + classics)
const PREFERRED_BY_TYPE = {
  grass: [
    "razor-leaf",
    "vine-whip",
    "solar-beam",
    "mega-drain",
    "giga-drain",
    "seed-bomb",
    "leaf-storm",
    "bullet-seed",
    "leaf-blade",
    "power-whip",
    "leech-seed",
    "sleep-powder",
    "stun-spore",
  ],
  poison: ["sludge-bomb", "sludge", "poison-jab", "acid", "toxic", "poison-sting"],
  fire: [
    "flamethrower",
    "fire-blast",
    "ember",
    "fire-spin",
    "flame-wheel",
    "fire-punch",
    "flame-charge",
  ],
  water: [
    "hydro-pump",
    "surf",
    "water-gun",
    "bubble-beam",
    "bubble",
    "water-pulse",
    "aqua-jet",
  ],
  bug: ["x-scissor", "signal-beam", "leech-life", "bug-bite", "pin-missile", "twineedle", "fury-cutter"],
  normal: [
    "tackle",
    "scratch",
    "headbutt",
    "quick-attack",
    "body-slam",
    "double-edge",
    "hyper-beam",
    "mega-punch",
    "mega-kick",
    "slash",
  ],
  electric: ["thunderbolt", "thunder", "thunder-shock", "spark", "thunder-punch", "discharge"],
  ice: ["ice-beam", "blizzard", "ice-punch", "aurora-beam", "powder-snow"],
  fighting: ["karate-chop", "low-kick", "brick-break", "submission", "seismic-toss", "double-kick", "mach-punch", "cross-chop"],
  ground: ["earthquake", "dig", "earth-power", "mud-slap", "bone-club", "bonemerang", "bulldoze"],
  flying: ["wing-attack", "gust", "peck", "aerial-ace", "air-slash", "sky-attack", "drill-peck"],
  psychic: ["psychic", "confusion", "psybeam", "psywave", "psyshock", "hypnosis", "dream-eater", "disable"],
  rock: ["rock-slide", "rock-throw", "stone-edge", "ancient-power", "rock-tomb"],
  ghost: ["shadow-ball", "night-shade", "shadow-claw", "shadow-punch", "lick", "confuse-ray"],
  dragon: ["dragon-rage", "dragon-breath", "dragon-claw", "outrage", "twister"],
  dark: ["bite", "crunch", "pursuit", "feint-attack", "night-slash", "thief"],
  steel: ["iron-head", "metal-claw", "steel-wing", "flash-cannon", "bullet-punch"],
  fairy: ["moonblast", "dazzling-gleam", "play-rough", "fairy-wind", "sweet-kiss"],
};

// Iconic/signature preferences by species (lowercase keys)
const SIGNATURE_BY_SPECIES = {
  bulbasaur: ["vine-whip", "razor-leaf", "leech-seed", "sleep-powder"],
  ivysaur: ["razor-leaf", "sleep-powder", "leech-seed", "solar-beam"],
  venusaur: ["razor-leaf", "sleep-powder", "solar-beam", "leech-seed"],
  charmander: ["ember", "flamethrower", "slash", "fire-spin"],
  charmeleon: ["ember", "flamethrower", "slash", "fire-fang"],
  charizard: ["flamethrower", "wing-attack", "slash", "fire-blast"],
  squirtle: ["water-gun", "bubble", "withdraw", "bubble-beam"],
  wartortle: ["water-gun", "bubble-beam", "bite", "hydro-pump"],
  blastoise: ["hydro-pump", "surf", "ice-beam", "bite"],
};

function uniqueInOrder(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function seededSample(arr, k, seed = 1, exclude = new Set()) {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(seed);
  const pool = arr.filter((x) => !exclude.has(x));
  const picked = [];
  const used = new Set();
  if (pool.length === 0) return picked;
  for (let i = 0; i < pool.length && picked.length < k; i++) {
    let idx = Math.floor(rnd() * pool.length);
    let tries = 0;
    while (used.has(idx) && tries < pool.length) {
      idx = (idx + 1) % pool.length;
      tries++;
    }
    used.add(idx);
    picked.push(pool[idx]);
  }
  return picked;
}

// 🔹 Função auxiliar para pegar o estágio de evolução
export async function getEvolutionStage(pokemonName) {
  try {
    // 1️⃣ Buscar a espécie
    const speciesRes = await pokeAPI.get(`pokemon-species/${pokemonName}`);
    const speciesData = speciesRes.data;

    // 2️⃣ Buscar a cadeia de evolução
    const evoUrl = speciesData.evolution_chain.url;
    const evoRes = await axios.get(evoUrl);
    const evoData = evoRes.data;

    // 3️⃣ Função recursiva para achar o estágio
    function findStage(chain, target, stage = 1) {
      if (chain.species.name === target) return stage;
      for (const evo of chain.evolves_to) {
        const found = findStage(evo, target, stage + 1);
        if (found) return found;
      }
      return null;
    }

    const stage = findStage(evoData.chain, pokemonName, 1);
    return stage || 1;
  } catch (err) {
    console.error("Erro ao buscar estágio de evolução:", err);
    return 1;
  }
}

// 🔹 Busca dados detalhados de um Pokémon específico
export async function getPokemon(nameOrId) {
  try {
    const key = String(nameOrId).toLowerCase();
    const res = await pokeAPI.get(`pokemon/${key}`);
    const stats = res.data.stats;
    const id = res.data.id;

    // Selecionar 4 golpes diversos de forma determinística por espécie
    const allMoveNames = (res.data.moves || []).map((m) => m.move?.name).filter(Boolean);
    const uniqueMoves = Array.from(new Set(allMoveNames));
    function mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function seededSample(arr, k, seed = 1) {
      const rnd = mulberry32(seed);
      const picked = [];
      const used = new Set();
      if (arr.length === 0) return picked;
      for (let i = 0; i < arr.length && picked.length < k; i++) {
        let idx = Math.floor(rnd() * arr.length);
        let tries = 0;
        while (used.has(idx) && tries < arr.length) {
          idx = (idx + 1) % arr.length;
          tries++;
        }
        used.add(idx);
        picked.push(arr[idx]);
      }
      return picked;
    }
    const seedBase = (id * 1009) >>> 0;
    let moves = uniqueMoves.length <= 4 ? uniqueMoves : seededSample(uniqueMoves, 4, seedBase);

    // Priorizar: 2 do tipo principal, 1 do secundário (se houver) e 1 icônico
    const types = res.data.types.map((t) => t.type.name);
    const primary = types[0];
    const secondary = types[1] || null;
    const available = uniqueMoves;
    const species = String(res.data.name).toLowerCase();
    let chosen = uniqueInOrder((SIGNATURE_BY_SPECIES[species] || []).filter((n) => available.includes(n))).slice(0, 1);

    // Estágio para progressão de poder
    const evoStage = await getEvolutionStage(res.data.name);
    const stage = Math.min(3, Math.max(1, parseInt(evoStage || 1, 10)));

    async function ensureFromType(type, minCount) {
      if (!type) return;
      const pref = (PREFERRED_BY_TYPE[type] || []).filter((n) => available.includes(n) && !chosen.includes(n));
      if (pref.length === 0) return;
      // Ordenação por estágio usando dicas locais de poder (evita N chamadas de rede)
      const scored = pref.map((name) => ({ name, power: MOVE_POWER_HINTS[name] ?? 60 }));
      if (stage === 1) {
        scored.sort((a, b) => (a.power || 0) - (b.power || 0));
      } else if (stage === 2) {
        scored.sort((a, b) => Math.abs((a.power || 70) - 70) - Math.abs((b.power || 70) - 70));
      } else {
        scored.sort((a, b) => (b.power || 0) - (a.power || 0));
      }
      for (const item of scored) {
        if (chosen.length >= 4) break;
        if (!chosen.includes(item.name)) chosen.push(item.name);
        const count = chosen.filter((x) => (PREFERRED_BY_TYPE[type] || []).includes(x)).length;
        if (count >= minCount) break;
      }
    }
    await ensureFromType(primary, 2);
    if (secondary) await ensureFromType(secondary, 1);

    if (chosen.length < 4) {
      const exclude = new Set(chosen);
      chosen = uniqueInOrder([...chosen, ...seededSample(available, 4 - chosen.length, seedBase + 1, exclude)]);
    }
    moves = chosen.slice(0, 4);

    // Buscar estágio de evolução (já carregado em evoStage acima para escolha progressiva)
    const evolutionStage = evoStage;

    return {
      id,
      name: res.data.name,
      sprite: res.data.sprites.front_default,
      animated: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`,
      hp: stats[0].base_stat * 5,
      attack: stats[1].base_stat,
      defense: stats[2].base_stat,
      speed: stats[5].base_stat,
      types,
      height: res.data.height,
      weight: res.data.weight,
      moves,
      evolutionStage, // 👈 novo campo
    };
  } catch (err) {
    console.error("Erro ao buscar Pokémon:", err);
    return null;
  }
}

// 🔹 Retorna os 151 Pokémon da 1ª geração
export async function getFirstGenPokemons() {
  try {
    const res = await pokeAPI.get("pokemon?limit=151");
    const pokemonList = res.data.results;

    const detailedPokemons = await Promise.all(
      pokemonList.map(async (p) => await getPokemon(p.name))
    );

    return detailedPokemons.filter(Boolean);
  } catch (err) {
    console.error("Erro ao buscar lista de Pokémons:", err);
    return [];
  }
}

// 🔹 Busca e normaliza dados reais de um golpe
export async function getMove(nameOrId) {
  try {
    const key = String(nameOrId).toLowerCase();
    if (MOVE_DETAIL_CACHE.has(key)) return MOVE_DETAIL_CACHE.get(key);
    const res = await pokeAPI.get(`move/${key}`).catch(() => null);
    if (!res) {
      // Fallback leve (sem log agressivo)
      const data = {
        name: key,
        display: key.replace(/-/g, " "),
        power: MOVE_POWER_HINTS[key] ?? 40,
        accuracy: 95,
        type: "normal",
        damage_class: "physical",
        effects: [],
      };
      MOVE_DETAIL_CACHE.set(key, data);
      return data;
    }
    const m = res.data;
    const effects = [];
    const ailment = m.meta?.ailment?.name;
    const ailmentChance = m.meta?.ailment_chance ?? 0;

    if (ailment && ailment !== "none" && ailmentChance > 0) {
      const map = {
        paralysis: "paralyzed",
        burn: "burned",
        sleep: "asleep",
        freeze: "frozen",
        poison: "poisoned",
        badly_poisoned: "poisoned",
        confusion: "confused",
      };
      effects.push({ type: map[ailment] || ailment, chance: ailmentChance });
    }

    // Preferir nome em pt-BR se disponível
    let display = m.name.replace(/-/g, " ");
    try {
      const pt = (m.names || []).find((n) => n.language?.name === "pt-BR") || (m.names || []).find((n) => n.language?.name === "pt");
      if (pt?.name) display = pt.name;
    } catch (e) {}

    const data = {
      name: m.name,
      display,
      power: m.power ?? 0,
      accuracy: m.accuracy ?? 100,
      type: m.type?.name || "normal",
      damage_class: m.damage_class?.name || "physical",
      effects,
    };
    MOVE_DETAIL_CACHE.set(key, data);
    return data;
  } catch (err) {
    // Recuo silencioso com dados genéricos
    return {
      name: String(nameOrId),
      display: String(nameOrId).replace(/-/g, " "),
      power: MOVE_POWER_HINTS[String(nameOrId).toLowerCase()] ?? 40,
      accuracy: 95,
      type: "normal",
      damage_class: "physical",
      effects: [],
    };
  }
}
