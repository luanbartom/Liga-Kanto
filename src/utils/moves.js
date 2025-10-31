// Mapeamento de golpes que alteram estágios e utilidades de descrição

export const STAGE_MOVES = {
  // Reduções no oponente
  "growl": [{ target: "opponent", stat: "attack", delta: -1 }],
  "tail-whip": [{ target: "opponent", stat: "defense", delta: -1 }],
  "tail whip": [{ target: "opponent", stat: "defense", delta: -1 }],
  "leer": [{ target: "opponent", stat: "defense", delta: -1 }],
  "screech": [{ target: "opponent", stat: "defense", delta: -2 }],
  "charm": [{ target: "opponent", stat: "attack", delta: -2 }],
  "feather-dance": [{ target: "opponent", stat: "attack", delta: -2 }],
  "feather dance": [{ target: "opponent", stat: "attack", delta: -2 }],
  "baby-doll-eyes": [{ target: "opponent", stat: "attack", delta: -1 }],
  "baby doll eyes": [{ target: "opponent", stat: "attack", delta: -1 }],
  "play-nice": [{ target: "opponent", stat: "attack", delta: -1 }],
  "play nice": [{ target: "opponent", stat: "attack", delta: -1 }],
  "tickle": [
    { target: "opponent", stat: "attack", delta: -1 },
    { target: "opponent", stat: "defense", delta: -1 },
  ],
  "noble-roar": [
    { target: "opponent", stat: "attack", delta: -1 },
    { target: "opponent", stat: "spAttack", delta: -1 },
  ],
  "noble roar": [
    { target: "opponent", stat: "attack", delta: -1 },
    { target: "opponent", stat: "spAttack", delta: -1 },
  ],
  "tearful-look": [
    { target: "opponent", stat: "attack", delta: -1 },
    { target: "opponent", stat: "spAttack", delta: -1 },
  ],
  "tearful look": [
    { target: "opponent", stat: "attack", delta: -1 },
    { target: "opponent", stat: "spAttack", delta: -1 },
  ],
  "eerie-impulse": [{ target: "opponent", stat: "spAttack", delta: -2 }],
  "eerie impulse": [{ target: "opponent", stat: "spAttack", delta: -2 }],
  "confide": [{ target: "opponent", stat: "spAttack", delta: -1 }],
  "fake-tears": [{ target: "opponent", stat: "spDefense", delta: -2 }],
  "fake tears": [{ target: "opponent", stat: "spDefense", delta: -2 }],
  "metal-sound": [{ target: "opponent", stat: "spDefense", delta: -2 }],
  "metal sound": [{ target: "opponent", stat: "spDefense", delta: -2 }],
  "scary-face": [{ target: "opponent", stat: "speed", delta: -2 }],
  "scary face": [{ target: "opponent", stat: "speed", delta: -2 }],
  "string-shot": [{ target: "opponent", stat: "speed", delta: -1 }],
  "string shot": [{ target: "opponent", stat: "speed", delta: -1 }],
  "cotton-spore": [{ target: "opponent", stat: "speed", delta: -2 }],
  "cotton spore": [{ target: "opponent", stat: "speed", delta: -2 }],
  "sweet-scent": [{ target: "opponent", stat: "evasion", delta: -2 }],
  "sweet scent": [{ target: "opponent", stat: "evasion", delta: -2 }],
  "sand-attack": [{ target: "opponent", stat: "accuracy", delta: -1 }],
  "sand attack": [{ target: "opponent", stat: "accuracy", delta: -1 }],
  "smokescreen": [{ target: "opponent", stat: "accuracy", delta: -1 }],
  "kinesis": [{ target: "opponent", stat: "accuracy", delta: -1 }],
  "flash": [{ target: "opponent", stat: "accuracy", delta: -1 }],

  // Buffs em si mesmo
  "swords-dance": [{ target: "self", stat: "attack", delta: +2 }],
  "swords dance": [{ target: "self", stat: "attack", delta: +2 }],
  "howl": [{ target: "self", stat: "attack", delta: +1 }],
  "meditate": [{ target: "self", stat: "attack", delta: +1 }],
  "sharpen": [{ target: "self", stat: "attack", delta: +1 }],
  "growth": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "spAttack", delta: +1 },
  ],
  "work-up": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "spAttack", delta: +1 },
  ],
  "work up": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "spAttack", delta: +1 },
  ],
  "bulk-up": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "defense", delta: +1 },
  ],
  "bulk up": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "defense", delta: +1 },
  ],
  "dragon-dance": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "speed", delta: +1 },
  ],
  "dragon dance": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "speed", delta: +1 },
  ],
  "hone-claws": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "accuracy", delta: +1 },
  ],
  "hone claws": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "accuracy", delta: +1 },
  ],
  "coil": [
    { target: "self", stat: "attack", delta: +1 },
    { target: "self", stat: "defense", delta: +1 },
    { target: "self", stat: "accuracy", delta: +1 },
  ],
  "iron-defense": [{ target: "self", stat: "defense", delta: +2 }],
  "iron defense": [{ target: "self", stat: "defense", delta: +2 }],
  "acid-armor": [{ target: "self", stat: "defense", delta: +2 }],
  "acid armor": [{ target: "self", stat: "defense", delta: +2 }],
  "barrier": [{ target: "self", stat: "defense", delta: +2 }],
  "harden": [{ target: "self", stat: "defense", delta: +1 }],
  "withdraw": [{ target: "self", stat: "defense", delta: +1 }],
  "cotton-guard": [{ target: "self", stat: "defense", delta: +3 }],
  "cotton guard": [{ target: "self", stat: "defense", delta: +3 }],
  "amnesia": [{ target: "self", stat: "spDefense", delta: +2 }],
  "calm-mind": [
    { target: "self", stat: "spAttack", delta: +1 },
    { target: "self", stat: "spDefense", delta: +1 },
  ],
  "calm mind": [
    { target: "self", stat: "spAttack", delta: +1 },
    { target: "self", stat: "spDefense", delta: +1 },
  ],
  "nasty-plot": [{ target: "self", stat: "spAttack", delta: +2 }],
  "nasty plot": [{ target: "self", stat: "spAttack", delta: +2 }],
  "tail-glow": [{ target: "self", stat: "spAttack", delta: +3 }],
  "tail glow": [{ target: "self", stat: "spAttack", delta: +3 }],
  "charge": [{ target: "self", stat: "spDefense", delta: +1 }],
  "agility": [{ target: "self", stat: "speed", delta: +2 }],
  "rock-polish": [{ target: "self", stat: "speed", delta: +2 }],
  "rock polish": [{ target: "self", stat: "speed", delta: +2 }],
  "autotomize": [{ target: "self", stat: "speed", delta: +2 }],
  "double-team": [{ target: "self", stat: "evasion", delta: +1 }],
  "double team": [{ target: "self", stat: "evasion", delta: +1 }],
  "minimize": [{ target: "self", stat: "evasion", delta: +2 }],
};

