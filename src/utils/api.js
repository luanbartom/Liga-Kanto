/**
 * Lê o arquivo local de Pokédex via fetch (carrega só uma vez).
 */
let cachedPokedex = null;
let cachedMovesIndex = null; // name -> move details
let cachedNamesWithNextEvo = null; // Set of names (lowercase) that have a next evolution
import { isBoss } from './boss';
import { ensureFourWeakMoves, WEAK_MOVES_BY_TYPE } from './moveRules';
// API local: lê dados de pokédex do arquivo em public/pokedex.json
// e expõe helpers para listar pokémons, obter por id/nome e obter golpes.

async function loadPokedex() {
  if (cachedPokedex) return cachedPokedex;
  const res = await fetch('/pokedex.json');
  if (!res.ok) throw new Error('Falha ao carregar pokedex.json');
  const data = await res.json();
  cachedPokedex = data.pokedex;
  return cachedPokedex;
}

// Lê e indexa moves por nome (lowercase) a partir de public/moves.json
async function loadMovesIndex() {
  if (cachedMovesIndex) return cachedMovesIndex;
  const res = await fetch('/moves.json');
  if (!res.ok) throw new Error('Falha ao carregar moves.json');
  const data = await res.json();
  // Tenta carregar um arquivo opcional com complementos locais
  let extra = null;
  try {
    const rx = await fetch('/moves-extra.json');
    if (rx.ok) extra = await rx.json();
  } catch (_) {}
  const idx = new Map();
  try {
    // Estrutura esperada: { type: [ { name, type, power, ... }, ... ], ... }
    const groups = [...Object.values(data || {}), ...Object.values(extra || {})];
    for (const arr of groups) {
      if (!Array.isArray(arr)) continue;
      for (const mv of arr) {
        if (!mv || !mv.name) continue;
        const key = String(mv.name).toLowerCase();
        // Mantém o objeto como está; normalização é feita em enrichMoves
        idx.set(key, mv);
      }
    }
  } catch (_) {
    // Se o formato for diferente, permanecemos com índice possivelmente vazio
  }
  cachedMovesIndex = idx;
  return cachedMovesIndex;
}

// Gera e cacheia o conjunto de nomes que possuem evolução seguinte
async function ensureNamesWithNextEvo() {
  if (cachedNamesWithNextEvo) return cachedNamesWithNextEvo;
  const pokedex = await loadPokedex();
  const names = new Set(
    (pokedex || [])
      .map((p) => (typeof p?.evolves_from === 'string' ? p.evolves_from.toLowerCase() : null))
      .filter(Boolean),
  );
  cachedNamesWithNextEvo = names;
  return cachedNamesWithNextEvo;
}

function isBasicWithNext(mon, namesWithNext) {
  const st = Math.min(3, Math.max(1, parseInt(mon?.evolutionStage ?? 1, 10)));
  const name = String(mon?.name || '').toLowerCase();
  return st === 1 && !!namesWithNext?.has(name);
}

/**
 * Retorna todos os Pokémon (usa sprites locais).
 */
export async function getFirstGenPokemons() {
  const pokedex = await loadPokedex();
  const namesWithNext = await ensureNamesWithNextEvo();
  const movesIndex = await loadMovesIndex().catch(() => null);
  return pokedex?.map((p) => {
    const base = {
      ...p,
      boss: isBoss(p),
      sprite: `/sprites/static/${p.id}.png`,
      animated: `/sprites/gif/${p.id}.gif`,
    };
    if (isBasicWithNext(base, namesWithNext)) {
      const existing = (base.moves || [])
        .map((m) => (typeof m === 'string' ? m : m?.name))
        .filter(Boolean);
      return { ...base, moves: ensureFourWeakMoves(base, existing, movesIndex) };
    }
    return base;
  });
}

