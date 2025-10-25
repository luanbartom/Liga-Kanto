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

// 🔹 Busca dados detalhados de um Pokémon específico (com cache local)
export async function getPokemon(nameOrId) {
  try {
    const key = String(nameOrId).toLowerCase();
    const cacheKey = `pokemon_${key}`;

    // 🧩 1️⃣ Verificar cache local antes de consultar a API
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed; // ✅ retorna se estiver válido
      } catch (e) {
        localStorage.removeItem(cacheKey); // remove cache corrompido
      }
    }

    // 🧩 2️⃣ Caso não tenha cache, busca na API normalmente
    const res = await pokeAPI.get(`pokemon/${key}`);
    const stats = res.data.stats;
    const id = res.data.id;

    // Selecionar golpes
    const allMoveNames = (res.data.moves || []).map((m) => m.move?.name).filter(Boolean);
    const uniqueMoves = Array.from(new Set(allMoveNames));

    // Gerador pseudoaleatório fixo
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

    // 🧩 3️⃣ Montar o objeto final com fallback

const staticSprite = res.data.sprites.front_default;
const animatedSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
const fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const pokemonData = {
  id,
  name: res.data.name,
  sprite: staticSprite || fallbackSprite, // usa fallback se front_default for null
  animated: animatedSprite,
  hp: stats[0].base_stat * 5,
  attack: stats[1].base_stat,
  defense: stats[2].base_stat,
  speed: stats[5].base_stat,
  types,
  height: res.data.height,
  weight: res.data.weight,
  moves,
  evolutionStage: evoStage,
};


    // 🧩 4️⃣ Salvar no cache local
    localStorage.setItem(cacheKey, JSON.stringify(pokemonData));

    return pokemonData;
  } catch (err) {
    console.error("Erro ao buscar Pokémon:", err);
    return null;
  }
}

// 🔹 Carrega os 151 Pokémons da 1ª geração em blocos paralelos + cache local
export async function getFirstGenPokemons() {
  try {
    // Tenta usar cache local primeiro
    const cached = localStorage.getItem("firstGenPokemons");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length >= 150) {
        console.log("✅ Pokémons carregados do cache local");
        return parsed;
      }
    }

    console.log("🌐 Buscando Pokémons da 1ª geração da API...");
    const res = await pokeAPI.get("pokemon?limit=151");
    const pokemonList = res.data.results;

    // 🔸 Função auxiliar para buscar um lote (ex: 20 por vez)
    async function fetchBatch(batch) {
      const promises = batch.map(async (p) => {
        try {
          return await getPokemon(p.name);
        } catch (err) {
          console.warn(`⚠️ Erro ao buscar ${p.name}`, err);
          return null;
        }
      });
      return (await Promise.all(promises)).filter(Boolean);
    }

    // 🔸 Divide a lista em blocos de 20 Pokémons
    const batchSize = 20;
    const detailedPokemons = [];

    for (let i = 0; i < pokemonList.length; i += batchSize) {
      const batch = pokemonList.slice(i, i + batchSize);
      const result = await fetchBatch(batch);
      detailedPokemons.push(...result);
      console.log(`✅ Lote ${i / batchSize + 1} carregado (${detailedPokemons.length}/151)`);
      // pequeno atraso entre lotes
      await new Promise((r) => setTimeout(r, 500));
    }

    // 🔹 Salva no cache local
    localStorage.setItem("firstGenPokemons", JSON.stringify(detailedPokemons));

    return detailedPokemons;
  } catch (err) {
    console.error("Erro ao buscar lista de Pokémons:", err);
    return [];
  }
}