const statusLabels = {
  asleep: "Adormece",
  frozen: "Congela",
  burned: "Queima",
  poisoned: "Envenena",
  paralyzed: "Paralisa",
};

const statLabels = {
  attack: "Ataque",
  defense: "Defesa",
  spAttack: "Ataque Esp.",
  spDefense: "Defesa Esp.",
  speed: "Velocidade",
  accuracy: "Precisão",
  evasion: "Evasão",
};

export function describeMove(mv) {
  if (!mv) return "";
  const name = (mv.display || mv.name || "").toString();
  const type = (mv.type || "normal").toString();
  const cls = (mv.damage_class || "").toLowerCase();
  const power = mv.power ?? 0;
  const acc = mv.accuracy ?? 100;

  // Base header
  const parts = [];
  if (cls === "physical") parts.push("Físico");
  else if (cls === "special") parts.push("Especial");
  else parts.push("Status");
  if (power > 0) parts.push(`Poder ${power}`);
  if (acc != null) parts.push(`Precisão ${acc}%`);
  parts.push(`Tipo ${type}`);

  // Stage effects via mapping
  const key = (mv.name || mv.id || "").toString().toLowerCase();
  const defs = STAGE_MOVES[key];
  if (defs && defs.length) {
    const effects = defs.map((d) => `${d.target === "self" ? "Usuário" : "Alvo"} ${statLabels[d.stat] || d.stat} ${d.delta > 0 ? "+" : ""}${d.delta}`);
    parts.push(effects.join("; "));
  }

  // Status conditions via effects
  if (Array.isArray(mv.effects) && mv.effects.length > 0) {
    const se = mv.effects
      .filter((e) => e?.type && statusLabels[e.type])
      .map((e) => `${statusLabels[e.type]} (${e.chance ?? 0}%)`);
    if (se.length) parts.push(se.join("; "));
  }

  return parts.join(" · ");
}

// Tabela de efetividade de tipos (simplificada/compatível com a batalha)
const TYPE_CHART = {
  normal: { rock: 0.5, steel: 0.5, ghost: 0 },
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost: { ghost: 2, psychic: 2, dark: 0.5, normal: 0 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
};

export function typeMultiplier(moveType, defenderTypes) {
  const def = defenderTypes || [];
  return def.reduce((acc, t) => acc * (TYPE_CHART[moveType]?.[t] ?? 1), 1);
}