// Retorna todos os Pokémons disponíveis no pokedex.json (Gens 1–3 neste projeto)
export async function getAllPokemons() {
  const pokedex = await loadPokedex();
  const namesWithNext = await ensureNamesWithNextEvo();
  const movesIndex = await loadMovesIndex().catch(() => null);
  return pokedex?.map((p) => {
    const base = {
      ...p,
      boss: isBoss(p),
      sprite: `/sprites/static/${p.id}.png`,
      animated: `/sprites/gif/${p.id}.gif`,
    };
    if (isBasicWithNext(base, namesWithNext)) {
      const existing = (base.moves || [])
        .map((m) => (typeof m === 'string' ? m : m?.name))
        .filter(Boolean);
      return { ...base, moves: ensureFourWeakMoves(base, existing, movesIndex) };
    }
    return base;
  });
}

/**
 * Retorna os dados de um Pokémon específico.
 */
export async function getPokemon(nameOrId) {
  const pokedex = await loadPokedex();
  const key = String(nameOrId).toLowerCase();
  const found = pokedex.find((p) => p.name.toLowerCase() === key || String(p.id) === key) || null;
  if (!found) return null;

  const namesWithNext = await ensureNamesWithNextEvo();
  const movesIndex = await loadMovesIndex().catch(() => null);
  const base = {
    ...found,
    boss: isBoss(found),
    sprite: `/sprites/static/${found.id}.png`,
    animated: `/sprites/gif/${found.id}.gif`,
  };
  if (isBasicWithNext(base, namesWithNext)) {
    const existing = (base.moves || [])
      .map((m) => (typeof m === 'string' ? m : m?.name))
      .filter(Boolean);
    return { ...base, moves: ensureFourWeakMoves(base, existing, movesIndex) };
  }
  return base;
}

/**
 * Retorna os dados de um golpe (nome, tipo, poder, precisão, etc.)
 */
export async function getMove(nameOrId) {
  const rawKey = String(nameOrId || '').toLowerCase();
  const normDash = rawKey.replace(/\s+/g, '-').replace(/_/g, '-');
  const normSpace = rawKey.replace(/[-_]+/g, ' ');
  const candidates = Array.from(new Set([rawKey, normDash, normSpace])).filter(Boolean);

  // Primeiro tenta resolver a partir de moves.json
  try {
    const index = await loadMovesIndex();
    if (index) {
      for (const k of candidates) {
        if (index.has(k)) return index.get(k);
      }
    }
  } catch (_) {
    // Ignora erro e segue para fallbacks
  }

  // Tentativa de inferência para nomes comuns ausentes no moves.json
  const KNOWN_MOVES = {
    'fire-blast': {
      name: 'fire-blast',
      type: 'fire',
      power: 110,
      accuracy: 85,
      damage_class: 'special',
    },
    flamethrower: {
      name: 'flamethrower',
      type: 'fire',
      power: 90,
      accuracy: 100,
      damage_class: 'special',
    },
    'lava-plume': {
      name: 'lava-plume',
      type: 'fire',
      power: 80,
      accuracy: 100,
      damage_class: 'special',
    },
    scald: { name: 'scald', type: 'water', power: 80, accuracy: 100, damage_class: 'special' },
    // Solicitações explícitas
    'meteor-mash': {
      name: 'meteor-mash',
      type: 'steel',
      power: 90,
      accuracy: 90,
      damage_class: 'physical',
    },
    psychic: {
      name: 'psychic',
      type: 'psychic',
      power: 90,
      accuracy: 100,
      damage_class: 'special',
    },
  };
  for (const k of candidates) {
    const key = k.replace(/\s+/g, '-').replace(/_/g, '-');
    if (KNOWN_MOVES[key]) return KNOWN_MOVES[key];
  }

  // Nova: se for um dos golpes fracos conhecidos por tipo, define tipo corretamente
  try {
    const weakMap = new Map();
    for (const [t, arr] of Object.entries(WEAK_MOVES_BY_TYPE || {})) {
      for (const mv of arr) weakMap.set(mv, t);
    }
    for (const k of candidates) {
      const key = k.replace(/\s+/g, '-').replace(/_/g, '-');
      if (weakMap.has(key)) {
        const t = weakMap.get(key);
        return {
          name: key,
          display: key.replace(/-/g, ' '),
          type: t,
          power: 40,
          accuracy: 95,
          damage_class: 'physical',
        };
      }
    }
  } catch (_) {}

  // Heurística simples: prefixo antes do hífen indica tipo (ex.: fire-blast)
  const prefix = normDash.split('-')[0];
  const VALID_TYPES = new Set([
    'normal',
    'fire',
    'water',
    'grass',
    'electric',
    'ice',
    'fighting',
    'poison',
    'ground',
    'flying',
    'psychic',
    'bug',
    'rock',
    'ghost',
    'dragon',
    'dark',
    'steel',
    'fairy',
  ]);
  let inferredType = VALID_TYPES.has(prefix) ? prefix : undefined;
  if (!inferredType) {
    const kw = [
      { t: 'fire', words: ['fire', 'flame', 'lava', 'burn', 'ember'] },
      { t: 'water', words: ['water', 'aqua', 'hydro', 'scald', 'bubble', 'water-gun'] },
      { t: 'electric', words: ['electric', 'thunder', 'volt', 'zap', 'bolt', 'discharge'] },
      { t: 'ice', words: ['ice', 'freeze', 'icy', 'blizzard', 'snow'] },
      { t: 'grass', words: ['grass', 'leaf', 'seed', 'spore', 'vine', 'energy-ball'] },
      { t: 'poison', words: ['poison', 'toxic', 'sludge', 'gunk', 'acid'] },
      { t: 'ground', words: ['ground', 'mud', 'sand', 'earth', 'stomping', 'quake', 'bulldoze'] },
      { t: 'rock', words: ['rock', 'stone', 'slide', 'edge'] },
      { t: 'bug', words: ['bug', 'leech', 'string', 'web', 'sting', 'struggle', 'bite'] },
      { t: 'psychic', words: ['psychic', 'psy', 'psyshock', 'psybeam', 'kinesis', 'zen'] },
      { t: 'ghost', words: ['ghost', 'shadow', 'hex', 'spectral', 'phantom', 'nightmare'] },
      { t: 'dragon', words: ['dragon', 'draco'] },
      { t: 'dark', words: ['dark', 'night', 'snarl', 'crunch', 'foul', 'sucker'] },
      {
        t: 'steel',
        words: [
          'steel',
          'metal',
          'iron',
          'gear',
          'bullet',
          'cannon',
          'meteor-mash',
          'flash-cannon',
          'iron-head',
        ],
      },
      {
        t: 'fairy',
        words: ['fairy', 'gleam', 'kiss', 'charm', 'dazzling', 'draining-kiss', 'dazzling-gleam'],
      },
      { t: 'flying', words: ['flying', 'wing', 'air', 'aerial', 'sky', 'gust', 'peck'] },
    ];
    for (const group of kw) {
      if (group.words.some((w) => normDash.includes(w))) {
        inferredType = group.t;
        break;
      }
    }
  }

  // Fallback: tenta vasculhar a pokédex por segurança (compat antigo)
  try {
    const pokedex = await loadPokedex();
    for (const p of pokedex) {
      const move = (p.moves || []).find((m) => {
        if (!m) return false;
        if (typeof m === 'string') {
          const mk = m.toLowerCase();
          return (
            candidates.includes(mk) ||
            candidates.includes(mk.replace(/\s+/g, '-').replace(/_/g, '-'))
          );
        }
        const mk = String(m.name || '').toLowerCase();
        return (
          candidates.includes(mk) || candidates.includes(mk.replace(/\s+/g, '-').replace(/_/g, '-'))
        );
      });
      if (move)
        return typeof move === 'string'
          ? { name: move, display: move.replace(/-/g, ' '), type: 'normal' }
          : move;
    }
  } catch (_) {}

  // Fallback genérico
  return {
    name: normDash,
    display: normDash.replace(/-/g, ' '),
    power: 40,
    accuracy: 95,
    type: inferredType || 'normal',
    effects: [],
    pp: 35,
  };
}
